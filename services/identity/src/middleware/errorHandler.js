const errorCodes = require("../constant/errorCodes");
module.exports = {
  errorHandler() {
    return (err, req, res, next) => {
      const error = errorCodes[err.message] || errorCodes.INTERNAL_SERVER_ERROR;
      res.status(error.httpStatusCode).json(error.body || err.message);
    };
  },
};
