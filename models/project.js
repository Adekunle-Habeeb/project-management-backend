const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  type: {
    type: String,
  },
  duration: {
    type: Number,
    required: true,
  },
  phoneNo:  {
    type: String,
  },
  projectManager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Project",
  },
  team: [{
    type: String,
  }],
  employer: {
    type: String,
  },
  projectManagerEmail: {
    type: String,
  },
  totalEstimatedCost: {
    type: Number,
    default: 0, // Set a default value of 0 for totalEstimatedCost
  },
}, { timestamps: true });

const Project = mongoose.model("Project", projectSchema);

module.exports = Project;
