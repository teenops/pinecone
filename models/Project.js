const mongoose = require('mongoose')

const ProjectSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    description: {
        type: String,
        required: true
    },
    status: {
        type: String,
    },
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
    scans: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'scans'
    }],
    scan_count: {
        type: Number,
        default: 0
    },
    last_scan : {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'scans'
    },
    last_scan_date: {
        type: Date
    }
}, { timestamps: true })

module.exports = mongoose.model('projects', ProjectSchema);