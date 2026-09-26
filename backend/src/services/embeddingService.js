const { GoogleGenAI } = require('@google/genai');

/**
 * Deterministic local fallback embedding generator.
 * Produces a normalized 128-dimensional float vector based on character and word n-grams.
 * Ensures vector search and cosine similarity work seamlessly even without an external API key.
 */
function generateLocalEmbedding(text, dimensions = 128) {
  const vector = new Float32Array(dimensions);
  if (!text || typeof text !== 'string') return Array.from(vector);

  const clean = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
  const words = clean.split(/\s+/).filter(Boolean);

  // Word-level hash distribution
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    let hash = 0;
    for (let c = 0; c < word.length; c++) {
      hash = (hash * 31 + word.charCodeAt(c)) & 0xffffffff;
    }
    const idx = Math.abs(hash) % dimensions;
    const weight = 1.0 + Math.log(1 + 1.0 / (i + 1));
    vector[idx] += weight;

    // Bigram context
    if (i > 0) {
      let biHash = 0;
      const bi = words[i - 1] + '_' + word;
      for (let c = 0; c < bi.length; c++) {
        biHash = (biHash * 37 + bi.charCodeAt(c)) & 0xffffffff;
      }
      const biIdx = Math.abs(biHash) % dimensions;
      vector[biIdx] += 1.5;
    }
  }

  // L2 Normalization (unit vector)
  let norm = 0;
  for (let i = 0; i < dimensions; i++) {
    norm += vector[i] * vector[i];
  }
  norm = Math.sqrt(norm);
  if (norm > 0) {
    for (let i = 0; i < dimensions; i++) {
      vector[i] /= norm;
    }
  }

  return Array.from(vector);
}

/**
 * Computes cosine similarity between two float vectors.
 */
function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0) return 0;
  if (vecA.length !== vecB.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;
  return dotProduct / denominator;
}

/**
 * Generates an embedding vector for a single string.
 * @param {string} text - Input text.
 * @param {string} [customApiKey] - Optional API key provided per-request.
 * @returns {Promise<number[]>}
 */
async function getEmbedding(text, customApiKey = null) {
  const apiKey = customApiKey || process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const result = await ai.models.embedContent({
        model: 'text-embedding-004',
        contents: text.slice(0, 8000),
      });

      if (result && result.embedding && Array.isArray(result.embedding.values)) {
        return result.embedding.values;
      }
    } catch (err) {
      console.warn(`[EmbeddingService] Gemini embedding failed: ${err.message}. Using fallback.`);
    }
  }

  return generateLocalEmbedding(text);
}

/**
 * Batch generates embeddings for an array of text chunks.
 * @param {string[]} texts
 * @param {string} [customApiKey]
 * @returns {Promise<Array<number[]>>}
 */
async function getBatchEmbeddings(texts, customApiKey = null) {
  const embeddings = [];
  for (let i = 0; i < texts.length; i++) {
    const emb = await getEmbedding(texts[i], customApiKey);
    embeddings.push(emb);
  }
  return embeddings;
}

module.exports = {
  getEmbedding,
  getBatchEmbeddings,
  cosineSimilarity,
  generateLocalEmbedding,
};
