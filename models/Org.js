const mongoose = require('mongoose')

const orgSchema = mongoose.Schema({
    org_name: String,
    country: String,
    address: String,
    phone: String,
    subscription: {
        tier: String,
        createdAt: {
            type: Date,
        },
        expiresAt: Date,
        interval: String,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users'
    },
    location: {
        type: mongoose.Schema({
            type: {
                type: String,
                enum: ['Point'],
                required: true
            },
            coordinates: {
                type: [Number],
                required: true
            }
        }, { _id: false })
    },
    teams: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'orgs_teams'
    }],
    max_scans: Number,
    total_scans: {
        type: Number,
        default: 0
    },
}, { timestamps: true })

module.exports = mongoose.model('orgs', orgSchema);