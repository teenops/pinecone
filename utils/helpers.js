const bcrypt = require("bcrypt")
const uuid = require('uuid').v4
const otpGenerater = require("otp-generator")
const jwt = require("jsonwebtoken")

exports.bcryptHash = (password) => {
  return bcrypt.hashSync(password, 10)
}
  
exports.bcryptCompare = (password, hash) => {
return bcrypt.compareSync(password, hash)
}

exports.JoiParseError = (error) => {
  return error.details[0].message.replace(/[^a-zA-Z0-9 ]/g, "")
}

exports.generateUUID = (length = 32) => uuid().replace(/-/g, '').slice(0, length)

exports.generateJWT = (payload , JWTsecret = process.env.JWTsecret) => {
  return jwt.sign(payload, JWTsecret, { expiresIn : process.env.JWTexpiresIn ?? '3d' })
}

exports.verifyJWT = (token , JWTsecret = process.env.JWTsecret) => {
  return jwt.verify(token, JWTsecret)
}

exports.generateOTP = () => {
  return otpGenerater.generate(6, { lowerCaseAlphabets: false, upperCaseAlphabets: false, specialChars: false })
}