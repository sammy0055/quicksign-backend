const { z } = require("zod");

const folderSchema = z.object({
  name: z.string().nonempty("name is required"),
  expanded: z.boolean().optional(),
  type: z.string().optional(),
  content: z.string().optional(),
});

const fileSchema = z.object({
  name: z.string().nonempty("name is required"),
  file: z.any().optional(),
  folderId: z.string().nonempty("folderId is required"),
  type: z.string().optional(),
  content: z.string().optional(),
});

const validateFileFields = (req, res, next) => {
  try {
    req.body = fileSchema.parse(req.body); // Validate and parse data
    next(); // Proceed to the next middleware if valid
  } catch (error) {
    res.status(400).json({ error: error.errors });
  }
};

const validateFolderFields = (req, res, next) => {
  try {
    req.body = folderSchema.parse(req.body); // Validate and parse data
    next(); // Proceed to the next middleware if valid
  } catch (error) {
    res.status(400).json({ error: error.errors });
  }
};

module.exports = { validateFolderFields, validateFileFields };
