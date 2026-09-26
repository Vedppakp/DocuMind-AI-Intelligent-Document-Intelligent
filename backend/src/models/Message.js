const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true,
    index: true,
  },
  role: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  citations: [{
    documentId: { type: String },
    documentName: { type: String },
    pageNumber: { type: Number },
    chunkIndex: { type: Number },
    text: { type: String },
    score: { type: Number },
  }],
  suggestedQuestions: [{
    type: String,
  }],
  isGrounded: {
    type: Boolean,
    default: true,
  },
  groundedConfidence: {
    type: Number,
    default: 90,
  },
  groundedPages: [{
    type: Number,
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Message', MessageSchema);
