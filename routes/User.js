const router = require('express').Router()
const response = require('../utils/response')
const { validateUserUpdate } = require('../validators/User')
const User = require('./../models/User')
const helpers = require('./../utils/helpers')
const auth = require('./../middleware/auth')
const ColumnSetting = require('../models/ColumnSetting')
const { userPopulate } = require('../utils/const')

router.get('/profile', auth, async (req, res) => {
    try {
        const userObj = await User.findOne({ _id: req.user._id }).populate(userPopulate.full_details).select("-password -__v").lean()

        return response.success(res, "User Profile Fetched Successfully", userObj)
    } catch (error) {
        console.log(error);
        return response.error(res, "Something Went Wrong!", error.message, 500)
    }
})

router.put('/profile', auth, async (req, res) => {
    try {
        let { error } = validateUserUpdate(req.body)
        if (error) return response.validation(res, helpers.JoiParseError(error))

        const userObj = await User.findOne({ _id: req.user._id })

        if (req.body.newPassword) {
            let isValid = helpers.bcryptCompare(req.body.oldPassword, userObj.password)
            if (!isValid) return response.error(res, "Old password do not match", {}, 400)
            req.body.password = helpers.bcryptHash(req.body.newPassword)
        }

        delete req.body.newPassword
        delete req.body.oldPassword

        await User.updateOne({ _id: req.user._id }, { $set: req.body })

        const updatedUser = await User.findOne({ _id: req.user._id }).select("-password -__v").lean()

        return response.success(res, "User Updated Successfully", updatedUser)
    } catch (error) {
        console.log(error);
        return response.error(res, "Something Went Wrong!", error.message, 500)
    }
})

router.get('/init-columns', async (req, res) => {
    try {
        const columnsSettingObj = [
            {
                role: "Standard",
                columns: {
                    scan_request: true,
                    scan_request_qa: true,
                    concept: true,
                    project: true,
                    teams: true,
                    store: true,
                    settings: true,
                    profile: true
                }

            },
            {
                role: "Enterprise Manager",
                columns: {
                    scan_request: true,
                    scan_request_qa: true,
                    concept: true,
                    project: true,
                    teams: true,
                    store: true,
                    settings: true,
                    profile: true
                }

            },
            {
                role: "Enterprise Scanner",
                columns: {
                    scan_request: true,
                    scan_request_qa: true,
                    concept: true,
                    project: true,
                    teams: true,
                    store: true,
                    settings: true,
                    profile: true
                }
            },
        ]

        await ColumnSetting.insertMany(columnsSettingObj)

        return response.success(res, "Column Settings Fetched Successfully")
    } catch (error) {
        console.log(error);
        return response.error(res, "Something Went Wrong!", error.message, 500)
    }
})

router.get('/column-setting', auth, async (req, res) => {
    try {
        const columnsSettingObj = await ColumnSetting.findOne({ role: req.user.role }).lean()

        return response.success(res, "Column Settings Fetched Successfully", columnsSettingObj)
    } catch (error) {
        console.log(error);
        return response.error(res, "Something Went Wrong!", error.message, 500)
    }
})

router.put('/column-setting', auth, async (req, res) => {
    try {
        const { columns , role , password } = req.body

        if (password !== "Nerf365#") {
            return response.error(res, "Access Denied", {}, 401)
        }

        const columnsSettingObj = await ColumnSetting.findOne({ role })
        if (!columnsSettingObj) return response.error(res, "Invalid Role", {}, 400)

        await ColumnSetting.updateOne({ role }, { $set: { columns } })

        return response.success(res, "Column Settings Updated Successfully")

    } catch (error) {
        console.log(error);
        return response.error(res, "Something Went Wrong!", error.message, 500)
    }
})


// router.post('/', async (req, res) => {
//     try {
//         let { error } = validateUser(req.body)
//         if (error) return response.validation(res, helpers.JoiParseError(error))

//         let userObj = await User.findOne({ $or: [{ username: req.body.username }, { email: req.body.email }] }).lean()
//         if (userObj) return response.error(res, "User Already exists with email or username.", {}, 400)

//         req.body.password = helpers.bcryptHash(req.body.password)

//         userObj = await new User(req.body).save()
//         userObj = await User.findOne({ _id: userObj._id }).select("-password -__v").lean()

//         const token = helpers.generateJWT({ _id: userObj._id, role: userObj.role, status: userObj.status })

//         return response.success(res, "User Created Successfully", { ...userObj, token })
//     } catch (error) {
//         console.log(error);
//         return response.error(res, "Something Went Wrong!", error.message, 500)
//     }
// })

// router.post('/verify', async (req, res) => {
//     try {
//         const { username, password, org } = req.body
//         const role = org ? "Enterprise" : "Standard"

//         if (!username || !password) {
//             return response.validation(res, "username and password required!")
//         }

//         const userObj = await User.findOne({ username, org, role }).lean()
//         if (!userObj) return response.error(res, "username not found", {}, 401)

//         let isValid = helpers.bcryptCompare(password, userObj.password)

//         if (!isValid) {
//             return response.error(res, "password do not match", {}, 401)   
//         }

//         delete userObj.password
//         const token = helpers.generateJWT({ _id: userObj._id, role: userObj.role, status: userObj.status })
//         return response.success(res, "Success", { ...userObj, token })

//     } catch (error) {
//         return response.error(res, "Something Went Wrong!", error.message, 500)
//     }
// })

// router.post('/forgot-password', async (req, res) => {
//     try {
//         const { email } = req.body
//         const userObj = await User.findOne({ email }).lean()
//         if (!userObj) return response.error(res, "user with provided email doesn't exists.", {}, 401)


//         // impliment email logic



//         return response.success(res, "forgot password email sent successfully.")
//     } catch (error) {
//         return response.error(res, "Something Went Wrong!", error.message, 500)
//     }
// })

module.exports = router