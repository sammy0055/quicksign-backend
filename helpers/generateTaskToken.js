const jwt = require("jsonwebtoken");

const generateTaskToken = (payload) => {
  return jwt.sign(payload, process.env.SECRET, { expiresIn: "7d" });
};

module.exports = generateTaskToken;
