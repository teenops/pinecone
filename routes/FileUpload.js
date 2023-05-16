const router = require('express').Router()
const s3UploadVideo = require('../middleware/s3UploadVideo')
const response = require('./../utils/response')
const FileUpload = require('./../models/FileUpload')
const s3UploadImage = require('../middleware/s3UploadImage')

router.post(
  '/s3/video',
  s3UploadVideo.single('file'),
  async (req, res) => {
    try {

      let fileObj = await new FileUpload({
        type: req.query.type,
        key: req.file.key,
        filename: req.file.key.split('/').pop(),
        filepath: req.file.location,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        // size: req.file.size
      }).save()

      return response.success(res, 'success', fileObj)
    } catch (error) {
      console.log(error);
      return response.error(res, error)
    }
  }
)

router.post(
  '/s3/image',
  s3UploadImage.single('file'),
  async (req, res) => {
    try {

      let fileObj = await new FileUpload({
        type: req.query.type,
        key: req.file.key,
        filename: req.file.key.split('/').pop(),
        filepath: req.file.location,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      }).save()

      return response.success(res, 'success', fileObj)
    } catch (error) {
      console.log(error);
      return response.error(res, error)
    }
  }
)


module.exports = router