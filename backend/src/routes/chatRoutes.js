const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  sendMessage,
  getConversations,
  getConversationMessages,
  createConversation,
  deleteConversation,
} = require('../controllers/chatController');

router.post('/message', authenticate, sendMessage);
router.get('/conversations', authenticate, getConversations);
router.post('/conversations', authenticate, createConversation);
router.get('/conversations/:id/messages', authenticate, getConversationMessages);
router.delete('/conversations/:id', authenticate, deleteConversation);

module.exports = router;
