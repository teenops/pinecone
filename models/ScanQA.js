const mongoose = require('mongoose')

const ScanQASchema = mongoose.Schema({
    scan_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'scans',
        required: true
    },
    question_id: {
        type: mongoose.Schema.Types.ObjectId,
    },
    question: {
        type: String,
        required: true
    },
    answer: {
        type: String,
    },
    answered_date: {
        type: Date
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    is_answered: {
        type: Boolean,
        default: false
    },
    answer_type: {
        type: String,
        enum: ['Text', "Audio"],
    }
    
}, { timestamps: true })

module.exports = mongoose.model('scan_question_answers', ScanQASchema);