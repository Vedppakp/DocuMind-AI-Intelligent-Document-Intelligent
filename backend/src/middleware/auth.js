const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'documind-super-secret-jwt-key-2026';

/**
 * Authentication middleware.
 * Strictly requires valid JWT Bearer token. Guest mode is disabled.
 */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required. Please log in to access DocuMind AI tools.',
      });
    }

    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      if (decoded.isGuest) {
        return res.status(401).json({
          success: false,
          error: 'Guest access is disabled. Please log in to access all tools.',
        });
      }
      req.user = decoded;
      return next();
    } catch (jwtErr) {
      return res.status(401).json({
        success: false,
        error: 'Session expired or invalid token. Please log in again.',
      });
    }
  } catch (error) {
    res.status(401).json({ success: false, error: 'Authentication failed' });
  }
}

/**
 * Admin role guard
 */
function requireAdmin(req, res, next) {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ success: false, error: 'Admin privileges required' });
}

module.exports = {
  authenticate,
  requireAdmin,
  JWT_SECRET,
};
