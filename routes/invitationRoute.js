const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {  sendInvitationController, respondToInvitationController } = require("../controllers/invitation");

router.post("/send", protect, sendInvitationController);
router.post("/receive/:id", protect, respondToInvitationController);


module.exports = router;

