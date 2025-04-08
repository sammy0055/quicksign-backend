const { z } = require("zod");

const stripeProductSchema = z.object({
  name: z.string().nonempty("name is required"),
  send_credits: z
    .number({ send_credits: "amount is required" })
    .min(1, "send_credits must be at least 1"),
  price: z
    .number({ required_error: "amount is required" })
    .min(1, "Amount must be at least 1"),
  features: z.array(z.string()),
});

const editPlanSchema = z.object({
  productId: z.string().nonempty("Product Id is required"),
  name: z.string().min(1, "Plan name must be a non-empty string").optional(),
  price: z.number().min(1, "Amount must be a positive number").optional(),
  features: z
    .array(z.string())
    .nonempty("Features must be a non-empty array of strings")
    .optional(),
  send_credits: z
    .number({ send_credits: "amount is required" })
    .min(1, "send_credits must be at least 1")
    .optional(),
});

const validateStripeProductCreationData = (req, res, next) => {
  try {
    req.body = stripeProductSchema.parse(req.body);
    next();
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
};

module.exports = { validateStripeProductCreationData, validateEditPlanInput };
