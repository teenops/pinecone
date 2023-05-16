const router = require('express').Router()
const response = require('../utils/response')
const helpers = require('../utils/helpers')
const { ValidateAddScanSubmissionRequest, validateScanReport } = require('../validators/Scan')
const FileUpload = require('../models/FileUpload')
const ScanRequest = require('../models/ScanRequest')
const Scan = require('../models/Scan')
const { scanPopulate } = require('../utils/const')
const Project = require('../models/Project')
const access = require('../middleware/access')
const ScanQA = require('../models/ScanQA')
const { addToNSprocessQueue } = require('../bull/NSprocessQueue')
const { addToNStrainQueue } = require('../bull/NStrainQueue')

router.post('/', access("scanner"), async (req, res) => {
    try {
        let { error } = ValidateAddScanSubmissionRequest(req.body)
        if (error) return response.validation(res, helpers.JoiParseError(error))

        req.body.user_id = req.user._id

        const videoExists = await FileUpload.exists({ _id: req.body.inputVideoId })
        if (!videoExists) return response.error(res, "Video Not Found!", {}, 404)

        if (req.body.scan_request_id) {
            const scanRequestObj = await ScanRequest.findOne({ _id: req.body.scan_request_id })
            if (!scanRequestObj) return response.error(res, "Scan Request Not Found!", {}, 404)

            if (scanRequestObj?.scanner_id?.toString() !== req.user._id.toString()) {
                return response.error(res, "You are not authorized to submit this scan request!", {}, 401)
            }

            req.body.project_id = scanRequestObj.project_id

            if (scanRequestObj.status === "Completed") return response.error(res, "Scan Request Already Completed!", {}, 400)
            if (scanRequestObj.status === "New") return response.error(res, "Scan Request Not Accepted Yet!", {}, 400)
            if (scanRequestObj.status === "Scan Submitted") return response.error(res, "Scan Already Submitted!", {}, 400)

            await ScanRequest.updateOne({ _id: req.body.scan_request_id }, { $set: { status: "Scan Submitted" } })
        }

        const scanRequest = await Scan.create(req.body)

        if (req.body.scan_request_id) {
            const scanRequestObj = await ScanRequest.findOne({ _id: req.body.scan_request_id })
            scanRequestObj.scan_id = scanRequest._id
            await scanRequestObj.save()
            await Project.updateOne(
                { _id: scanRequestObj.project_id },
                {
                    $inc: { scan_count: 1 },
                    $set: { last_scan_date: Date.now(), last_scan: scanRequest._id },
                    $push: { scans: scanRequest._id }
                })
            const scanQAs = scanRequestObj.questions.map(question => {
                return {
                    scan_id: scanRequest._id,
                    question,
                    user_id: req.user._id
                }
            })
            let questions = await ScanQA.insertMany(scanQAs)
            await Scan.updateOne({ _id: scanRequest._id }, { $set: { questions: questions.map(qa => qa._id) } })
            scanRequest.questions = questions
        }

        // TODO: Start Bull Process to process the scan request
        addToNSprocessQueue({ scanId: scanRequest._id })

        return response.success(res, "Scan Submitted Successfully", scanRequest)
    } catch (error) {
        console.log(error);
        return response.error(res, "Something Went Wrong!", error.message, 500)
    }
})

router.post('/report', access("scanner"), async (req, res) => {
    try {
        let { error } = validateScanReport(req.body)
        if (error) return response.validation(res, helpers.JoiParseError(error))

        const { scan_id, questions } = req.body

        const scanObj = await Scan.findOne({ _id: scan_id, user_id: req.user._id })
        if (!scanObj) return response.error(res, "Scan Not Found!", {}, 404)

        if (questions) {
            for (let i = 0; i < questions.length; i++) {
                const question = questions[i];
                await ScanQA.updateOne(
                    { _id: question._id },
                    {
                        $set: {
                            answer: question.answer,
                            answer_type: question.answer_type,
                            answered_date: Date.now(),
                            is_answered: true
                        }
                    }
                )
            }
        }


        await scanObj.save()
        return response.success(res, "Scan Report Submitted Successfully")

    } catch (error) {
        console.log(error);
        return response.error(res, "Something Went Wrong!", error.message, 500)
    }
})

router.get('/report', access("scanner"), async (req, res) => {
    try {
        const { scan_id } = req.query

        const scanObj = await Scan.findOne({ _id: scan_id, user_id: req.user._id })
        if (!scanObj) return response.error(res, "Scan Not Found!", {}, 404)

        const scanReport = await ScanQA.find({ scan_id: scan_id }).select("-scan_id -user_id -__v -updatedAt").sort({ _id: 1 })

        return response.success(res, "Scan Report Fetched Successfully", scanReport)

    } catch (error) {
        console.log(error);
        return response.error(res, "Something Went Wrong!", error.message, 500)
    }
})


router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 10, search, sort = -1, project } = req.query

        const options = {
            page: page,
            limit: limit,
            sort: { createdAt: sort },
            populate: scanPopulate,
            lean: true
        }

        let query = { user_id: req.user._id }

        if (project) {
            query.project_id = project
        }

        const scans = await Scan.paginate(query, options)
        scans.TotalCompletedScans = await Scan.countDocuments({ user_id: req.user._id, status: "Completed" })

        return response.success(res, "Scans Fetched Successfully", scans)
    } catch (error) {
        console.log(error);
        return response.error(res, "Something Went Wrong!", error.message, 500)
    }
})

router.get('/:scanId', async (req, res) => {
    try {
        const scans = await Scan.findOne({ _id: req.params.scanId, user_id: req.user._id }).populate(scanPopulate).sort({ createdAt: -1 })
        if (!scans) {
            return response.error(res, "Scan Not Found!", {}, 404)
        }

        return response.success(res, "Scan Fetched Successfully", scans)
    } catch (error) {
        console.log(error);
        return response.error(res, "Something Went Wrong!", error.message, 500)
    }
})

router.get('/:scanId/status', async (req, res) => {
    try {
        const scans = await Scan.findOne({ _id: req.params.scanId, user_id: req.user._id }).populate(scanPopulate).sort({ createdAt: -1 })
        if (!scans) {
            return response.error(res, "Scan Not Found!", {}, 404)
        }

        return response.success(res, "Scan Fetched Successfully", scans)
    } catch (error) {
        console.log(error);
        return response.error(res, "Something Went Wrong!", error.message, 500)
    }
})

router.post('/process/ns-process', async (req, res) => {
    try {
        const { scanId } = req.body

        addToNSprocessQueue({ scanId })

        return response.success(res, "Scans Fetched Successfully")
    } catch (error) {
        console.log(error);
        return response.error(res, "Something Went Wrong!", error.message, 500)
    }
})

router.post('/process/ns-train', async (req, res) => {
    try {
        const { scanId } = req.body

        addToNStrainQueue({ scanId })

        return response.success(res, "Scans Fetched Successfully")
    } catch (error) {
        console.log(error);
        return response.error(res, "Something Went Wrong!", error.message, 500)
    }
})

module.exports = router
