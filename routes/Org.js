const router = require('express').Router()
const response = require('../utils/response')
const Org = require('../models/Org')
const helpers = require('../utils/helpers')
const { validateOrganization, validateAddRemoveTeamMember, validateAddRemoveAdmin, validateAddRemoveOrgRequest } = require('../validators/Org')
const auth = require('../middleware/auth')
const OrgTeam = require('../models/OrgTeam')
const OrgUser = require('../models/OrgUser')
const User = require('../models/User')
const { orgPopulate, userPopulate } = require('../utils/const')
const access = require('../middleware/access')

router.post('/', auth, async (req, res) => {
    try {
        let { error } = validateOrganization(req.body)
        if (error) return response.validation(res, helpers.JoiParseError(error))

        const userObj = await User.findOne({ _id: req.user._id }).lean()
        if (userObj.role !== "Enterprise Manager") {
            return response.error(res, "You are not authorized to create organization.", {}, 400)
        }

        if (userObj.org) {
            return response.error(res, "You are already associated with an organization.", {}, 400)
        }

        let orgObj = await Org.findOne({ org_name: req.body.org_name }).lean()
        if (orgObj) return response.error(res, "Organization Already exists with this name.", {}, 400)

        req.body.createdBy = req.user._id

        if (req.body.location) {
            req.body.location = {
                type: "Point",
                coordinates: [req.body.location.lng, req.body.location.lat]
            }
        }

        const { teams, ...orgReq } = req.body

        orgObj = new Org(orgReq)

        // removed teams logic
        // check if all users are valid
        // const users = teams.map(team => team.user_id).flat()
        // const isValid = await User.countDocuments({ _id: { $in: users } })
        // if (isValid !== users.length) return response.error(res, "Invalid User Ids", {}, 400)

        // for (const team of teams) {
        //     const orgTeamObj = new OrgTeam(team)
        //     orgTeamObj.org_id = orgObj._id
        //     orgObj.teams.push(orgTeamObj)

        //     for (const user of team.user_id) {
        //         await OrgUser.create({ user_id: user, org_id: orgObj._id, team_id: orgTeamObj._id })
        //     }
        //     await orgTeamObj.save()
        // }

        await OrgUser.create({ user_id: req.user._id, org_id: orgObj._id, type: 'admin' })
        await User.updateOne({ _id: req.user._id }, { org: orgObj._id })
        orgObj = await orgObj.save()

        orgObj = await Org.findOne({ _id: orgObj._id }).populate(orgPopulate).lean()

        return response.success(res, "Organization Created Successfully", orgObj)
    } catch (error) {
        console.log(error);
        return response.error(res, "Something Went Wrong!", error.message, 500)
    }
})

router.get('/', auth, async (req, res) => {
    try {
        const orgObj = await Org.find().populate(orgPopulate).lean()

        return response.success(res, "Organizations Fetched Successfully", orgObj)
    } catch (error) {
        console.log(error);
        return response.error(res, "Something Went Wrong!", error.message, 500)
    }
})

router.get('/list', async (req, res) => {
    try {
        const { search } = req.query
        const query = {}

        if (search) {
            query.org_name = { $regex: search, $options: 'i' }
        }

        const orgObj = await Org.find(query, { org_name: 1 }).lean()

        return response.success(res, "Organizations Fetched Successfully", orgObj)
    } catch (error) {
        console.log(error);
        return response.error(res, "Something Went Wrong!", error.message, 500)
    }
})

router.get('/requests', auth, access("manager"), async (req, res) => {
    try {

        const orgObj = await Org.findOne({ createdBy: req.user._id }).lean()
        if (!orgObj) return response.error(res, "Organization Not Found", {}, 404)

        const userRequests = await User.find({ requested_org: orgObj._id }).select(userPopulate.basic).lean()

        return response.success(res, "Organization Requests Fetched Successfully", userRequests)

    } catch (error) {
        console.log(error);
        return response.error(res, "Something Went Wrong!", error.message, 500)
    }
})

router.post('/requests', auth, access("manager"), async (req, res) => {
    try {
        let { error } = validateAddRemoveOrgRequest(req.body)
        if (error) return response.validation(res, helpers.JoiParseError(error))

        const orgObj = await Org.findOne({ createdBy: req.user._id }).lean()
        if (!orgObj) return response.error(res, "Organization Not Found", {}, 404)

        const userObj = await User.findOne({ _id: req.body.user_id , requested_org: orgObj._id })
        if (!userObj) return response.error(res, "User Not Found", {}, 404)

        if (req.body.flag) {
            await OrgUser.create({ user_id: userObj._id, org_id: orgObj._id, type: 'user' })
            await User.updateOne({ _id: userObj._id }, { $unset: { requested_org: 1 }, $set: { org: orgObj._id , requested_org_status: "Accepted" } })
            return response.success(res, "Organization Request Accepted Successfully", {})
        } else {
            await User.updateOne({ _id: userObj._id }, { $set: { requested_org_status: "Rejected" } })
            return response.success(res, "Organization Request Rejeted Successfully", {})
        }

    } catch (error) {
        console.log(error);
        return response.error(res, "Something Went Wrong!", error.message, 500)
    }
})

router.get('/:id', auth, async (req, res) => {
    try {
        const orgObj = await Org.findOne({ _id: req.params.id }).populate(orgPopulate).lean()
        if (!orgObj) return response.error(res, "Organization Not Found", {}, 404)

        return response.success(res, "Organization Fetched Successfully", orgObj)
    } catch (error) {
        console.log(error);
        return response.error(res, "Something Went Wrong!", error.message, 500)
    }
})

router.put('/:id', auth, async (req, res) => {
    try {
        let { error } = validateOrganization(req.body)
        if (error) return response.validation(res, helpers.JoiParseError(error))

        let orgObj = await Org.findOne({ _id: req.params.id }).lean()
        if (!orgObj) return response.error(res, "Organization Not Found", {}, 404)

        const isAdmin = await OrgUser.findOne({ user_id: req.user._id, org_id: orgObj._id, type: 'admin' }).lean()

        if (!isAdmin) {
            return response.error(res, "You are not authorized to update this organization", {}, 401)
        }

        const { teams, ...orgReq } = req.body

        // check if all users are valid
        const users = teams.map(team => team.user_id).flat()
        const isValid = await User.countDocuments({ _id: { $in: users } })
        if (isValid !== users.length) return response.error(res, "Invalid User Ids", {}, 400)

        orgObj = await Org.findOneAndUpdate({ _id: req.params.id }, orgReq, { new: true }).lean()

        // delete all teams and users
        await OrgTeam.deleteMany({ org_id: orgObj._id })
        await OrgUser.deleteMany({ org_id: orgObj._id })

        for (const team of teams) {
            const orgTeamObj = new OrgTeam(team)
            orgTeamObj.org_id = orgObj._id
            orgObj.teams.push(orgTeamObj)

            for (const user of team.user_id) {
                await OrgUser.create({ user_id: user, org_id: orgObj._id, team_id: orgTeamObj._id })
            }
            await orgTeamObj.save()
        }
        await OrgUser.create({ user_id: req.user._id, org_id: orgObj._id, type: 'admin' })

        orgObj = await Org.findOne({ _id: orgObj._id }).populate(orgPopulate).lean()

        return response.success(res, "Organization Updated Successfully", orgObj)
    } catch (error) {
        console.log(error);
        return response.error(res, "Something Went Wrong!", error.message, 500)
    }
})


router.delete('/:id', auth, async (req, res) => {
    try {
        let orgObj = await Org.findOne({ _id: req.params.id }).lean()
        if (!orgObj) return response.error(res, "Organization Not Found", {}, 404)

        const isAdmin = await OrgUser.findOne({ user_id: req.user._id, org_id: orgObj._id, type: 'admin' }).lean()

        if (!isAdmin) {
            return response.error(res, "You are not authorized to delete this organization", {}, 401)
        }

        await Org.deleteOne({ _id: req.params.id })
        await OrgTeam.deleteMany({ org_id: orgObj._id })
        await OrgUser.deleteMany({ org_id: orgObj._id })

        return response.success(res, "Organization Deleted Successfully", {})
    } catch (error) {
        console.log(error);
        return response.error(res, "Something Went Wrong!", error.message, 500)
    }
})

router.post('/team/add-remove-member', auth, async (req, res) => {
    try {
        let { error } = validateAddRemoveTeamMember(req.body)
        if (error) return response.validation(res, helpers.JoiParseError(error))

        const teamObj = await OrgTeam.findOne({ _id: req.body.team_id }).lean()
        if (!teamObj) return response.error(res, "Team Not Found", {}, 404)

        const isAdmin = await OrgUser.findOne({ user_id: req.user._id, org_id: teamObj.org_id, type: 'admin' }).lean()

        if (!isAdmin) {
            return response.error(res, "You are not authorized to add member in this team", {}, 401)
        }

        const isValid = await User.countDocuments({ _id: req.body.user_id })
        if (isValid !== 1) return response.error(res, "Invalid User Id", {}, 400)



        const isAlreadyExists = await OrgUser.findOne({ user_id: req.body.user_id, org_id: teamObj.org_id }).lean()
        if (isAlreadyExists && isAlreadyExists.team_id.toString() !== req.body.team_id) {
            return response.error(res, "User already exists in other team", {}, 400)
        }
        const flag = isAlreadyExists ? false : true

        if (flag) {
            await OrgUser.create({ user_id: req.body.user_id, org_id: teamObj.org_id, team_id: teamObj._id, added_by: req.user._id })
            await OrgTeam.updateOne({ _id: teamObj._id }, { $push: { user_id: req.body.user_id } })
            return response.success(res, "Member Added Successfully", {})
        } else {
            await OrgUser.deleteOne({ user_id: req.body.user_id, org_id: teamObj.org_id, team_id: teamObj._id })
            await OrgTeam.updateOne({ _id: teamObj._id }, { $pull: { user_id: req.body.user_id } })
            return response.success(res, "Member Removed Successfully", {})
        }

    } catch (error) {
        console.log(error);
        return response.error(res, "Something Went Wrong!", error.message, 500)
    }
})


router.post('/team/add-remove-admin', auth, async (req, res) => {
    try {
        let { error } = validateAddRemoveAdmin(req.body)
        if (error) return response.validation(res, helpers.JoiParseError(error))

        const orgObj = await Org.findOne({ _id: req.body.org_id }).lean()
        if (!orgObj) return response.error(res, "Organization Not Found", {}, 404)

        const isAdmin = await OrgUser.findOne({ user_id: req.user._id, org_id: orgObj.org_id, type: 'admin' }).lean()

        if (!isAdmin) {
            return response.error(res, "You are not authorized to add member in this team", {}, 401)
        }

        const isValid = await User.countDocuments({ _id: req.body.user_id })
        if (isValid !== 1) return response.error(res, "Invalid User Id", {}, 400)

        const isAlreadyExists = await OrgUser.findOne({ user_id: req.body.user_id, org_id: teamObj.org_id, type: 'admin' }).lean()
        const flag = isAlreadyExists ? false : true

        if (flag) {
            await OrgUser.create({ user_id: req.body.user_id, org_id: orgObj.org_id, type: 'admin', added_by: req.user._id })
            return response.success(res, "Admin Added Successfully", {})
        } else {
            await OrgUser.deleteOne({ user_id: req.body.user_id, org_id: orgObj.org_id, type: 'admin' })
            return response.success(res, "Admin Removed Successfully", {})
        }


    } catch (error) {
        console.log(error);
        return response.error(res, "Something Went Wrong!", error.message, 500)
    }
})



module.exports = router