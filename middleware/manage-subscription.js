const { z } = require("zod");

// Define the schema using Zod
const planSchema = z.object({
  name: z.string().min(1, "Plan name must be a non-empty string"),
  amount: z.number().positive("Amount must be a positive number"),
  features: z
    .array(z.string())
    .nonempty("Features must be a non-empty array of strings"),
});

const editPlanSchema = z.object({
  productId: z.string().nonempty("Product Id is required"),
  name: z.string().min(1, "Plan name must be a non-empty string"),
  amount: z.number().positive("Amount must be a positive number"),
  features: z
    .array(z.string())
    .nonempty("Features must be a non-empty array of strings"),
});

// Middleware for Express validation
const validatePlanInput = (req, res, next) => {
  try {
    req.body = planSchema.parse(req.body); // Validate and parse data
    next(); // Proceed to the next middleware if valid
  } catch (error) {
    res.status(400).json({ error: error.errors });
  }
};

const validateEditPlanInput = (req, res, next) => {
    try {
        req.body = editPlanSchema.parse(req.body); // Validate and parse data
        next(); // Proceed to the next middleware if valid
    } catch (error) {
        res.status(400).json({ error: error.errors });
    }
}

module.exports = { validatePlanInput, validateEditPlanInput };
