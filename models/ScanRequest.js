const mongoose = require('mongoose')

const ScanRequestSchema = mongoose.Schema({
    project_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'projects'
    },
    owner_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users'
    },
    status: {
        type: String,
        enum: ['Accepted', 'New', "Scan Submitted" , 'Completed', 'In Revision'],
        default: 'New'
    },
    category: {
        type: String,
        enum: ['3d Scan', 'Video Scan'],
        required: true
    },
    scan_capture_intent: {
        type: String,
        enum: ['Object', 'Building', 'Scene'],
        required: true
    },
    subtitle: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    image: {
        type: String,
    },
    questions: [{
        type: String
    }],
    location: mongoose.Schema({
        type: {
            type: String,
            enum: ['Point'],
            required: true
        },
        coordinates: {
            type: [Number],
            required: true
        }
    }, { _id: false }),
    timeAllowed: {
        type: String,
        required: true
    },
    scan_type: {
        type: String,
        enum: ['Single', 'Full'],
        required: true
    },
    report_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'scan_reports'
    },
    scanner_count: {
        type: Number,
        required: true
    },
    proposals: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users'
    }],
    scanner_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users'
    },
    scan_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'scans'
    },
    reason: {
        type: String
    },
    deadline: {
        type: Date
    },
    remarks: {
        type: String
    },

}, { timestamps: true })

module.exports = mongoose.model('scan_requests', ScanRequestSchema);