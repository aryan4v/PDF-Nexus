import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { PDFDocument, rgb, degrees as pdfDegrees } from 'pdf-lib';
import mammoth from 'mammoth';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import * as XLSX from 'xlsx';
import pdfParse from 'pdf-parse';
import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json());

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (err) {
      cb(err, null);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
});

// Cleanup function
const cleanupFile = async (filePath) => {
  try {
    await fs.unlink(filePath);
  } catch (err) {
    console.error('Cleanup error:', err);
  }
};

// Error handler wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// 1. MERGE PDFs
app.post('/api/merge-pdf', upload.array('files'), asyncHandler(async (req, res) => {
  const files = req.files;
  if (!files || files.length === 0) {
    return res.status(400).json({ error: 'No files provided' });
  }

  try {
    console.log('Merging', files.length, 'PDFs...');
    const mergedPdf = await PDFDocument.create();
    
    for (const file of files) {
      const fileBuffer = await fs.readFile(file.path);
      const pdf = await PDFDocument.load(fileBuffer);
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      copiedPages.forEach((page) => mergedPdf.addPage(page));
      await cleanupFile(file.path);
    }
    
    const pdfBytes = await mergedPdf.save();
    console.log('Merge complete:', pdfBytes.byteLength, 'bytes');
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=merged.pdf');
    res.send(Buffer.from(pdfBytes));
  } catch (error) {
    console.error('Merge error:', error);
    files?.forEach(f => cleanupFile(f.path));
    res.status(500).json({ error: error.message });
  }
}));

// 2. SPLIT PDF
app.post('/api/split-pdf', upload.single('file'), async (req, res) => {
  const file = req.file;
  const pageNumber = parseInt(req.body.page) || 1;
  
  try {
    const fileBuffer = await fs.readFile(file.path);
    const pdfDoc = await PDFDocument.load(fileBuffer);
    const newPdf = await PDFDocument.create();
    
    const [page] = await newPdf.copyPages(pdfDoc, [pageNumber - 1]);
    newPdf.addPage(page);
    
    const pdfBytes = await newPdf.save();
    await cleanupFile(file.path);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=page_${pageNumber}.pdf`);
    res.send(Buffer.from(pdfBytes));
  } catch (error) {
    console.error('Split error:', error);
    await cleanupFile(file.path);
    res.status(500).json({ error: error.message });
  }
});

// 3. REMOVE PAGES
app.post('/api/remove-pages', upload.single('file'), async (req, res) => {
  const file = req.file;
  const pagesToRemove = JSON.parse(req.body.pages || '[1]'); // Array of page numbers
  
  try {
    const fileBuffer = await fs.readFile(file.path);
    const pdfDoc = await PDFDocument.load(fileBuffer);
    const totalPages = pdfDoc.getPageCount();
    const newPdf = await PDFDocument.create();
    
    const pagesToKeep = Array.from({ length: totalPages }, (_, i) => i)
      .filter(i => !pagesToRemove.includes(i + 1));
    
    const copiedPages = await newPdf.copyPages(pdfDoc, pagesToKeep);
    copiedPages.forEach(page => newPdf.addPage(page));
    
    const pdfBytes = await newPdf.save();
    await cleanupFile(file.path);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=removed_pages.pdf');
    res.send(Buffer.from(pdfBytes));
  } catch (error) {
    console.error('Remove pages error:', error);
    await cleanupFile(file.path);
    res.status(500).json({ error: error.message });
  }
});

// 4. REORDER PAGES
app.post('/api/reorder-pdf', upload.single('file'), async (req, res) => {
  const file = req.file;
  const reverse = req.body.reverse === 'true';
  
  try {
    const fileBuffer = await fs.readFile(file.path);
    const pdfDoc = await PDFDocument.load(fileBuffer);
    const totalPages = pdfDoc.getPageCount();
    const newPdf = await PDFDocument.create();
    
    const indices = reverse 
      ? Array.from({ length: totalPages }, (_, i) => totalPages - 1 - i)
      : JSON.parse(req.body.order || '[]');
    
    const copiedPages = await newPdf.copyPages(pdfDoc, indices);
    copiedPages.forEach(page => newPdf.addPage(page));
    
    const pdfBytes = await newPdf.save();
    await cleanupFile(file.path);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=reordered.pdf');
    res.send(Buffer.from(pdfBytes));
  } catch (error) {
    console.error('Reorder error:', error);
    await cleanupFile(file.path);
    res.status(500).json({ error: error.message });
  }
});

// 5. ROTATE PDF
app.post('/api/rotate-pdf', upload.single('file'), asyncHandler(async (req, res) => {
  const file = req.file;
  if (!file) {
    return res.status(400).json({ error: 'No file provided' });
  }

  const rotation = parseInt(req.body.rotation) || 90;
  
  try {
    const fileBuffer = await fs.readFile(file.path);
    const pdfDoc = await PDFDocument.load(fileBuffer);
    
    pdfDoc.getPages().forEach(page => {
      const currentRotation = page.getRotation().angle;
      page.setRotation(pdfDegrees(currentRotation + rotation));
    });
    
    const pdfBytes = await pdfDoc.save();
    await cleanupFile(file.path);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=rotated.pdf');
    res.send(Buffer.from(pdfBytes));
  } catch (error) {
    console.error('Rotate error:', error);
    await cleanupFile(file.path);
    res.status(500).json({ error: error.message });
  }
}));

// 6. COMPRESS PDF
app.post('/api/compress-pdf', upload.single('file'), async (req, res) => {
  const file = req.file;
  
  try {
    const fileBuffer = await fs.readFile(file.path);
    const pdfDoc = await PDFDocument.load(fileBuffer);
    const pdfBytes = await pdfDoc.save({ useObjectStreams: false });
    await cleanupFile(file.path);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=compressed.pdf');
    res.send(Buffer.from(pdfBytes));
  } catch (error) {
    console.error('Compress error:', error);
    await cleanupFile(file.path);
    res.status(500).json({ error: error.message });
  }
});

// 7. IMAGE TO PDF
app.post('/api/image-to-pdf', upload.array('files'), async (req, res) => {
  const files = req.files;
  
  try {
    const pdfDoc = await PDFDocument.create();
    
    for (const file of files) {
      const imageBuffer = await fs.readFile(file.path);
      let image;
      
      if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/jpg') {
        image = await pdfDoc.embedJpg(imageBuffer);
      } else if (file.mimetype === 'image/png') {
        image = await pdfDoc.embedPng(imageBuffer);
      } else {
        // Convert other formats to PNG using sharp
        const pngBuffer = await sharp(imageBuffer).png().toBuffer();
        image = await pdfDoc.embedPng(pngBuffer);
      }
      
      const page = pdfDoc.addPage([image.width, image.height]);
      page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
      
      await cleanupFile(file.path);
    }
    
    const pdfBytes = await pdfDoc.save();
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=images.pdf');
    res.send(Buffer.from(pdfBytes));
  } catch (error) {
    console.error('Image to PDF error:', error);
    files?.forEach(f => cleanupFile(f.path));
    res.status(500).json({ error: error.message });
  }
});

// 8. WORD TO PDF
app.post('/api/word-to-pdf', upload.single('file'), asyncHandler(async (req, res) => {
  const file = req.file;
  if (!file) {
    return res.status(400).json({ error: 'No file provided' });
  }

  try {
    console.log('Converting Word to PDF:', file.originalname);
    const fileBuffer = await fs.readFile(file.path);
    
    // Extract text and formatting using mammoth
    const result = await mammoth.convertToHtml({ buffer: fileBuffer });
    const html = result.value;
    
    // Extract plain text
    const textResult = await mammoth.extractRawText({ buffer: fileBuffer });
    const text = textResult.value || 'No content extracted';
    
    // Create PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4
    const { width, height } = page.getSize();
    const fontSize = 12;
    const margin = 50;
    const maxWidth = width - (margin * 2);
    
    // Simple text layout
    const lines = text.split('\n');
    let y = height - margin;
    
    for (const line of lines) {
      if (y < margin + fontSize) {
        const newPage = pdfDoc.addPage([595.28, 841.89]);
        y = newPage.getSize().height - margin;
      }
      
      // Wrap long lines
      const words = line.split(' ');
      let currentLine = '';
      
      for (const word of words) {
        const testLine = currentLine + (currentLine ? ' ' : '') + word;
        if (testLine.length * (fontSize * 0.5) > maxWidth) {
          if (currentLine) {
            page.drawText(currentLine, { x: margin, y, size: fontSize });
            y -= fontSize + 2;
            currentLine = word;
          } else {
            page.drawText(word.substring(0, 80), { x: margin, y, size: fontSize });
            y -= fontSize + 2;
          }
        } else {
          currentLine = testLine;
        }
      }
      
      if (currentLine) {
        page.drawText(currentLine, { x: margin, y, size: fontSize });
        y -= fontSize + 5;
      }
    }
    
    const pdfBytes = await pdfDoc.save();
    await cleanupFile(file.path);
    
    console.log('Word to PDF complete:', pdfBytes.byteLength, 'bytes');
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=converted.pdf');
    res.send(Buffer.from(pdfBytes));
  } catch (error) {
    console.error('Word to PDF error:', error);
    await cleanupFile(file.path);
    res.status(500).json({ error: error.message });
  }
}));

// 9. PDF TO WORD
app.post('/api/pdf-to-word', upload.single('file'), asyncHandler(async (req, res) => {
  const file = req.file;
  if (!file) {
    return res.status(400).json({ error: 'No file provided' });
  }

  try {
    console.log('Converting PDF to Word:', file.originalname);
    const fileBuffer = await fs.readFile(file.path);
    
    // Parse PDF and extract text
    const data = await pdfParse(fileBuffer);
    const text = data.text || 'No text could be extracted from PDF';
    
    // Create Word document with proper formatting
    const paragraphs = text.split('\n\n').map(para => 
      new Paragraph({
        children: para.split('\n').map((line, index) => 
          new TextRun({
            text: line,
            break: index > 0 ? 1 : 0
          })
        ),
        spacing: { after: 200 }
      })
    );
    
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            text: 'Extracted from PDF',
            heading: HeadingLevel.HEADING_1,
            spacing: { after: 300 }
          }),
          ...paragraphs
        ]
      }]
    });
    
    const docBytes = await Packer.toBuffer(doc);
    await cleanupFile(file.path);
    
    console.log('PDF to Word complete:', docBytes.byteLength, 'bytes');
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', 'attachment; filename=converted.docx');
    res.send(docBytes);
  } catch (error) {
    console.error('PDF to Word error:', error);
    await cleanupFile(file.path);
    res.status(500).json({ error: error.message });
  }
}));

// 10. EXCEL TO PDF
app.post('/api/excel-to-pdf', upload.single('file'), async (req, res) => {
  const file = req.file;
  
  try {
    const fileBuffer = await fs.readFile(file.path);
    const workbook = XLSX.read(fileBuffer);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    // Create PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([842, 595]); // A4 landscape
    const { width, height } = page.getSize();
    const fontSize = 10;
    
    let y = height - 50;
    data.slice(0, 40).forEach(row => {
      if (y < 50) return;
      const rowText = row.join('  |  ');
      page.drawText(rowText.substring(0, 120), {
        x: 20,
        y,
        size: fontSize
      });
      y -= fontSize + 5;
    });
    
    const pdfBytes = await pdfDoc.save();
    await cleanupFile(file.path);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=excel.pdf');
    res.send(Buffer.from(pdfBytes));
  } catch (error) {
    console.error('Excel to PDF error:', error);
    await cleanupFile(file.path);
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'PDF Nexus Server is running', timestamp: new Date().toISOString() });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'PDF Nexus API',
    version: '1.0.0',
    status: 'running',
    endpoints: [
      'POST /api/merge-pdf',
      'POST /api/split-pdf',
      'POST /api/remove-pages',
      'POST /api/reorder-pdf',
      'POST /api/rotate-pdf',
      'POST /api/compress-pdf',
      'POST /api/image-to-pdf',
      'POST /api/word-to-pdf',
      'POST /api/pdf-to-word',
      'POST /api/excel-to-pdf',
      'GET /api/health'
    ]
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: err.message || 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 PDF Nexus Server running on http://localhost:${PORT}`);
  console.log(`📝 API endpoints available at http://localhost:${PORT}/api/*`);
  console.log(`✅ CORS enabled for all origins`);
  console.log(`📦 Upload limit: 100MB`);
});
