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
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
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
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Attachment',
  }],
  // You can add more fields for attachments such as file names, descriptions, etc. as needed
  owner: {
    type: String,
    required: true,
  },
}, { timestamps: true });



const Task = mongoose.model('Task', taskSchema);

module.exports = Task;
