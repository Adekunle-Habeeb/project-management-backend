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
    type: Number, // Add the duration field as a Number type
    required: true, // You can set it as required if needed
  },
  phoneNo:  {
    type: String,
  },
  projectManager: {
    type: String,
    required: true,
  },
  team: [{
    type: String,
  }],
  employer: {
    type: String,
  }
}, { timestamps: true });

const Project = mongoose.model('Project', projectSchema);

module.exports = Project;
