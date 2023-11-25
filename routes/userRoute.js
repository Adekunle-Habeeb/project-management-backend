const express  = require("express");
const router = express.Router();
const { registerController, 
    loginController, 
    logoutController, 
    verifyUser, 
    forgotPasswordController, 
    resetPasswordController, 
    changepasswordController, 
    editUserController, 
    fetchAllUsersController } = require("../controllers/userController")
const { protect } = require("../middleware/authMiddleware")


router.post("/register", registerController);
router.post("/login", loginController);
router.post("/verify", verifyUser);
router.post("/forgotPassword", forgotPasswordController);
router.post("/reset", resetPasswordController);
router.post("/logout", protect , logoutController);
router.patch("/change-password", protect, changepasswordController);
router.patch("/edit", protect, editUserController);
router.get("/fetchUsers", protect, fetchAllUsersController);


module.exports = router;
