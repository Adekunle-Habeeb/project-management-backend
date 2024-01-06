const express  = require("express");
const router = express.Router();
const { registerController, loginController, logoutController, verifyUser, forgotPasswordController, resetPasswordController, changepasswordController, editUserController, fetchAllUsersController, getUserController } = require("../controllers/userController")
const { protect } = require("../middleware/authMiddleware")


router.post("/register", registerController);
router.post("/login", loginController);
router.post("/verify", verifyUser);
router.post("/forgotPassword", forgotPasswordController);
router.post("/reset", resetPasswordController);
router.post("/logout", protect , logoutController);
router.get("/fetchUsers", protect, fetchAllUsersController);
router.patch("/change-password", protect, changepasswordController);
router.patch("/edit", protect, editUserController);
router.get("/get-user", protect, getUserController);
getUserController


module.exports = router;
