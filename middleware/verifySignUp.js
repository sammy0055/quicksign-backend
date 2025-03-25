/**
 * models import
 */
const db = require("../models/index.js");
/**
 * middleware function to check if entered email already exists in database
 */
checkDuplicateEmail = (req, res, next) => {
  db.User.findOne({
    where: {
      email: req.body.email,
    },
  }).then((admin) => {
    if (admin) {
      return res.status(400).send({
        success: false,
        message: "Email is already in use",
      });
    }

    next();
  });
};
/**
 * signUpVerify object exports functions in the router file
 */
const signUpVerify = {};
signUpVerify.checkDuplicateEmail = checkDuplicateEmail;
/**
 * Documentaion for an Object
 * signUpVerify is exported to be used in other files
 * @signUpVerify
 */
module.exports = signUpVerify;
