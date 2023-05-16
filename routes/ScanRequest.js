const router = require('express').Router()
const response = require('../utils/response')
const { ValidateAddScanRequest, ValidateRequestReScan, ValidateComment } = require('../validators/ScanRequest')
const helpers = require('../utils/helpers')
const ScanRequest = require('../models/ScanRequest')
const access = require('../middleware/access')
const { userPopulate, scanPopulate } = require('../utils/const')
const { addNotification } = require('../controllers/NotificationController')
const { NotificationTypes } = require('../utils/const')
const ScanRequestComments = require('../models/ScanRequestComments')
const Project = require('../models/Project')
const upload = require('../middleware/s3UploadImage')

router.post('/', upload.single("image"), async (req, res) => {
    try {
        let { error } = ValidateAddScanRequest(req.body)
        if (error) return response.validation(res, helpers.JoiParseError(error))

        if (req.body.project_id) {
            const projectObj = await Project.findOne({ _id: req.body.project_id, owner_id: req.user._id })
            if (!projectObj) return response.error(res, "Invalid Project Id!", {}, 400)
        }

        req.body.owner_id = req.user._id
        req.body.location = {
            type: "Point",
            coordinates: [req.body.location.lng, req.body.location.lat]
        }
        let scanRequest = await ScanRequest.create(req.body)

        return response.success(res, "Scan Request Created Successfully", scanRequest)
    } catch (error) {
        console.log(error);
        return response.error(res, "Something Went Wrong!", error.message, 500)
    }
})

router.get('/', async (req, res) => {
    try {
        const scanRequests = await ScanRequest
            .find({ $or: [{ owner_id: req.user._id }, { scanner_id: req.user._id }] })
            .populate([
                { path: "proposals", select: userPopulate.basic }, 
                { path: "scanner_id", select: userPopulate.basic },
                { path: "scan_id", populate: scanPopulate }
            ])
            .sort({ createdAt: -1 })

        return response.success(res, "Scan Requests Fetched Successfully", scanRequests)
    } catch (error) {
        console.log(error);
        return response.error(res, "Something Went Wrong!", error.message, 500)
    }
})

router.get('/new', async (req, res) => {
    try {
        const scanRequests = await ScanRequest.find({ status: "New" }).sort({ createdAt: -1 })

        return response.success(res, "Scan Requests Fetched Successfully", scanRequests)
    } catch (error) {
        console.log(error);
        return response.error(res, "Something Went Wrong!", error.message, 500)
    }
})

router.get('/:id', async (req, res) => {
    try {
        const scanRequestObj = await ScanRequest
            .findOne({ _id: req.params.id, $or: [{ owner_id: req.user._id }, { scanner_id: req.user._id }] })
            .populate([{ path: "proposals", select: userPopulate.basic }, { path: "scanner_id", select: userPopulate.basic }])

        return response.success(res, "Scan Request Fetched Successfully", scanRequestObj)
    } catch (error) {
        console.log(error);
        return response.error(res, "Something Went Wrong!", error.message, 500)
    }
})

router.post('/make-proposals', access("scanner"), async (req, res) => {
    try {
        const { scan_request_id } = req.body

        const scanRequests = await ScanRequest.findOne({ _id: scan_request_id })

        if (!scanRequests) return response.error(res, "Scan Request Not Found!", {}, 404)

        if (scanRequests.status !== "New") return response.error(res, "Scan Request Already Has Proposals!", {}, 400)

        if (scanRequests.proposals.find(x => x.toString() === req.user._id.toString())) return response.error(res, "You Have Already Made A Proposal!", {}, 400)

        await ScanRequest.updateOne({ _id: scan_request_id }, { $push: { proposals: req.user._id } })

        return response.success(res, "Scan Requests Proposal sends Successfully")
    } catch (error) {
        console.log(error);
        return response.error(res, "Something Went Wrong!", error.message, 500)
    }
})

router.post('/accept-proposal', async (req, res) => {
    try {
        const { scan_request_id, user_id } = req.body

        const scanRequests = await ScanRequest.findOne({ _id: scan_request_id, owner_id: req.user._id })

        if (!scanRequests) return response.error(res, "Scan Request Not Found!", {}, 404)

        if (scanRequests.status !== "New") return response.error(res, "Already Accepted Antoher Proposal!", {}, 400)

        scanRequests.proposals = scanRequests.proposals.map(user_id => user_id.toString())

        if (!scanRequests.proposals.includes(user_id)) return response.error(res, "This User Has Not Made Any Proposal!", {}, 400)

        await ScanRequest.updateOne({ _id: scan_request_id }, { $set: { status: "Accepted", scanner_id: req.body.user_id } })

        await addNotification({
            type: NotificationTypes.SCAN_PROPOSAL_ACCEPTED,
            user_id: req.body.user_id,
            title: "Scan Proposal Accepted",
            message: "Your Proposal Has Been Accepted By The Owner",
            metadata: {
                scan_request_id: scan_request_id
            }
        })

        return response.success(res, "Scan Requests Proposal Accepted Successfully")
    } catch (error) {
        console.log(error);
        return response.error(res, "Something Went Wrong!", error.message, 500)
    }
})

router.post('/approve-scan', async (req, res) => {
    try {
        const { scan_request_id } = req.body

        const scanRequests = await ScanRequest.findOne({ _id: scan_request_id, owner_id: req.user._id })

        if (!scanRequests) return response.error(res, "Scan Request Not Found!", {}, 404)
        if (!scanRequests.scan_id) return response.error(res, "Scan Not Found!", {}, 404)
        if (scanRequests.status === "Completed") return response.error(res, "Scan Already Completed!", {}, 400)

        await ScanRequest.updateOne({ _id: scan_request_id }, { $set: { status: "Completed" } })

        return response.success(res, "Scan Approved Successfully")
    } catch (error) {
        console.log(error);
        return response.error(res, "Something Went Wrong!", error.message, 500)
    }
})

router.post('/re-scan-request', async (req, res) => {
    try {
        const { error } = ValidateRequestReScan(req.body)
        if (error) return response.validation(res, helpers.JoiParseError(error))

        const { scan_request_id, reason, deadline, remarks } = req.body

        const scanRequests = await ScanRequest.findOne({ _id: scan_request_id, owner_id: req.user._id })

        if (!scanRequests) return response.error(res, "Scan Request Not Found!", {}, 404)
        if (!scanRequests.scan_id) return response.error(res, "Scan Not Found!", {}, 404)
        if (scanRequests.status === "Completed") return response.error(res, "Scan Already Completed!", {}, 400)
        if (scanRequests.status === "In Revision") return response.error(res, "Scan Already In Revision!", {}, 400)

        await ScanRequest.updateOne({ _id: scan_request_id }, { $set: { status: "In Revision", reason, deadline, remarks } })

        return response.success(res, "Rescan Requests Submitted Successfully")
    } catch (error) {
        console.log(error);
        return response.error(res, "Something Went Wrong!", error.message, 500)
    }
})

router.post('/add-comment', async (req, res) => {
    try {
        const { error } = ValidateComment(req.body)
        if (error) return response.validation(res, helpers.JoiParseError(error))

        const { scan_request_id, comment } = req.body

        let scanRequest = await ScanRequest.findOne({
            $and: [
                { _id: scan_request_id },
                {
                    $or: [
                        { owner_id: req.user._id },
                        { scanner_id: req.user._id }
                    ]
                }
            ]
        })

        if (!scanRequest) return response.error(res, "Scan Request Not Found!", {}, 404)

        await ScanRequestComments.create({
            scan_request_id,
            user_id: req.user._id,
            comment
        })

        return response.success(res, "Comment Added Successfully")
    } catch (error) {
        console.log(error);
        return response.error(res, "Something Went Wrong!", error.message, 500)
    }
})

router.post('/get-comment', async (req, res) => {
    try {
        const { scan_request_id } = req.body

        let scanRequest = await ScanRequest.findOne({
            $and: [
                { _id: scan_request_id },
                {
                    $or: [
                        { owner_id: req.user._id },
                        { scanner_id: req.user._id }
                    ]
                }
            ]
        })

        if (!scanRequest) return response.error(res, "Scan Request Not Found!", {}, 404)

        const comments = await ScanRequestComments
            .find({ scan_request_id })
            .populate('user_id', userPopulate.basic)
            .sort({ createdAt: -1 })

        return response.success(res, "Comments Fetched Successfully", comments)
    } catch (error) {
        console.log(error);
        return response.error(res, "Something Went Wrong!", error.message, 500)
    }
})

module.exports = router