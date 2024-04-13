const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema({
    filename: {
        type: String,
        required: true,
    },
    uploader: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Project",
    },
    taskId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Task",
    }
}, { timestamps: true });

const Attachment = mongoose.model('Attachment', attachmentSchema);

module.exports = Attachment;
