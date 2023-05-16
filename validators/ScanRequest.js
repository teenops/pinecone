const Joi = require('joi')
Joi.objectId = require('joi-objectid')(Joi)

exports.ValidateAddScanRequest = (body) => {
  let schema = Joi.object({
    project_id: Joi.objectId(),
    category: Joi.string().valid("3d Scan", "Video Scan").required(),
    scan_capture_intent: Joi.string().valid("Object", "Building", "Scene").required(),
    subtitle: Joi.string().required(),
    description: Joi.string().required(),
    timeAllowed: Joi.string().required(),
    location: Joi.object({
      lat: Joi.number().required(),
      lng: Joi.number().required(),
    }),
    scan_type: Joi.string().valid("Single", "Full").required(),
    scanner_count: Joi.number().required(),
    questions: Joi.array().items(Joi.string().required())
  })
  return schema.validate(body)
}

exports.ValidateRequestReScan = (body) => {
  let schema = Joi.object({
    scan_request_id: Joi.objectId().required(),
    reason: Joi.string().required(),
    deadline: Joi.date().required(),
    remarks: Joi.string().required(),
  })
  return schema.validate(body)
}

exports.ValidateComment = (body) => {
  let schema = Joi.object({
    scan_request_id: Joi.objectId().required(),
    comment: Joi.string().required(),
  })
  return schema.validate(body)
}