const { ZodError } = require("zod");

function validate({ body, query, params }) {
  return (req, res, next) => {
    try {
      if (body) req.body = body.parse(req.body);
      if (query) req.validatedQuery = query.parse(req.query);
      if (params) req.validatedParams = params.parse(req.params);
      next();
    } catch (error) {
      if (error instanceof ZodError || error.name === "ZodError") {
        const issues = error.issues || error.errors || [];
        const formattedErrors = issues.map((err) => ({
          field: Array.isArray(err.path) ? err.path.join(".") : "unknown",
          message: err.message || "Invalid input",
        }));

        return res.status(400).json({
          success: false,
          message: "Validation failed",
          code: "VALIDATION_ERROR",
          errors: formattedErrors,
        });
      }
      next(error);
    }
  };
}

module.exports = validate;
