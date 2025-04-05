const { z } = require("zod");
const jwt = require("jsonwebtoken");

const systemUserSignupSchema = z.object({
  firstName: z.string().nonempty("firstName is required"),
  lastName: z.string().nonempty("lastName is required"),
  email: z.string().nonempty("email is required"),
  password: z.string().nonempty("password is required"),
});

const validateSystemUserSignup = (req, res, next) => {
  try {
    req.body = systemUserSignupSchema.parse(req.body); // Validate and parse data
    next(); // Proceed to the next middleware if valid
  } catch (error) {
    res.status(400).json({ error: error.errors });
  }
};

const verifySystemUserToken = (req, res, next) => {
  let token = req.headers["access-token"];
  if (!token) {
    return res.status(401).send({
      auth: false,
      message: "UnAuthorized Access",
    });
  }

  jwt.verify(token, process.env.SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({
        auth: false,
        message: "Failed To Authenticate. Error: " + err,
      });
    }
    req.userId = decoded.id;
    req.firstName = decoded.firstName;

    next();
  });
};

module.exports = { validateSystemUserSignup, verifySystemUserToken };
