const Joi = require('joi')
Joi.objectId = require('joi-objectid')(Joi)

exports.ValidateAddProject = (body) => {
  let schema = Joi.object({
    name: Joi.string().required(),
    description: Joi.string().required(),
    status: Joi.string().required(),
    location: Joi.object({
      lat: Joi.number().required(),
      lng: Joi.number().required()
    }),
  })
  return schema.validate(body)
}