const { generateDocumentSummary } = require('../services/summaryService');
const { generateQuiz } = require('../services/quizService');
const { compareDocuments } = require('../services/compareService');
const { generateReport } = require('../services/reportService');

async function handleSummarize(req, res) {
  try {
    const { documentId } = req.params;
    const { regenerate } = req.body;
    const customApiKey = req.headers['x-gemini-key'] || null;

    const summary = await generateDocumentSummary(documentId, {
      customApiKey,
      regenerate: Boolean(regenerate),
    });

    res.json({ success: true, summary });
  } catch (error) {
    console.error('Summarize error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

async function handleQuiz(req, res) {
  try {
    const { documentId } = req.params;
    const { count = 5 } = req.body;
    const customApiKey = req.headers['x-gemini-key'] || null;

    const questions = await generateQuiz(documentId, {
      count: Number(count),
      customApiKey,
    });

    res.json({ success: true, questions });
  } catch (error) {
    console.error('Quiz error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

async function handleCompare(req, res) {
  try {
    const { docId1, docId2 } = req.body;
    const customApiKey = req.headers['x-gemini-key'] || null;

    if (!docId1 || !docId2) {
      return res.status(400).json({ success: false, error: 'Both docId1 and docId2 are required for comparison' });
    }

    const comparison = await compareDocuments(docId1, docId2, {
      customApiKey,
    });

    res.json({ success: true, comparison });
  } catch (error) {
    console.error('Compare error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

async function handleReport(req, res) {
  try {
    const { documentId } = req.params;
    const { conversationId } = req.query;

    const report = await generateReport(documentId, conversationId);
    res.json({ success: true, report });
  } catch (error) {
    console.error('Report error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = {
  handleSummarize,
  handleQuiz,
  handleCompare,
  handleReport,
};
