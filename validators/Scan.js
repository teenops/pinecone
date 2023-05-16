const Joi = require('joi')
Joi.objectId = require('joi-objectid')(Joi)

exports.ValidateAddScanSubmissionRequest = (body) => {
  let schema = Joi.object({
    scan_request_id: Joi.objectId(),
    scan_name: Joi.string().required(),
    inputVideoId: Joi.objectId().required(),
  })
  return schema.validate(body)
}

exports.validateScanReport = (body) => {
  let schema = Joi.object({
    scan_id: Joi.objectId().required(),
    questions: Joi.array().items(
      Joi.object({
        _id: Joi.objectId().required(),
        answer: Joi.string().required(),
        answer_type: Joi.string().valid("Text", "Audio").required(),
      })
    ),
  })
  return schema.validate(body)
}