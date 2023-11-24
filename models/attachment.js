const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true,
  },
  description: String, // You can add more details as needed, such as file size, type, etc.
  // Add fields for file location, size, and any other relevant data
}, { timestamps: true });

const Attachment = mongoose.model('Attachment', attachmentSchema);

module.exports = Attachment;
