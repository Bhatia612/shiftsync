const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500
    const code = err.code || "NTERNAL_SERVER_ERROR"
    const message = err.message || "Something went wrong"

    res.status(statusCode).json({
        error: { message, code }
    })
}

module.exports = errorHandler