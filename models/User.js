const mongoose = require('mongoose')


const userSchema = mongoose.Schema({
    full_name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    profileImg: String,
    phone: String,
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
    isVerified: {
        type: Boolean,
        required: true,
        default: false
    },
    org: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'orgs'
    },
    requested_org: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'orgs'
    },
    requested_org_status: {
        type: String,
        enum: ['Pending', 'Accepted', 'Rejected']
    },
    role: {
        type: String,
        enum: ['Standard', 'Enterprise Manager', 'Enterprise Scanner'],
        required: true
    },
    isScanner: {
        type: Boolean,
        required: true,
        default: false
    },
    otp: {
        type: String,
    },
    otpExpires: {
        type: Date,
    },
    lastLogin: {
        type: Date,
    },
}, { timestamps: true })

userSchema.methods.serializeUser = async function () {
    const user = this

    const userObject = User
    .findOne({ _id: user._id })
    .populate('org', 'org_name')
    .populate('requested_org', 'org_name')
    .lean()

    // remove sensitive data
    delete userObject.password
    delete userObject.otp
    delete userObject.otpExpires
    delete userObject.__v

    return userObject
}

userSchema.methods.updateLastLogin = async function () {
    const user = this
    user.lastLogin = new Date()
    await user.save()
}

const User = mongoose.model('users', userSchema)
module.exports = User