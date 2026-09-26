const { GoogleGenAI } = require('@google/genai');
const Chunk = require('../models/Chunk');
const Document = require('../models/Document');

/**
 * Heuristic summary generator when no LLM API key is present.
 */
function generateLocalSummary(chunks, documentName) {
  const sampleChunks = chunks.slice(0, 6);
  const text = sampleChunks.map((c) => c.text).join(' ');
  const sentences = text.split(/(?<=[.?!])\s+/).filter((s) => s.length > 30);

  const executive = sentences.slice(0, 3).join(' ') || `Summary for ${documentName}. This document contains ${chunks.length} structured sections.`;
  const keyPoints = sentences.slice(3, 8).map((s) => s.trim());
  const actionItems = sentences.slice(8, 11).map((s) => `Review: ${s.trim()}`);
  const words = text.toLowerCase().match(/\b[a-z]{5,15}\b/g) || [];
  const freq = {};
  words.forEach((w) => {
    freq[w] = (freq[w] || 0) + 1;
  });
  const topics = Object.keys(freq)
    .sort((a, b) => freq[b] - freq[a])
    .slice(0, 6);

  return {
    executive,
    keyPoints: keyPoints.length > 0 ? keyPoints : ['Document ingested and indexed for semantic question answering.'],
    actionItems: actionItems.length > 0 ? actionItems : ['Explore sections with conversational queries.'],
    topics: topics.length > 0 ? topics : ['document', 'analysis', 'insights'],
  };
}

/**
 * Generates an executive summary for a document.
 * @param {string} documentId
 * @param {Object} options - { customApiKey: string, model: string }
 */
async function generateDocumentSummary(documentId, options = {}) {
  const customApiKey = options.customApiKey || null;
  const apiKey = customApiKey || process.env.GEMINI_API_KEY;
  const modelName = options.model || 'gemini-2.5-flash';

  const doc = await Document.findById(documentId);
  if (!doc) throw new Error('Document not found');

  const chunks = await Chunk.find({ documentId }).sort({ chunkIndex: 1 }).lean();
  if (chunks.length === 0) throw new Error('No chunks found for this document');

  // If already generated and not forced, return cached summary
  if (doc.summary && doc.summary.executive && !options.regenerate) {
    return doc.summary;
  }

  // Sample text across the document (beginning, middle, end)
  const sampledText = chunks
    .filter((_, idx) => idx % Math.max(1, Math.floor(chunks.length / 10)) === 0)
    .slice(0, 10)
    .map((c) => `[Page ${c.pageNumber}]: ${c.text}`)
    .join('\n\n');

  if (!apiKey) {
    const localSummary = generateLocalSummary(chunks, doc.originalName);
    doc.summary = { ...localSummary, generatedAt: new Date() };
    await doc.save();
    return doc.summary;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `You are DocuMind AI, an expert document analyst.
Analyze the following excerpts from the document "${doc.originalName}" (${doc.pageCount} pages).

Generate a structured document intelligence briefing in JSON format with exactly the following structure:
{
  "executive": "A thorough 2-3 paragraph executive summary explaining the primary objective, context, and findings of the document.",
  "keyPoints": [
    "Key takeaway or finding 1 (cite page number if known)",
    "Key takeaway or finding 2",
    "Key takeaway or finding 3",
    "Key takeaway or finding 4",
    "Key takeaway or finding 5"
  ],
  "actionItems": [
    "Action item or operational recommendation 1",
    "Action item or operational recommendation 2",
    "Action item or operational recommendation 3"
  ],
  "topics": [
    "Topic 1", "Topic 2", "Topic 3", "Topic 4", "Topic 5"
  ]
}

Return ONLY valid raw JSON with no backticks, markdown fences, or extra text.

DOCUMENT EXCERPTS:
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
    doc.summary = {
      executive: parsed.executive || '',
      keyPoints: parsed.keyPoints || [],
      actionItems: parsed.actionItems || [],
      topics: parsed.topics || [],
      generatedAt: new Date(),
    };

    await doc.save();
    return doc.summary;
  } catch (err) {
    console.warn(`[SummaryService] Gemini summary generation failed: ${err.message}. Using fallback summary.`);
    const fallback = generateLocalSummary(chunks, doc.originalName);
    doc.summary = { ...fallback, generatedAt: new Date() };
    await doc.save();
    return doc.summary;
  }
}

module.exports = {
  generateDocumentSummary,
};
