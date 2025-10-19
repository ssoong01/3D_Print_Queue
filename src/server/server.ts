import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import fs from 'fs';
import printsRouter from './routes/prints.js';
import authRouter from './routes/auth.js';
import adminRouter from './routes/admin.js';
import showcaseRouter from './routes/showcase.js';
import { logAccess } from './middleware/ipLogger.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const API_PORT = process.env.API_PORT || 3000;

// Determine uploads directory from environment variable
// Default to 'uploads' in project root (not src directory)
const UPLOADS_DIR = process.env.UPLOADS_DIR 
  ? path.resolve(process.env.UPLOADS_DIR)
  : path.resolve(process.cwd(), 'uploads'); // Use process.cwd() to get project root

// Create uploads directory if it doesn't exist
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  console.log(`Created uploads directory: ${UPLOADS_DIR}`);
}

// MongoDB connection
const MONGODB_URI = `mongodb://${process.env.MONGODB_HOST || 'localhost'}:${process.env.MONGODB_PORT || 27017}/${process.env.MONGODB_DATABASE || 'print-queue'}`;

mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB at ' + MONGODB_URI))
  .catch(err => console.error('MongoDB connection error:', err));

// Middleware
app.use(cors());
app.use(express.json());
app.use(logAccess);

// Serve uploaded files from configurable directory
app.use('/uploads', express.static(UPLOADS_DIR));

// API Routes
app.use('/api/prints', printsRouter);
app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);
app.use('/api/showcase', showcaseRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'API server is running',
    uploadsDir: UPLOADS_DIR
  });
});

// Start server
app.listen(API_PORT, () => {
  console.log(`API Server running on port ${API_PORT}`);
  console.log(`Web UI should be running on port ${process.env.WEB_PORT || 8080}`);
  console.log(`Uploads directory: ${UPLOADS_DIR}`);
});

// Export uploads directory for use in other modules
export { UPLOADS_DIR };