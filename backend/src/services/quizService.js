const { GoogleGenAI } = require('@google/genai');
const Chunk = require('../models/Chunk');
const Document = require('../models/Document');

/**
 * Fallback quiz generator when no API key is present.
 */
function generateLocalQuiz(chunks) {
  const quizQuestions = [];
  const selectedChunks = chunks.slice(0, 5);

  selectedChunks.forEach((chunk, i) => {
    const text = chunk.text;
    const sentences = text.split(/(?<=[.?!])\s+/).filter((s) => s.length > 25);
    const keySentence = sentences[0] || 'The document highlights significant concepts in this domain.';

    quizQuestions.push({
      id: `q-${i + 1}`,
      question: `According to Page ${chunk.pageNumber}, what key point is discussed?`,
      options: [
        keySentence.slice(0, 100) + '...',
        'The document rejects this methodology without evidence.',
        'This factor was not recorded in the document observations.',
        'None of the above statements apply to this section.',
      ],
      correctAnswer: 0,
      explanation: `Referenced directly from Page ${chunk.pageNumber}: "${text.slice(0, 150)}..."`,
      sourcePage: chunk.pageNumber,
    });
  });

  return quizQuestions;
}

/**
 * Generates an interactive multiple choice quiz based on the document.
 * @param {string} documentId
 * @param {Object} options - { count: number, customApiKey: string, model: string }
 */
async function generateQuiz(documentId, options = {}) {
  const customApiKey = options.customApiKey || null;
  const apiKey = customApiKey || process.env.GEMINI_API_KEY;
  const modelName = options.model || 'gemini-2.5-flash';
  const questionCount = Math.min(options.count || 5, 10);

  const doc = await Document.findById(documentId);
  if (!doc) throw new Error('Document not found');

  const chunks = await Chunk.find({ documentId }).sort({ chunkIndex: 1 }).lean();
  if (chunks.length === 0) throw new Error('No chunks found for this document');

  if (!apiKey) {
    return generateLocalQuiz(chunks);
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const sampledText = chunks
      .slice(0, 8)
      .map((c) => `[Page ${c.pageNumber}]: ${c.text}`)
      .join('\n\n');

    const prompt = `You are DocuMind AI, an expert educational assessor.
Create an interactive quiz consisting of ${questionCount} multiple choice questions (MCQs) based on the document "${doc.originalName}".

Strict JSON Output format:
{
  "questions": [
    {
      "id": "q-1",
      "question": "Question text?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "Detailed explanation citing the specific fact and page number.",
      "sourcePage": 1
    }
  ]
}

Ensure:
- Exactly 4 options per question.
- "correctAnswer" is the zero-based index (0, 1, 2, or 3) of the correct option.
- Questions test comprehension, critical facts, and key ideas.
- Only return valid raw JSON without markdown markers.

DOCUMENT CONTENT:
${sampledText}
`;

    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text);
    return parsed.questions || generateLocalQuiz(chunks);
  } catch (err) {
    console.warn(`[QuizService] Gemini quiz generation failed: ${err.message}. Using fallback quiz.`);
    return generateLocalQuiz(chunks);
  }
}

module.exports = {
  generateQuiz,
};
