const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  handleSummarize,
  handleQuiz,
  handleCompare,
  handleReport,
} = require('../controllers/toolController');

router.post('/summarize/:documentId', authenticate, handleSummarize);
router.post('/quiz/:documentId', authenticate, handleQuiz);
router.post('/compare', authenticate, handleCompare);
router.get('/report/:documentId', authenticate, handleReport);

module.exports = router;
