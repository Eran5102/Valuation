import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { pdfController } from './controllers/pdfController';
import { errorHandler } from './middleware/errorHandler';

const app = express();
const PORT = process.env.REPORT_SERVER_PORT || 3001;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for PDF generation
}));

// CORS configuration
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3005', 'http://localhost:3017', 'http://localhost:3018', 'http://localhost:3019', 'http://localhost:3020', 'http://localhost:3021', 'http://localhost:3022', 'http://localhost:3023', 'http://localhost:3025'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  preflightContinue: false,
  optionsSuccessStatus: 200
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.post('/api/generate-pdf', pdfController.generatePDF);
app.post('/api/generate-pdf-from-html', pdfController.generatePDFFromHTML);
app.post('/api/template-preview', pdfController.generateTemplatePreview);
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', service: '409A Report Generator', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 409A Report Generator Server running on port ${PORT}`);
  console.log(`📄 PDF Generation API available at http://localhost:${PORT}/api/generate-pdf`);
});

export default app;