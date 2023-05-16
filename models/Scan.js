const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate-v2')

const ScanSchema = mongoose.Schema({
    project_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'projects'
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    scan_name: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ["Pending", "In Progress", "Completed", "Rejected", "Failed"],
        default: 'Pending'
    },
    failed_reason: {
        type: String,
        default: null
    },
    scan_request_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'scan_requests'
    },
    inputVideoId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'file_uploads',
    },
    questions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'scan_question_answers'
    }],
    nsProcessFile: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'file_uploads',
    },
    nsTrainFile: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'file_uploads',
    }
}, { timestamps: true })

ScanSchema.plugin(mongoosePaginate)

module.exports = mongoose.model('scans', ScanSchema);