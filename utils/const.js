exports.fileUploadTypes = Object.freeze({
    '1': 'video',
    '2': 'image'
})

exports.userPopulate = Object.freeze({
    basic: "full_name profileImg email",
    full_details: Object.freeze([
        {
            path: 'org',
            select: 'org_name'
        },
    ])
})

exports.orgPopulate = Object.freeze([
    {
        path: 'createdBy',
        select: this.userPopulate.basic
    },
    {
        path: 'teams',
        select: 'user_id max_users',
        populate: {
            path: 'user_id',
            select: this.userPopulate.basic
        }
    }
])

exports.scanPopulate = Object.freeze([
    {
        path: 'project_id',
        select: 'name'
    },
    {
        path: "scan_request_id",
        select: 'category scan_capture_intent scan_type status image'
    },
    {
        path: 'inputVideoId',
        select: 'originalname filepath size mimetype'
    },
    {
        path: 'user_id',
        select: this.userPopulate.basic
    },
    {
        path: 'questions'
    }
])

exports.NotificationTypes = Object.freeze({
    SCAN_PROPOSAL_ACCEPTED: "ScanProposalAccepted"
})

exports.S3_BUCKET_NAME = Object.freeze({
    VIDEO: 'video-soar3d-new',
    NERF: 'nerf-soar3d-new',
})