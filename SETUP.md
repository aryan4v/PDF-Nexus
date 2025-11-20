# PDF Nexus - Full Stack Setup

## Architecture

- **Frontend**: React + Vite (Port 5173)
- **Backend**: Node.js + Express (Port 3001)

## Quick Start

### 1. Install Dependencies

```bash
# Install frontend dependencies (root folder)
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

### 2. Start Both Servers

**Terminal 1 - Backend Server:**
```bash
cd server
npm start
```
Server will run on `http://localhost:3001`

**Terminal 2 - Frontend:**
```bash
npm run dev
```
App will run on `http://localhost:5173`

## How It Works

The frontend automatically uses the backend API for:
- ✅ Merge PDF
- ✅ Split PDF
- ✅ Remove Pages
- ✅ Reorder PDF
- ✅ Rotate PDF
- ✅ Compress PDF
- ✅ Image to PDF
- ✅ Word to PDF
- ✅ PDF to Word
- ✅ Excel to PDF

If the backend is unavailable, it automatically falls back to client-side processing.

## Backend Features

- Real file processing with proper libraries
- Automatic file cleanup after processing
- 50MB file size limit
- CORS enabled
- Error handling and logging
- Text extraction from PDFs
- Document format conversions

## Testing

1. Open `http://localhost:5173` in your browser
2. Select any tool
3. Upload a file
4. Click "CONVERT NOW"
5. Check browser console (F12) to see if using backend or frontend
6. Download the processed file

## Production Deployment

For production, you'll need to:
1. Update `API_URL` in `main.tsx` to your backend URL
2. Deploy backend to a Node.js hosting service (Heroku, Railway, etc.)
3. Deploy frontend to static hosting (Vercel, Netlify, etc.)
4. Configure environment variables
5. Add proper authentication if needed
