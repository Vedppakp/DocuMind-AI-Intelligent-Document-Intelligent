const mongoose = require('mongoose');
const Chunk = require('../models/Chunk');
const Document = require('../models/Document');
const { getEmbedding, cosineSimilarity } = require('./embeddingService');

// In-memory chunk cache for instant vector search and fallback
const inMemoryChunks = new Map();

/**
 * Stores chunks into MongoDB and in-memory cache.
 * @param {string} documentId
 * @param {string} userId
 * @param {Array} chunksWithEmbeddings
 */
async function storeChunks(documentId, userId, chunksWithEmbeddings) {
  const docsToInsert = chunksWithEmbeddings.map((c) => ({
    documentId,
    userId,
    pageNumber: c.pageNumber,
    chunkIndex: c.chunkIndex,
    text: c.text,
    tokenCount: c.tokenCount || Math.ceil(c.text.length / 4),
    embedding: c.embedding,
    metadata: c.metadata || {},
  }));

  // Store in in-memory map
  inMemoryChunks.set(String(documentId), docsToInsert);

  try {
    const objId = mongoose.Types.ObjectId.isValid(documentId)
      ? new mongoose.Types.ObjectId(documentId)
      : documentId;
    await Chunk.deleteMany({ documentId: objId });
    await Chunk.insertMany(docsToInsert);
  } catch (err) {
    console.warn(`[VectorStore] MongoDB insert failed: ${err.message}. Relying on in-memory store.`);
  }
}

/**
 * Stop words filter for high-precision lexical matching.
 */
const STOP_WORDS = new Set([
  'a', 'an', 'the', 'is', 'are', 'was', 'were', 'and', 'or', 'in', 'on', 'at',
  'to', 'for', 'of', 'with', 'by', 'from', 'about', 'this', 'that', 'these',
  'those', 'it', 'its', 'as', 'what', 'which', 'who', 'when', 'where', 'why',
  'how', 'can', 'could', 'would', 'should', 'do', 'does', 'did', 'please', 'give',
  'me', 'tell', 'show', 'provide'
]);

/**
 * Searches chunks across specified document(s) using dense vector cosine similarity and BM25-lite keyword boosting.
 * @param {string} query
 * @param {string[]} documentIds
 * @param {Object} options - { topK: number, customApiKey: string }
 */
async function searchSimilarChunks(query, documentIds = [], options = {}) {
  const topK = options.topK || 6;
  const customApiKey = options.customApiKey || null;

  if (!query || query.trim().length === 0) return [];

  // Generate query embedding
  const queryEmbedding = await getEmbedding(query, customApiKey);

  // Filter query terms
  const rawTerms = query.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
  const meaningfulTerms = rawTerms.filter((w) => !STOP_WORDS.has(w) && w.length > 2);

  // Term expansion for common document queries
  const ALIAS_MAP = {
    student: ['name', 'roll', 'student', 'candidate', 'intern', 'presenter'],
    presenter: ['presenter', 'name', 'roll', 'author', 'candidate'],
    author: ['author', 'name', 'roll', 'candidate', 'by'],
    certificate: ['certificate', 'snu', 'completion', 'credential', 'certified'],
    id: ['id', 'roll', 'snu', 'credential'],
    faculty: ['faculty', 'guide', 'mentor', 'supervisor', 'prof', 'dr'],
    score: ['points', 'score', 'achievement', 'pts'],
    topic: ['domain', 'topic', 'title', 'itsm', 'workflow'],
    domain: ['domain', 'enterprise', 'cloud', 'itsm', 'software'],
  };

  const expandedTerms = new Set(meaningfulTerms);
  for (const term of meaningfulTerms) {
    if (ALIAS_MAP[term]) {
      ALIAS_MAP[term].forEach((alias) => expandedTerms.add(alias));
    }
  }

  const queryTermsList = Array.from(expandedTerms);
  const isSummaryQuery = /\b(summary|summarize|overview|briefing|abstract|presentation|document|about)\b/i.test(query);
  const isPresenterQuery = /\b(who|name|student|author|presenter|roll|candidate|faculty|guide|team|member|members|supervisor)\b/i.test(query);
  const isCertQuery = /\b(certificat|credential|score|points|id|snu|completion)\b/i.test(query);

  // Retrieve candidate chunks
  let candidateChunks = [];
  const stringDocIds = (documentIds || []).map((id) => String(id));

  try {
    const filter = {};
    if (stringDocIds.length > 0) {
      const validObjectIds = stringDocIds
        .filter((id) => mongoose.Types.ObjectId.isValid(id))
        .map((id) => new mongoose.Types.ObjectId(id));
      if (validObjectIds.length > 0) {
        filter.documentId = { $in: validObjectIds };
      } else {
        filter.documentId = { $in: stringDocIds };
      }
    }
    candidateChunks = await Chunk.find(filter).select('+embedding').lean();
  } catch (err) {
    console.warn(`[VectorStore] MongoDB query warning: ${err.message}. Using cache.`);
  }

  // Fallback to in-memory cache if MongoDB returned 0
  if (candidateChunks.length === 0) {
    if (stringDocIds.length > 0) {
      stringDocIds.forEach((docId) => {
        const cached = inMemoryChunks.get(docId) || [];
        candidateChunks.push(...cached);
      });
    } else {
      for (const [_, cachedList] of inMemoryChunks.entries()) {
        candidateChunks.push(...cachedList);
      }
    }
  }

  if (candidateChunks.length === 0) return [];

  // Populate document names map for multi-document labeling
  const docIdsToLookup = [...new Set(candidateChunks.map((c) => String(c.documentId)))];
  const docMap = new Map();
  try {
    const docs = await Document.find({ _id: { $in: docIdsToLookup } }).select('_id originalName').lean();
    docs.forEach((d) => docMap.set(String(d._id), d.originalName));
  } catch (e) {}

  // Score each candidate chunk
  const scoredChunks = candidateChunks.map((chunk) => {
    let vectorScore = 0;
    if (chunk.embedding && chunk.embedding.length > 0) {
      vectorScore = cosineSimilarity(queryEmbedding, chunk.embedding);
    }

    const lowerText = (chunk.text || '').toLowerCase();

    // Lexical match score against expanded query terms
    let lexicalScore = 0;
    let exactMatches = 0;

    for (const term of queryTermsList) {
      if (lowerText.includes(term)) {
        exactMatches++;
        const occurrences = lowerText.split(term).length - 1;
        lexicalScore += Math.min(occurrences * 0.1, 0.3);
      }
    }

    // Match percentage bonus
    if (queryTermsList.length > 0) {
      lexicalScore += (exactMatches / queryTermsList.length) * 0.45;
    }

    // Positional / Section Prioritization:
    let structuralBonus = 0;
    if (isSummaryQuery) {
      if (chunk.pageNumber === 1) structuralBonus += 0.35;
      else if (chunk.pageNumber === 2 || chunk.pageNumber === 4) structuralBonus += 0.2;
      else if (chunk.chunkIndex === 0) structuralBonus += 0.3;
      else if (lowerText.includes('conclusion') || lowerText.includes('results') || lowerText.includes('outcomes')) {
        structuralBonus += 0.25;
      }
    }

    // Specific intent boosts
    if (isPresenterQuery && (chunk.pageNumber === 1 || lowerText.includes('roll no') || lowerText.includes('faculty guide'))) {
      structuralBonus += 0.4;
    }

    if (isCertQuery && (lowerText.includes('certificate') || lowerText.includes('snu') || lowerText.includes('completion (id'))) {
      structuralBonus += 0.4;
    }

    const finalScore = (vectorScore * 0.4) + (lexicalScore * 0.45) + structuralBonus;

    return {
      chunkId: chunk._id ? String(chunk._id) : `mem-${chunk.chunkIndex}`,
      documentId: String(chunk.documentId),
      documentName: chunk.metadata?.documentName || docMap.get(String(chunk.documentId)) || 'Document',
      pageNumber: chunk.pageNumber,
      chunkIndex: chunk.chunkIndex,
      text: chunk.text,
      score: Number(finalScore.toFixed(4)),
    };
  });

  // Sort descending
  scoredChunks.sort((a, b) => b.score - a.score);

  // If summary query, ensure representation across beginning, middle, and end
  if (isSummaryQuery && scoredChunks.length > topK) {
    const selected = [];
    const seenPages = new Set();

    // Page 1 is mandatory for a document summary
    const page1Chunk = candidateChunks.find((c) => c.pageNumber === 1);
    if (page1Chunk) {
      selected.push({
        chunkId: String(page1Chunk._id),
        documentId: String(page1Chunk.documentId),
        documentName: docMap.get(String(page1Chunk.documentId)) || page1Chunk.metadata?.documentName || 'Document',
        pageNumber: 1,
        chunkIndex: page1Chunk.chunkIndex,
        text: page1Chunk.text,
        score: 0.99,
      });
      seenPages.add(1);
    }

    for (const chunk of scoredChunks) {
      if (selected.length >= topK) break;
      if (!seenPages.has(chunk.pageNumber)) {
        selected.push(chunk);
        seenPages.add(chunk.pageNumber);
      }
    }

    // Fill remaining if needed
    for (const chunk of scoredChunks) {
      if (selected.length >= topK) break;
      if (!selected.some((s) => s.chunkId === chunk.chunkId)) {
        selected.push(chunk);
      }
    }

    return selected;
  }

  return scoredChunks.slice(0, topK);
}

/**
 * Removes chunks for a deleted document.
 */
async function removeDocumentChunks(documentId) {
  inMemoryChunks.delete(String(documentId));
  try {
    const objId = mongoose.Types.ObjectId.isValid(documentId)
      ? new mongoose.Types.ObjectId(documentId)
      : documentId;
    await Chunk.deleteMany({ documentId: objId });
  } catch (err) {
    console.warn(`[VectorStore] Error deleting chunks: ${err.message}`);
  }
}

/**
 * Gets chunk statistics for admin metrics.
 */
async function getVectorStoreMetrics() {
  let totalChunks = 0;
  try {
    totalChunks = await Chunk.countDocuments();
  } catch (err) {
    for (const [_, list] of inMemoryChunks.entries()) {
      totalChunks += list.length;
    }
  }

  return {
    totalChunks,
    cachedDocumentsCount: inMemoryChunks.size,
  };
}

module.exports = {
  storeChunks,
  searchSimilarChunks,
  removeDocumentChunks,
  getVectorStoreMetrics,
};
