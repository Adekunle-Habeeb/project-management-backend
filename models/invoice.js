const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
  },
  tasks: [
    {
      taskId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task',
        required: true,
      },
      taskDetails: {
        type: String,
        required: true,
      },
      costs: {
        labor: Number,
        materials: Number,
        otherExpenses: Number,
      },
    },
  ],
  totalEstimatedCost: Number, // Add the totalEstimatedCost field here
  // Add other invoice-related fields here
}, { timestamps: true });

const Invoice = mongoose.model('Invoice', invoiceSchema);

module.exports = Invoice;
