/**
 * including jwtwebtoken library
 */
const jwt = require("jsonwebtoken");

require("dotenv").config();

/**
 * middleware function to verify user roles
 */
verifyUserRole = (params) => {
  return (req, res, next) => {
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
      if (decoded.role === "Super-Admin") {
        return next();
      }
      if (params.length > 0 && !params.find((item) => item == decoded.role)) {
        return res.status(401).send({
          auth: false,
          message: "Permission Denied. Error: " + err,
        });
      }

      next();
    });
  };
};
/**
 * middleware function to verify token
 */
verifyToken = (req, res, next) => {
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
    req.stripeId = decoded.stripeId;
    req.firstName = decoded.firstName;
    req.lastName = decoded.lastName;
    req.fullName = decoded.fullName;

    next();
  });
};
/**
 * middleware function to get user id
 */
getUserId = (req, res, next) => {
  let token = req.headers["x-access-token"];

  if (!token) {
    req.userId = "";
  } else {
    jwt.verify(token, process.env.SECRET, (err, decoded) => {
      if (err) {
        req.userId = "";
      } else {
        req.userId = decoded.id;
      }
    });
  }
  next();
};
/**
 * authJwt object exports functions in the router file
 */
const authJwt = {};
authJwt.verifyToken = verifyToken;
authJwt.verifyUserRole = verifyUserRole;
authJwt.getUserId = getUserId;
/**
 * Documentaion for an Object
 * authJwtObject is exported to be used in other files
 * @authJwt
 */
module.exports = authJwt;
