const mongoose = require('mongoose')

const ScanRequestCommentSchema = mongoose.Schema({
    scan_request_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'scan_requests'
    },
    comment: {
        type: String,
        required: true
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users'
    },
}, { timestamps: true })

module.exports = mongoose.model('scan_requests_comments', ScanRequestCommentSchema);