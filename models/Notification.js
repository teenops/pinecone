const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate-v2')

const NotificationSchema = mongoose.Schema({
  type: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',
    required: true
  },
  is_read: {
    type: Boolean,
    default: false
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  }
}, { timestamps: true })

NotificationSchema.plugin(mongoosePaginate)

module.exports = mongoose.model('notifications', NotificationSchema);