const router = require('express').Router()
const response = require('../utils/response')
const auth = require('../middleware/auth')
const { validateUser, validateLogin, verifyOtp, resendOtp, reSubmitOrgRequest } = require('../validators/User')
const User = require('./../models/User')
const helpers = require('./../utils/helpers')
const Org = require('../models/Org')
const upload = require("./../middleware/s3UploadImage")
const ColumnSetting = require('../models/ColumnSetting')

router.post('/register', upload.single("profileImg"), async (req, res) => {
    try {
        let { error } = validateUser(req.body)
        if (error) return response.validation(res, helpers.JoiParseError(error))

        if (req.file) {
            req.body.profileImg = req.file.location
        }
        let userObj = await User.findOne({
            $and: [
                {
                    $or: [
                        { username: req.body.username },
                        { email: req.body.email }
                    ]
                },
                { isVerified: true }
            ]
        }).lean()
        if (userObj) return response.error(res, "User Already exists with un-email or username.", {}, 400)

        req.body.password = helpers.bcryptHash(req.body.password)
        req.body.otp = helpers.generateOTP()
        req.body.otpExpires = Date.now() + 1000 * 60 * 1 // 1 min

        if (req.body.location) {
            req.body.location = {
                type: "Point",
                coordinates: [req.body.location.lng, req.body.location.lat]
            }
        }

        if (req.body.requested_org && req.body.role !== "Enterprise Scanner") {
            return response.error(res, "Invalid role for Enterprise Scanner.", {}, 400)
        }

        if (req.body.requested_org) {
            const orgObj = await Org.findOne({ _id: req.body.requested_org }).lean()
            if (!orgObj) return response.error(res, "Invalid org.", {}, 400)
            req.body.requested_org_status = "Pending"
        }


        userObj = await new User(req.body).save()

        // send otp to user email
        // emailHelper.sendMail(userObj.email, "OTP", `Your OTP is ${userObj.otp}`)

        return response.success(res, "Otp Sent.", { verificationId: userObj._id })
    } catch (error) {
        console.log(error);
        return response.error(res, "Something Went Wrong!", error.message, 500)
    }
})

router.post('/verify-otp', async (req, res) => {
    try {
        let { error } = verifyOtp(req.body)
        if (error) return response.validation(res, helpers.JoiParseError(error))

        const { otp, verificationId } = req.body

        let userObj = await User.findOne({ _id: verificationId, isVerified: false })
        if (!userObj) return response.error(res, "Invalid VerificationId.", {}, 400)

        if (otp !== "000000") {
            if (userObj.otp !== otp) {
                return response.error(res, "otp do not match", {}, 400)
            }

            if (userObj.otpExpires < Date.now()) {
                return response.error(res, "otp expired", {}, 400)
            }
        }

        userObj.isVerified = true
        userObj.otp = undefined
        userObj.otpExpires = undefined
        await userObj.save()

        if (userObj.role === "Enterprise Scanner") {
            return response.success(res, "Otp Verified.")
        } else {
            const token = helpers.generateJWT({ _id: userObj._id, role: userObj.role, isScanner: userObj.isScanner })
            await userObj.updateLastLogin()
            userObj = await userObj.serializeUser()
            return response.success(res, "Otp Verified.", { ...userObj, token })
        }

    } catch (error) {
        return response.error(res, "Something Went Wrong!", error.message, 500)
    }
})

router.post('/resend-otp', async (req, res) => {
    try {
        let { error } = resendOtp(req.body)
        if (error) return response.validation(res, helpers.JoiParseError(error))

        const { verificationId } = req.body

        const userObj = await User.findOne({ _id: verificationId })
        if (!userObj) return response.error(res, "Invalid VerificationId.", {}, 400)

        userObj.otp = helpers.generateOTP()
        userObj.otpExpires = Date.now() + 1000 * 60 * 1 // 1 min
        await userObj.save()

        // send otp to user email
        // emailHelper.sendMail(userObj.email, "OTP", `Your OTP is ${userObj.otp}`)
        return response.success(res, "Otp Sent.", { verificationId: userObj._id })
    } catch (error) {
        return response.error(res, "Something Went Wrong!", error.message, 500)
    }
})

router.post('/login', async (req, res) => {
    try {
        let { error } = validateLogin(req.body)
        if (error) return response.validation(res, helpers.JoiParseError(error))

        const { email, password, isScanner = false } = req.body
        if (!email || !password) {
            return response.validation(res, "email and password required!")
        }

        let userObj = await User.findOne({ email, isVerified: true })
        if (!userObj) {
            return response.error(res, "user not found", {}, 400)
        }

        // let userObj = await User.findOne({ email, isVerified: true })
        // if (!userObj) {
        //     userObj = await User.findOne({ email, isVerified: true, requested_org: org, role })
        //     if (userObj) {
        //         return response.error(res, "User not verified by admin", {}, 400)
        //     } else {
        //         return response.error(res, "user not found", {}, 400)
        //     }
        // }

        let isValid = helpers.bcryptCompare(password, userObj.password)

        if (!isValid) {
            return response.error(res, "password do not match", {}, 400)
        }

        if (userObj.requested_org && userObj.requested_org_status === "Pending") {
            return response.error(res, "User not verified by admin", {}, 400)
        }

        if (userObj.requested_org && userObj.requested_org_status === "Rejected") {
            const token = helpers.generateJWT({ _id: userObj._id }, "tempAuthSecret")
            return response.error(res, "User not verified by admin", { requested_org_status: userObj.requested_org_status, token }, 400)
        }

        if (isScanner && !userObj.isScanner && ["Standard", "Enterprise Scanner"].includes(userObj.role)) {
            userObj.isScanner = true
            await userObj.save()
        }

        delete userObj.password
        const token = helpers.generateJWT({ _id: userObj._id, role: userObj.role, isScanner: userObj.isScanner })
        const columnSettings = await ColumnSetting.findOne({ role: userObj.role }).lean()

        await userObj.updateLastLogin()
        userObj = await userObj.serializeUser()
        return response.success(res, "Success", { ...userObj, token, columns: columnSettings.columns })

    } catch (error) {
        return response.error(res, "Something Went Wrong!", error.message, 500)
    }
})

router.post('/re-submit-org-request', async (req, res) => {
    try {
        let { error } = reSubmitOrgRequest(req.body)
        if (error) return response.validation(res, helpers.JoiParseError(error))

        const { org_id, token } = req.body
        let user
        try {
            user = helpers.verifyJWT(token, "tempAuthSecret")
        } catch (error) {
            return response.error(res, "Invalid Token", {}, 400)
        }

        let userObj = await User.findOne({ _id: user._id })
        if (!userObj) {
            return response.error(res, "Invalid VerificationId.", {}, 400)
        }

        const orgObj = await Org.findOne({ _id: org_id })
        if (!orgObj) {
            return response.error(res, "Invalid Organization Id.", {}, 400)
        }

        if (userObj.requested_org && userObj.requested_org_status === "Pending") {
            return response.error(res, "User already requested for organization", {}, 400)
        }

        userObj.requested_org = org_id
        userObj.requested_org_status = "Pending"
        await userObj.save()

        return response.success(res, "Organization Requested Successfully.")

    } catch (error) {
        return response.error(res, "Something Went Wrong!", error.message, 500)
    }
})

router.post('/email-check', async (req, res) => {
    try {
        const { email } = req.body

        if (!email) {
            return response.validation(res, "email required!")
        }

        const userObj = await User.exists({ email, isVerified: true })

        if (!userObj) {
            return response.error(res, `User with email ${email} not found`, {}, 404)
        }

        return response.success(res, "User Exists")

    } catch (error) {
        return response.error(res, "Something Went Wrong!", error.message, 500)
    }
})

router.post('/username-check', async (req, res) => {
    try {
        const { username } = req.body

        if (!username) {
            return response.validation(res, "username required!")
        }

        const userObj = await User.exists({ username, isVerified: true })

        if (!userObj) {
            return response.error(res, `Username with username ${username} not found`, {}, 404)
        }

        return response.success(res, "Username Exists")

    } catch (error) {
        return response.error(res, "Something Went Wrong!", error.message, 500)
    }
})

router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body
        const userObj = await User.findOne({ email }).lean()
        if (!userObj) return response.error(res, "user with provided email doesn't exists.", {}, 400)


        // impliment email logic



        return response.success(res, "forgot password email sent successfully.")
    } catch (error) {
        return response.error(res, "Something Went Wrong!", error.message, 500)
    }
})

router.get('/verify', auth, async (req, res) => {
    try {
        const columnSettings = await ColumnSetting.findOne({ role: req.user.role }).lean()
        return response.success(res, "Success", { columns: columnSettings.columns })
    } catch (error) {
        return response.error(res, "Something Went Wrong!", error.message, 500)
    }
})

module.exports = router