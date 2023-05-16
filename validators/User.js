const Joi = require('joi')
Joi.objectId = require('joi-objectid')(Joi)

exports.validateUser = (body) => {
  let schema = Joi.object({
    full_name: Joi.string().required(),
    email: Joi.string().email().required(),
    username: Joi.string().required(),
    password: Joi.string().required(),
    phone: Joi.string().required(),
    location: Joi.object({
      lat: Joi.number().required(),
      lng: Joi.number().required(),
    }),
    requested_org: Joi.objectId(),
    role: Joi.string().valid("Standard", "Enterprise Manager", "Enterprise Scanner").required(),
    isScanner: Joi.boolean().required(),
  })
  return schema.validate(body)
}

exports.validateLogin = (body) => {
  let schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
    org: Joi.objectId(),
    isScanner: Joi.boolean(),
  })
  return schema.validate(body)
}

exports.verifyOtp = (body) => {
  let schema = Joi.object({
    otp: Joi.string().required(),
    verificationId: Joi.objectId().required(),
  })
  return schema.validate(body)
}

exports.resendOtp = (body) => {
  let schema = Joi.object({
    verificationId: Joi.objectId().required(),
  })
  return schema.validate(body)
}

exports.validateUserUpdate = (body) => {
  let schema = Joi.object({
    full_name: Joi.string(),
    username: Joi.string(),
    newPassword: Joi.string(),
    oldPassword: Joi.string().when('newPassword', { is: Joi.exist(), then: Joi.required() }),
    profileImg: Joi.string(),
    phone: Joi.string(),
    location: Joi.object({
      lat: Joi.number(),
      lng: Joi.number(),
    })
  })
  return schema.validate(body)
}

exports.reSubmitOrgRequest = (body) => {
  let schema = Joi.object({
    token: Joi.string().required(),
    org_id: Joi.objectId().required(),
  })
  return schema.validate(body)
}