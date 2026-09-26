const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  originalName: {
    type: String,
    required: true,
  },
  storedName: {
    type: String,
    required: true,
  },
  filePath: {
    type: String,
    required: true,
  },
  fileSize: {
    type: Number,
    required: true,
  },
  pageCount: {
    type: Number,
    default: 0,
  },
  chunkCount: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['uploaded', 'processing', 'ready', 'failed'],
    default: 'uploaded',
    index: true,
  },
  errorMessage: {
    type: String,
    default: '',
  },
  folder: {
    type: String,
    default: 'General',
    index: true,
  },
  readingTimeMinutes: {
    type: Number,
    default: 2,
  },
  summary: {
    executive: { type: String, default: '' },
    keyPoints: [{ type: String }],
    actionItems: [{ type: String }],
    topics: [{ type: String }],
    generatedAt: { type: Date },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Document', DocumentSchema);
