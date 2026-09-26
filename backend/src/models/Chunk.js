const mongoose = require('mongoose');

const ChunkSchema = new mongoose.Schema({
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: true,
    index: true,
  },
  userId: {
    type: String,
    required: true,
    index: true,
  },
  pageNumber: {
    type: Number,
    required: true,
    index: true,
  },
  chunkIndex: {
    type: Number,
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  tokenCount: {
    type: Number,
    default: 0,
  },
  embedding: {
    type: [Number],
    default: [],
    select: false, // omit by default unless explicitly projected for vector search
  },
  metadata: {
    documentName: { type: String, default: '' },
    startChar: { type: Number, default: 0 },
    endChar: { type: Number, default: 0 },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Composite index for fast document chunk retrieval
ChunkSchema.index({ documentId: 1, chunkIndex: 1 });

module.exports = mongoose.model('Chunk', ChunkSchema);
