const Invitation = require("../models/invitation");
const User = require("../models/userModel");
const Project = require("../models/project");
const expressAsyncHandler = require("express-async-handler");

// Controller to send an invitation
const sendInvitationController = expressAsyncHandler(async (req, res) => {
  try {
    const { recipientId, projectId, type } = req.body;
    const senderId = req.user.id; 

    // Check if the recipient and project exist
    const recipient = await User.findById(recipientId);
    const project = await Project.findById(projectId);

    if (!recipient || !project) {
      return res.status(404).json({ error: "Recipient or project not found" });
    }

    // Check if there is already an existing invitation
    const existingInvitation = await Invitation.findOne({
      senderId,
      recipientId,
      projectId,
      type,
      status: "pending",
    });

    if (existingInvitation) {
      return res.status(400).json({ error: "Invitation already sent" });
    }

    // Create a new invitation
    const invitation = new Invitation({
      senderId,
      recipientId,
      projectId,
      type,
    });

    await invitation.save();

    res.status(201).json({ message: "Invitation sent successfully", invitation });
  } catch (error) {
    console.error("Error sending invitation:", error);
    res.status(500).json({ error: "Internal Server Error", message: error.message });
  }
});

// Controller to accept or decline an invitation
const respondToInvitationController = expressAsyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { response } = req.body;
    const recipientId = req.user.id; 

    // Check if the invitation exists
    const invitation = await Invitation.findById(id);

    if (!invitation || invitation.recipientId.toString() !== recipientId) {
      return res.status(404).json({ error: "Invitation not found" });
    }

    // Check if the invitation is still pending
    if (invitation.status !== "pending") {
      return res.status(400).json({ error: "Invitation has already been responded to" });
    }

    // Update the invitation status based on the user's response
    if (response === "accept") {
      invitation.status = 'accepted';
      // Perform any additional actions for accepting the invitation
    } else if (response === "decline") {
      invitation.status = "declined";
      // Perform any additional actions for declining the invitation
    } else {
      return res.status(400).json({ error: "Invalid response" });
    }

    await invitation.save();

    res.json({ message: "Invitation responded to successfully", invitation });
  } catch (error) {
    console.error("Error responding to invitation:", error);
    res.status(500).json({ error: "Internal Server Error", message: error.message });
  }
});

module.exports = {
  sendInvitationController,
  respondToInvitationController,
};
