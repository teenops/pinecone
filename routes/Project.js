const router = require('express').Router()
const response = require('../utils/response')
const { ValidateAddProject } = require('../validators/Project')
const helpers = require('../utils/helpers')
const Project = require('../models/Project')
const Scan = require('../models/Scan')

router.post('/', async (req, res) => {
    try {
        let { error } = ValidateAddProject(req.body)
        if (error) return response.validation(res, helpers.JoiParseError(error))

        // if (req.user.role !== "Enterprise Manager") {
        //     return response.error(res, "You are not authorized to create project", {}, 401)
        // }
        req.body.user_id = req.user._id

        if (req.body.location) {
            req.body.location = {
                type: "Point",
                coordinates: [req.body.location.lng, req.body.location.lat]
            }
        }

        const projectObj = await new Project(req.body).save()

        return response.success(res, "Project Created Successfully", projectObj)
    } catch (error) {
        console.log(error);
        return response.error(res, "Something Went Wrong!", error.message, 500)
    }
})

router.get('/', async (req, res) => {
    try {
        const projectObj = await Project
        .find({ user_id: req.user._id })
        .populate({
            path: 'scans',
            options: { sort: { createdAt: -1 } }
        })
        .sort({ createdAt: -1 }).lean()

        return response.success(res, "Projects Fetched Successfully", projectObj)
    } catch (error) {
        console.log(error);
        return response.error(res, "Something Went Wrong!", error.message, 500)
    }
})

router.get('/list', async (req, res) => {
    try {

        const projectObj = await Project.find({ user_id: req.user._id }, { __v: 0, user_id: 0, updatedAt: 0 }).sort({ name: 1 })

        return response.success(res, "Scan Request Created Successfully", projectObj)
    } catch (error) {
        console.log(error);
        return response.error(res, "Something Went Wrong!", error.message, 500)
    }
})


module.exports = router