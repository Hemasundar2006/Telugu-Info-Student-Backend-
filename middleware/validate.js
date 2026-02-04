const Joi = require('joi');

/**
 * Factory: returns middleware that validates req.body, req.params, or req.query with the given schema.
 */
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
    });
    if (error) {
      const message = error.details.map((d) => d.message).join('; ');
      const err = new Error(message);
      err.statusCode = 400;
      return next(err);
    }
    req[property] = value;
    next();
  };
};

module.exports = validate;
