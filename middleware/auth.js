const helper = require('../utils/helpers')
const response = require('../utils/response')

module.exports = (req, res, next) => {
    if (!req.headers.authorization) {
        return response.error(res, "Unauthorized", "No Authorization Header", 401)
    }
    const token = req.headers.authorization
    try {
        const decodedToken = helper.verifyJWT(token)
        req.user = decodedToken
        next();
    } catch (error) {
        return response.error(res, "Unauthorized", "Invalid Token", 401)
    }

}