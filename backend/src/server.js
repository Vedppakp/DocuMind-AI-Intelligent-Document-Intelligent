require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { connectDB, getDBStatus } = require('./config/db');

// Route imports
const authRoutes = require('./routes/authRoutes');
const documentRoutes = require('./routes/documentRoutes');
const chatRoutes = require('./routes/chatRoutes');
const toolRoutes = require('./routes/toolRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

// Connect to MongoDB
connectDB();

// CORS configuration supporting production FRONTEND_URL and Netlify subdomains
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
].filter(Boolean).flatMap((url) => url.split(',').map((u) => u.trim()));

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server, mobile, curl, or container health probes with no origin
      if (!origin) return callback(null, true);

      // In development or if FRONTEND_URL is wildcard/unset, allow all
      if (!process.env.FRONTEND_URL || process.env.FRONTEND_URL === '*') {
        return callback(null, true);
      }

      // Check explicit allowed origins list
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Automatically support Netlify deploy previews and custom subdomains
      if (origin.endsWith('.netlify.app')) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-guest-id', 'x-gemini-key'],
  })
);

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Serve uploaded files statically if needed
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Top-level simple health check endpoint (GET /health)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'DocuMind AI Backend is running',
    timestamp: new Date().toISOString(),
  });
});

// Detailed health check endpoint (GET /api/health)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'DocuMind AI — Intelligent PDF Document Assistant',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    database: getDBStatus(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/tools', toolRoutes);
app.use('/api/admin', adminRoutes);

// 404 Handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    error: `Cannot ${req.method} ${req.url}`,
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[GlobalError]', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
  });
});

app.listen(PORT, HOST, () => {
  console.log(`====================================================`);
  console.log(`🚀 DocuMind AI Backend running on ${HOST}:${PORT}`);
  console.log(`🌐 Health check: http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}/health`);
  console.log(`====================================================`);
});
