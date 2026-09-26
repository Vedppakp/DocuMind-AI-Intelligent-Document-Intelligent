const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const Document = require('../models/Document');
const Chunk = require('../models/Chunk');
const Conversation = require('../models/Conversation');
const { extractPagesFromPdf, chunkPages } = require('../services/pdfProcessor');
const { getBatchEmbeddings } = require('../services/embeddingService');
const { storeChunks, removeDocumentChunks } = require('../services/vectorStore');

// In-memory documents fallback map
const inMemoryDocuments = new Map();

/**
 * Upload single or multiple PDF documents.
 */
async function uploadDocuments(req, res) {
  try {
    const files = req.files || (req.file ? [req.file] : []);
    if (files.length === 0) {
      return res.status(400).json({ success: false, error: 'Please select at least one PDF document to upload' });
    }

    const userId = String(req.user.id);
    const customApiKey = req.headers['x-gemini-key'] || null;

    const uploadedRecords = [];

    for (const file of files) {
      let docRecord;
      try {
        docRecord = await Document.create({
          userId,
          originalName: file.originalname,
          storedName: file.filename,
          filePath: file.path,
          fileSize: file.size,
          status: 'processing',
        });
      } catch (dbErr) {
        docRecord = {
          _id: 'doc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
          userId,
          originalName: file.originalname,
          storedName: file.filename,
          filePath: file.path,
          fileSize: file.size,
          status: 'processing',
          createdAt: new Date(),
        };
        inMemoryDocuments.set(String(docRecord._id), docRecord);
      }

      uploadedRecords.push(docRecord);

      // Process PDF in the background or immediately
      processPdfDocument(docRecord, file.path, userId, customApiKey).catch((err) => {
        console.error(`[DocProcessError] ${file.originalname}:`, err);
      });
    }

    res.status(202).json({
      success: true,
      message: `Uploaded ${files.length} document(s). Processing has started.`,
      documents: uploadedRecords,
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * Background worker to extract text, chunk, embed, and index chunks.
 */
async function processPdfDocument(docRecord, filePath, userId, customApiKey) {
  const docId = String(docRecord._id);
  try {
    // 1. Extract pages
    const { pageCount, pages } = await extractPagesFromPdf(filePath);

    // 2. Split into chunks
    const rawChunks = chunkPages(pages, { chunkSize: 700, chunkOverlap: 120 });

    // 3. Attach metadata
    const texts = rawChunks.map((c) => c.text);
    const embeddings = await getBatchEmbeddings(texts, customApiKey);

    const enrichedChunks = rawChunks.map((chunk, idx) => ({
      ...chunk,
      embedding: embeddings[idx] || [],
      metadata: {
        documentName: docRecord.originalName,
        startChar: chunk.metadata?.startChar || 0,
        endChar: chunk.metadata?.endChar || 0,
      },
    }));

    // 4. Store in vector store
    await storeChunks(docId, userId, enrichedChunks);

    // 5. Update document status
    try {
      await Document.findByIdAndUpdate(docId, {
        pageCount,
        chunkCount: enrichedChunks.length,
        status: 'ready',
      });
    } catch (dbErr) {
      if (inMemoryDocuments.has(docId)) {
        const mem = inMemoryDocuments.get(docId);
        mem.pageCount = pageCount;
        mem.chunkCount = enrichedChunks.length;
        mem.status = 'ready';
      }
    }

    console.log(`[DocumentProcessor] Successfully indexed "${docRecord.originalName}" (${pageCount} pages, ${enrichedChunks.length} chunks)`);
  } catch (err) {
    console.error(`[DocumentProcessor] Failed for document ${docId}:`, err);
    try {
      await Document.findByIdAndUpdate(docId, {
        status: 'failed',
        errorMessage: err.message,
      });
    } catch (e) {
      if (inMemoryDocuments.has(docId)) {
        inMemoryDocuments.get(docId).status = 'failed';
      }
    }
  }
}

/**
 * Get all documents for the current user/session.
 */
async function getDocuments(req, res) {
  try {
    const userId = String(req.user.id);
    let docs = [];

    try {
      docs = await Document.find({ userId }).sort({ createdAt: -1 }).lean();
    } catch (dbErr) {
      docs = Array.from(inMemoryDocuments.values()).filter((d) => String(d.userId) === userId);
    }

    res.json({ success: true, documents: docs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * Get single document by ID with summary if available.
 */
async function getDocumentById(req, res) {
  try {
    const { id } = req.params;
    let doc = null;
    try {
      doc = await Document.findById(id).lean();
    } catch (e) {
      doc = inMemoryDocuments.get(id);
    }

    if (!doc) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }

    res.json({ success: true, document: doc });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * Get chunks for a specific document (for source inspection/debugging).
 */
async function getDocumentChunks(req, res) {
  try {
    const { id } = req.params;
    let chunks = [];
    try {
      chunks = await Chunk.find({ documentId: id }).sort({ chunkIndex: 1 }).lean();
    } catch (e) {
      // Fallback from vector store cache
    }

    res.json({ success: true, count: chunks.length, chunks });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * Delete a document and its associated chunks & files.
 */
async function deleteDocument(req, res) {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, error: 'Document ID is required' });
    }

    let doc = null;
    try {
      if (mongoose.Types.ObjectId.isValid(id)) {
        doc = await Document.findById(id);
      } else {
        doc = await Document.findOne({ _id: id });
      }
    } catch (e) {
      doc = inMemoryDocuments.get(id);
    }

    if (doc && doc.filePath) {
      try {
        if (fs.existsSync(doc.filePath)) {
          fs.unlinkSync(doc.filePath);
        }
      } catch (fErr) {
        console.warn(`Could not delete file: ${doc.filePath}: ${fErr.message}`);
      }
    }

    await removeDocumentChunks(id);

    try {
      if (mongoose.Types.ObjectId.isValid(id)) {
        await Conversation.deleteMany({ documentId: new mongoose.Types.ObjectId(id) });
      } else {
        await Conversation.deleteMany({ documentId: id });
      }
    } catch (cErr) {
      // safe ignore
    }

    try {
      if (mongoose.Types.ObjectId.isValid(id)) {
        await Document.findByIdAndDelete(id);
      } else {
        await Document.deleteOne({ _id: id });
      }
    } catch (e) {
      // safe fallback
    }

    inMemoryDocuments.delete(id);

    res.json({ success: true, message: 'Document deleted successfully', id });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * Stream raw PDF binary for the embedded PDF viewer.
 */
async function streamPdf(req, res) {
  try {
    const { id } = req.params;
    let doc = null;
    try {
      doc = await Document.findById(id).lean();
    } catch (e) {
      doc = inMemoryDocuments.get(id);
    }

    if (!doc || !doc.filePath || !fs.existsSync(doc.filePath)) {
      return res.status(404).json({ success: false, error: 'PDF file not found on server' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(doc.originalName)}"`);
    fs.createReadStream(doc.filePath).pipe(res);
  } catch (error) {
    console.error('PDF stream error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * Update document folder / project.
 */
async function updateDocumentFolder(req, res) {
  try {
    const { id } = req.params;
    const { folder = 'General' } = req.body;

    let doc = await Document.findByIdAndUpdate(
      id,
      { folder: folder.trim() || 'General' },
      { new: true }
    );

    if (!doc && inMemoryDocuments.has(id)) {
      doc = inMemoryDocuments.get(id);
      doc.folder = folder.trim() || 'General';
    }

    res.json({ success: true, document: doc });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * Get distinct project folders and document counts.
 */
async function getFolders(req, res) {
  try {
    const userId = String(req.user.id);
    const docs = await Document.find({ userId }).select('folder').lean();
    const folderMap = { General: 0 };

    for (const d of docs) {
      const f = d.folder || 'General';
      folderMap[f] = (folderMap[f] || 0) + 1;
    }

    const folders = Object.keys(folderMap).map((name) => ({
      name,
      count: folderMap[name],
    }));

    res.json({ success: true, folders });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * Load a pre-existing sample comparative PDF into the user's workspace.
 */
async function loadSampleDocument(req, res) {
  try {
    const userId = String(req.user.id);
    const customApiKey = req.headers['x-gemini-key'] || null;
    const samplePath = path.resolve(__dirname, '../../../sample_comparative_report.pdf');

    if (!fs.existsSync(samplePath)) {
      return res.status(404).json({ success: false, error: 'Sample comparative PDF not found at ' + samplePath });
    }

    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const storedName = `${Date.now()}-sample_comparative_report.pdf`;
    const targetPath = path.join(uploadDir, storedName);
    fs.copyFileSync(samplePath, targetPath);
    const stats = fs.statSync(targetPath);

    let docRecord;
    try {
      docRecord = await Document.create({
        userId,
        originalName: 'Sample_Comparative_Research_Report.pdf',
        storedName,
        filePath: targetPath,
        fileSize: stats.size,
        status: 'processing',
      });
    } catch (e) {
      docRecord = {
        _id: 'doc_' + Date.now(),
        userId,
        originalName: 'Sample_Comparative_Research_Report.pdf',
        storedName,
        filePath: targetPath,
        fileSize: stats.size,
        status: 'processing',
        createdAt: new Date(),
      };
      inMemoryDocuments.set(String(docRecord._id), docRecord);
    }

    // Process PDF in the background
    processPdfDocument(docRecord, targetPath, userId, customApiKey).catch((err) => {
      console.error('[DocProcessError] sample_comparative_report.pdf:', err);
    });

    res.json({
      success: true,
      message: 'Sample comparative document loaded successfully',
      document: docRecord,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = {
  uploadDocuments,
  getDocuments,
  getDocumentById,
  getDocumentChunks,
  deleteDocument,
  streamPdf,
  updateDocumentFolder,
  getFolders,
  loadSampleDocument,
};
