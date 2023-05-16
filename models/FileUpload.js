const mongoose = require('mongoose')

const FileUploadSchema = new mongoose.Schema(
  {
    filepath: { type: String, required: true },
    key: { type: String, required: true },
    filename: { type: String, required: true },
    originalname: { type: String, required: true },
    mimetype: { type: String },
    size: { type: Number },
  },
  { timestamps: true }
)


module.exports = mongoose.model('file_uploads', FileUploadSchema)
