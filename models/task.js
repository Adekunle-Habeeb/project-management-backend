const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  priority: {
    type: String,
    enum: ["high", "medium", "low"],
    default: "low",
    required: true,
  },
  assignee: {
    type: String, // Add enum values if needed
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['Not Started', 'In Progress', 'In Review', 'Completed'],
    default: 'Not Started',
  },
  estimatedCosts: {
    labor: Number,
    materials: Number,
    otherExpenses: Number,
  },
  type: {
    type: String, // Add enum values if needed
  },
  earliestStart: Date,
  earliestFinish: Date,
  latestStart: Date,
  latestFinish: Date,
  duration: Number,
  attachments: [{
    fileName: String,
    description: String,
    filePath: String, // Path to the file in the database or filesystem
  }],
  ownerEmail: {
    type: String
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
});


const Task = mongoose.model('Task', taskSchema);

module.exports = Task;
