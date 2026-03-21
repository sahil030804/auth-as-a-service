const Joi = require("joi");

module.exports = {
  createFlag: Joi.object({
    key: Joi.string().required(),
    enabled: Joi.boolean().required(),
    config: Joi.object().optional(),
    description: Joi.string().optional(),
    category: Joi.string().optional(),
    isPublic: Joi.boolean().optional(),
    metadata: Joi.object().optional()
  }),

  updateFlag: Joi.object({
    enabled: Joi.boolean().optional(),
    config: Joi.object().optional(),
    description: Joi.string().optional(),
    metadata: Joi.object().optional()
  }),

  bulkUpdate: Joi.object({
    updates: Joi.array().required()
  }),

  clearCache: Joi.object({
    key: Joi.string().optional()
  }),

  cloneFlag: Joi.object({
    new_key: Joi.string().required(),
    new_description: Joi.string().optional()
  }),

  importFlags: Joi.object({
    flags: Joi.array().required(),
    overwrite: Joi.boolean().optional()
  })
};
