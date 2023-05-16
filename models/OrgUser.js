const mongoose = require('mongoose')

const OrgUserSchema = mongoose.Schema({
    type: {
        type: String,
        enum: ['admin', 'user'],
        default: 'user'
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users'
    },
    org_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'orgs'
    },
    team_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'orgs_teams'
    },
    added_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users'
    }
}, { timestamps: true })

module.exports = mongoose.model('orgs_users', OrgUserSchema);