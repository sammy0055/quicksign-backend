/**
 * models import
 */
// const { User } = require("../models/user.js");

const db = require("../models");

/**
 * middleware function to check if entered email already exists in database
 */
checkDuplicateEmail = async (req, res, next) => {
  db.User.findOne({
    where: {
      email: req.body.email,
    },
  })
    .then((admin) => {
      if (admin) {
        return res.status(400).send({
          success: false,
          message: "Email is already in use",
        });
      }

      next();
    })
    .catch((err) => {
      res
        .status(500)
        .json({ error: { message: err.message, code: "server-error" } });
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
