# PDF Nexus Backend Server

## Installation

```bash
cd server
npm install
```

## Running the Server

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The server will run on `http://localhost:3001`

## API Endpoints

### 1. Merge PDFs
- **POST** `/api/merge-pdf`
- **Body**: FormData with multiple files
- **Returns**: Merged PDF file

### 2. Split PDF
- **POST** `/api/split-pdf`
- **Body**: FormData with file and page number
- **Returns**: Single page PDF

### 3. Remove Pages
- **POST** `/api/remove-pages`
- **Body**: FormData with file and pages array
- **Returns**: PDF with specified pages removed

### 4. Reorder Pages
- **POST** `/api/reorder-pdf`
- **Body**: FormData with file and reverse/order
- **Returns**: Reordered PDF

### 5. Rotate PDF
- **POST** `/api/rotate-pdf`
- **Body**: FormData with file and rotation degrees
- **Returns**: Rotated PDF

### 6. Compress PDF
- **POST** `/api/compress-pdf`
- **Body**: FormData with file
- **Returns**: Compressed PDF

### 7. Image to PDF
- **POST** `/api/image-to-pdf`
- **Body**: FormData with multiple image files
- **Returns**: PDF containing images

### 8. Word to PDF
- **POST** `/api/word-to-pdf`
- **Body**: FormData with .doc/.docx file
- **Returns**: Converted PDF

### 9. PDF to Word
- **POST** `/api/pdf-to-word`
- **Body**: FormData with PDF file
- **Returns**: .docx file

### 10. Excel to PDF
- **POST** `/api/excel-to-pdf`
- **Body**: FormData with .xls/.xlsx file
- **Returns**: Converted PDF

### Health Check
- **GET** `/api/health`
- **Returns**: Server status

## Features

- ✅ Real PDF manipulation using pdf-lib
- ✅ Word document conversion with mammoth
- ✅ Excel processing with xlsx
- ✅ Image conversion with sharp
- ✅ PDF text extraction with pdf-parse
- ✅ Automatic file cleanup
- ✅ 50MB file size limit
- ✅ CORS enabled for frontend integration
- ✅ Error handling and logging
