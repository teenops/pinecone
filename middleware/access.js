const response = require('../utils/response')

module.exports = (access) => (req, res, next) => {
  let flag = false
  if (access === "scanner") {
    if (req.user.role === "Standard" || req.user.role === "Enterprise Scanner") {
      if (req.user.isScanner === true) {
        flag = true
      }
    }
  } else if (access === "manager") {
    if (req.user.role === "Enterprise Manager") {
      flag = true
    }
  } else {
    return response.error(res, "Unauthorized", { message: "Invalid Input." }, 401)
  }

  if (flag) {
    next()
  } else {
    return response.error(res, "Unauthorized", { message: "Invalid Access" }, 403)
  }

}