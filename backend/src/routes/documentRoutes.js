const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { authenticate } = require('../middleware/auth');
const {
  uploadDocuments,
  getDocuments,
  getDocumentById,
  getDocumentChunks,
  deleteDocument,
  streamPdf,
  updateDocumentFolder,
  getFolders,
  loadSampleDocument,
} = require('../controllers/documentController');

router.post('/upload', authenticate, upload.array('pdfs', 10), uploadDocuments);
router.post('/load-sample', authenticate, loadSampleDocument);
router.get('/', authenticate, getDocuments);
router.get('/folders/list', authenticate, getFolders);
router.get('/:id', authenticate, getDocumentById);
router.get('/:id/pdf', streamPdf);
router.get('/:id/chunks', authenticate, getDocumentChunks);
router.patch('/:id/folder', authenticate, updateDocumentFolder);
router.delete('/:id', authenticate, deleteDocument);

module.exports = router;
