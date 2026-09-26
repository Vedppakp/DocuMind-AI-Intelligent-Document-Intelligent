const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const { answerQuestion } = require('../services/ragService');

// Fallback in-memory chat maps
const inMemoryConversations = new Map();
const inMemoryMessages = new Map();

async function sendMessage(req, res) {
  try {
    const { question, documentIds = [], conversationId, model, strictGrounding, temperature } = req.body;
    const userId = String(req.user.id);
    const customApiKey = req.headers['x-gemini-key'] || null;

    if (!question || question.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Question is required' });
    }

    // 1. Resolve or create conversation
    let conv = null;
    let activeConvId = conversationId;

    if (activeConvId) {
      try {
        conv = await Conversation.findById(activeConvId);
      } catch (e) {
        conv = inMemoryConversations.get(activeConvId);
      }
    }

    if (!conv) {
      const title = question.slice(0, 35) + (question.length > 35 ? '...' : '');
      try {
        conv = await Conversation.create({
          userId,
          title,
          documentIds,
          lastMessageAt: new Date(),
        });
        activeConvId = String(conv._id);
      } catch (e) {
        activeConvId = 'conv_' + Date.now();
        conv = {
          _id: activeConvId,
          userId,
          title,
          documentIds,
          lastMessageAt: new Date(),
          createdAt: new Date(),
        };
        inMemoryConversations.set(activeConvId, conv);
      }
    } else {
      // Update active documentIds if provided
      if (documentIds.length > 0) {
        conv.documentIds = documentIds;
        conv.lastMessageAt = new Date();
        try {
          await conv.save();
        } catch (e) {}
      }
    }

    // 2. Save user message
    let userMsgRecord;
    try {
      userMsgRecord = await Message.create({
        conversationId: activeConvId,
        role: 'user',
        content: question,
      });
    } catch (e) {
      userMsgRecord = {
        _id: 'msg_' + Date.now() + '_u',
        conversationId: activeConvId,
        role: 'user',
        content: question,
        createdAt: new Date(),
      };
      const list = inMemoryMessages.get(activeConvId) || [];
      list.push(userMsgRecord);
      inMemoryMessages.set(activeConvId, list);
    }

    // 3. Retrieve recent history
    let history = [];
    try {
      history = await Message.find({ conversationId: activeConvId })
        .sort({ createdAt: 1 })
        .limit(6)
        .lean();
    } catch (e) {
      history = inMemoryMessages.get(activeConvId) || [userMsgRecord];
    }

    // 4. Run RAG Pipeline
    const targetDocIds = documentIds.length > 0 ? documentIds : (conv.documentIds || []);
    const ragResult = await answerQuestion(question, targetDocIds, history, {
      customApiKey,
      model,
      strictGrounding,
      temperature,
    });

    // 5. Save assistant response
    const isGrounded = ragResult.isGrounded !== false;
    const groundedConfidence = ragResult.groundedConfidence || (isGrounded ? 92 : 0);
    const groundedPages = ragResult.groundedPages || (ragResult.citations ? [...new Set(ragResult.citations.map((c) => c.pageNumber))].sort((a, b) => a - b) : []);

    let assistantMsgRecord;
    try {
      assistantMsgRecord = await Message.create({
        conversationId: activeConvId,
        role: 'assistant',
        content: ragResult.answer,
        citations: ragResult.citations,
        suggestedQuestions: ragResult.suggestedQuestions,
        isGrounded,
        groundedConfidence,
        groundedPages,
      });
    } catch (e) {
      assistantMsgRecord = {
        _id: 'msg_' + Date.now() + '_a',
        conversationId: activeConvId,
        role: 'assistant',
        content: ragResult.answer,
        citations: ragResult.citations,
        suggestedQuestions: ragResult.suggestedQuestions,
        isGrounded,
        groundedConfidence,
        groundedPages,
        createdAt: new Date(),
      };
      const list = inMemoryMessages.get(activeConvId) || [];
      list.push(assistantMsgRecord);
      inMemoryMessages.set(activeConvId, list);
    }

    res.json({
      success: true,
      conversationId: activeConvId,
      message: assistantMsgRecord,
      citations: ragResult.citations,
      suggestedQuestions: ragResult.suggestedQuestions,
      isGrounded,
      groundedConfidence,
      groundedPages,
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

async function getConversations(req, res) {
  try {
    const userId = String(req.user.id);
    let convs = [];
    try {
      convs = await Conversation.find({ userId })
        .populate('documentIds', 'originalName pageCount')
        .sort({ lastMessageAt: -1 })
        .lean();
    } catch (e) {
      convs = Array.from(inMemoryConversations.values()).filter((c) => String(c.userId) === userId);
    }

    res.json({ success: true, conversations: convs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

async function getConversationMessages(req, res) {
  try {
    const { id } = req.params;
    let messages = [];
    try {
      messages = await Message.find({ conversationId: id }).sort({ createdAt: 1 }).lean();
    } catch (e) {
      messages = inMemoryMessages.get(id) || [];
    }

    res.json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

async function createConversation(req, res) {
  try {
    const userId = String(req.user.id);
    const { title = 'New Research Chat', documentIds = [] } = req.body;

    let conv;
    try {
      conv = await Conversation.create({
        userId,
        title,
        documentIds,
      });
    } catch (e) {
      conv = {
        _id: 'conv_' + Date.now(),
        userId,
        title,
        documentIds,
        lastMessageAt: new Date(),
        createdAt: new Date(),
      };
      inMemoryConversations.set(String(conv._id), conv);
    }

    res.status(201).json({ success: true, conversation: conv });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

async function deleteConversation(req, res) {
  try {
    const { id } = req.params;
    try {
      await Message.deleteMany({ conversationId: id });
      await Conversation.findByIdAndDelete(id);
    } catch (e) {
      inMemoryMessages.delete(id);
      inMemoryConversations.delete(id);
    }

    res.json({ success: true, message: 'Conversation deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = {
  sendMessage,
  getConversations,
  getConversationMessages,
  createConversation,
  deleteConversation,
};
