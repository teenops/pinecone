const multer = require('multer')
const path = require('path')
const { S3Client } = require('@aws-sdk/client-s3')
const multerS3 = require('multer-s3')
const { generateUUID } = require('../utils/helpers')
const { S3_BUCKET_NAME } = require('../utils/const')

const s3 = new S3Client({
  region: process.env.S3_REGION,
  credentials: {
    accessKeyId: process.env.S3_ACCESS,
    secretAccessKey: process.env.S3_SECRET
  }
})

const storage = multerS3({
  s3: s3,
  bucket: S3_BUCKET_NAME.VIDEO,
  metadata: (req, file, cb) => {
    cb(null, { fileType: req.query.type })
  },
  key: (req, file, cb) => {
    if (!file.mimetype.includes('video')) {
      return cb("Invalid File Type")
    }

    let prefix = 'soar-3d'
    prefix = req.query.type ? prefix + '/' + req.query.type : prefix
    cb(
      null,
      prefix +
      '/' +
      generateUUID() +
      path.extname(file.originalname)
    )
  }
})

module.exports = multer({ storage })
