const Joi = require("joi");

module.exports = {
  cloneFlag: Joi.object({
    new_key: Joi.string().required(),
    new_description: Joi.string().optional()
  }),

  toggleFlag: Joi.object({}),

  resetFlag: Joi.object({}),

  importFlags: Joi.object({
    flags: Joi.array().required(),
    overwrite: Joi.boolean().optional()
  })
};
