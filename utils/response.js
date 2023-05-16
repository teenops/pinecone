exports.success = (res, message = "", data = {}, code = 200) => {
    return res.status(code).send({
        status: "success",
        message,
        data,
    })
}

exports.error = (res, message = "", data = {}, code = 500) => {
    return res.status(code).send({
        status: "error",
        message,
        data,
    })
}

exports.validation = (res, data = {}) => {
    return res.status(400).send({
        status: "error",
        message: "Validation error",
        data
    })
}
