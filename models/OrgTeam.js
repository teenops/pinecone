const mongoose = require('mongoose')

const OrgTeamSchema = mongoose.Schema({
    user_id: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users'
    }],
    org_id: String,
    max_users: Number,
    isDefault: {
        type: Boolean,
        default: false
    }
}, { timestamps: true })

module.exports = mongoose.model('orgs_teams', OrgTeamSchema);