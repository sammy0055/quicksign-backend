const express = require("express");
const {
  SystemUserController,
} = require("../controllers/system-user.controller");
const {
  validateSystemUserSignup,
  verifySystemUserToken,
} = require("../middleware/validate-system-user");
const router = express.Router();

router.post("/user-login", SystemUserController.loginSytemUser);
router.post(
  "/create-system-user",
  validateSystemUserSignup,
  SystemUserController.createSytemUser
);
router.get(
  "/get-users",
  verifySystemUserToken,
  SystemUserController.getPaginatedUsers
);
router.get(
  "/freeze-user",
  verifySystemUserToken,
  SystemUserController.freezeUser
);
router.get(
  "/disconnect-user",
  verifySystemUserToken,
  SystemUserController.disconnectUser
);
router.get(
  "/activate-user",
  verifySystemUserToken,
  SystemUserController.activateUser
);
router.get(
  "/get-userInfo",
  verifySystemUserToken,
  SystemUserController.getUserByEmailOrId
);

module.exports = router;
