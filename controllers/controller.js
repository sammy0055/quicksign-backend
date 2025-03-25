const db = require("../config/db.config.js");
var fs = require("fs");
var FlakeId = require("flake-idgen");
var flakeIdGen = new FlakeId();
var intformat = require("biguint-format");
const { v1: uuidv1 } = require("uuid");
const User = db.user;

var jwt = require("jsonwebtoken");
var bcrypt = require("bcryptjs");

exports.signup = (req, res) => {
  User.create({
    id: uuidv1(),
    name: req.body.name,
    email: req.body.email,
    password: bcrypt.hashSync(req.body.password, 8),
  })
    .then(() => {
      res.send({
        message: "Registered Successfully!",
      });
    })
    .catch((err) => {
      res.status(500).send({
        reason: err.message,
      });
    });
};
exports.signin = (req, res) => {
  User.findOne({
    where: {
      email: req.body.email,
    },
  })
    .then((user) => {
      if (!user) {
        return res.status(404).send({
          reason: "Incorrect Email or Password",
        });
      }

      var passwordIsValid = bcrypt.compareSync(
        req.body.password,
        user.password
      );
      if (!passwordIsValid) {
        return res.status(404).send({
          reason: "Incorrect Email or Password",
        });
      }

      var token = jwt.sign(
        {
          id: user.id,
        },
        process.env.SECRET,
        {
          expiresIn: 86400,
        }
      );
      res.status(200).send({
        auth: true,
        accessToken: token,
        email: user.email,
        name: user.name,
      });
    })
    .catch((err) => {
      res.status(500).send({
        reason: err.message,
      });
    });
};
