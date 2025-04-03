var bcrypt = require("bcryptjs");

require("dotenv").config();

verifyToken = (req, res, next) => {
  let token = req.headers["access-token"];
  if (!token) {
    return res.status(403).send({
      auth: false,
      message: "UnAuthorized Access",
    });
  }
  // const hashedPassword = bcrypt.hashSync(token, 10); // you will have to add it back when signup user from postman
  let result = bcrypt.compareSync(
    process.env.PUBLIC_ACCESS_TOKEN,
    token
  );
  if (result) {
    next();
  } else {
    return res.status(500).send({
      auth: false,
      message: "Failed To Authenticate. Error: Unauthorized Access",
    });
  }
};

const authPublicToken = {};
authPublicToken.verifyToken = verifyToken;

module.exports = authPublicToken;
