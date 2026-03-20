const joi = require("joi");

module.exports = {
  signup: joi.object({
    email: joi.string().email().required(),
    password: joi.string().min(6).required(),
  }),
};
