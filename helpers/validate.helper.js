const { validationResult } = require("express-validator");

const ProjectError = require("./error.helper");

exports.validateRequest = (req, res, next) => {
  try {
    const validationError = validationResult(req);
    if (!validationError.isEmpty()) {
      const err = new ProjectError("Validation failed!");
      err.statusCode = 422;
      err.data = validationError.mapped();
      throw err;
    }
    next();
  } catch (error) {
    next(error);
  }
};
