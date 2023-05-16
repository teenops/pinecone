const Joi = require('joi')
Joi.objectId = require('joi-objectid')(Joi)

exports.validateOrganization = (body) => {
  let schema = Joi.object({
    org_name: Joi.string().required(),
    country: Joi.string().required(),
    address: Joi.string().required(),
    phone: Joi.string().required(),
    location: Joi.object({
      lat: Joi.number().required(),
      lng: Joi.number().required(),
    }),
  })
  return schema.validate(body)
}

exports.validateAddRemoveTeamMember = (body) => {
  let schema = Joi.object({
    team_id: Joi.objectId().required(),
    user_id: Joi.objectId().required()
  })
  return schema.validate(body)
}

exports.validateAddRemoveAdmin = (body) => {
  let schema = Joi.object({
    org_id: Joi.objectId().required(),
    user_id: Joi.objectId().required(),
    flag: Joi.boolean().required()
  })
  return schema.validate(body)
}

exports.validateAddRemoveOrgRequest = (body) => {
  let schema = Joi.object({
    user_id: Joi.objectId().required(),
    flag: Joi.boolean().required()
  })
  return schema.validate(body)
}