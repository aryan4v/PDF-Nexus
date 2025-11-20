# PDF Nexus - Production Deployment Guide

## 🚀 Quick Start (Development)

Both servers are currently running:
- **Backend**: http://localhost:3001
- **Frontend**: http://localhost:5174

## ✅ What's Working

All features are fully functional:

### PDF Operations
- ✅ **Merge PDF** - Combine multiple PDFs
- ✅ **Split PDF** - Extract pages
- ✅ **Remove Pages** - Delete specific pages
- ✅ **Reorder PDF** - Rearrange pages
- ✅ **Rotate PDF** - Rotate all pages
- ✅ **Compress PDF** - Reduce file size
- ✅ **Image to PDF** - Convert JPG/PNG to PDF

### Document Conversion
- ✅ **Word to PDF** - Real DOCX/DOC to PDF conversion
- ✅ **PDF to Word** - Extract text to DOCX
- ✅ **Excel to PDF** - Convert spreadsheets

### UI Features
- ✅ Drag-and-drop file upload
- ✅ AI Assistant (draggable, clickable)
- ✅ Search functionality
- ✅ Responsive sidebar
- ✅ Progress indicators
- ✅ Download processed files
- ✅ Error handling

## 📦 Building for Production

### Windows
```bash
.\build.bat
```

### Linux/Mac
```bash
chmod +x build.sh
./build.sh
```

This creates a `dist/` folder with:
- Frontend static files
- Backend server
- All dependencies

## 🌐 Deployment Options

### Option 1: Deploy to Vercel (Frontend) + Railway (Backend)

#### Frontend (Vercel)
1. Push code to GitHub
2. Import project to Vercel
3. Set build command: `npm run build`
4. Set output directory: `dist`
5. Add environment variable: `VITE_API_URL=https://your-backend.railway.app/api`

#### Backend (Railway)
1. Create new project on Railway
2. Connect GitHub repo
3. Set root directory: `server`
4. Add environment variables:
   - `PORT=3001`
   - `NODE_ENV=production`
5. Deploy

### Option 2: Deploy to Netlify (Frontend) + Render (Backend)

#### Frontend (Netlify)
1. Drag and drop `dist` folder to Netlify
2. Or connect GitHub and set:
   - Build command: `npm run build`
   - Publish directory: `dist`

#### Backend (Render)
1. Create new Web Service
2. Connect GitHub
3. Root directory: `server`
4. Build command: `npm install`
5. Start command: `node server.js`

### Option 3: Single Server (VPS/Dedicated)

```bash
# Install Node.js 18+ and nginx

# Build the project
npm run build

# Install backend dependencies
cd dist/server
npm install --production

# Set up nginx reverse proxy
sudo nano /etc/nginx/sites-available/pdf-nexus

# Add configuration:
server {
    listen 80;
    server_name yourdomain.com;
    
    # Frontend
    location / {
        root /path/to/dist;
        try_files $uri $uri/ /index.html;
    }
    
    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Enable and restart
sudo ln -s /etc/nginx/sites-available/pdf-nexus /etc/nginx/sites-enabled/
sudo systemctl restart nginx

# Start backend with PM2
npm install -g pm2
pm2 start server.js --name pdf-nexus-api
pm2 save
pm2 startup
```

## 🔧 Configuration

### Frontend Environment Variables

Create `.env` in root:
```
VITE_API_URL=http://localhost:3001/api
```

For production, update to your backend URL.

### Backend Environment Variables

In `server/.env`:
```
PORT=3001
NODE_ENV=production
MAX_FILE_SIZE=104857600
```

## 🧪 Testing

1. Upload a PDF file
2. Try merging multiple PDFs
3. Convert Word to PDF
4. Convert PDF to Word
5. Test drag-and-drop on AI assistant
6. Check browser console for errors
7. Verify downloads work

## 📊 Performance

- File size limit: 100MB
- Concurrent requests: Unlimited
- Processing: Server-side
- Fallback: Client-side if server unavailable

## 🐛 Troubleshooting

### Backend not connecting
1. Check if backend is running: http://localhost:3001/api/health
2. Verify CORS settings in server.js
3. Check browser console for errors
4. Ensure API_URL in main.tsx matches backend

### Files not downloading
1. Check browser console
2. Verify Content-Disposition headers
3. Test with smaller files first
4. Check server logs

### Conversion failures
1. Check file format (must be valid PDF/DOCX/XLSX)
2. Verify file size under 100MB
3. Check server logs for specific errors
4. Test with sample files

## 📝 API Documentation

All endpoints accept multipart/form-data:

- `POST /api/merge-pdf` - files[]
- `POST /api/split-pdf` - file, page
- `POST /api/remove-pages` - file, pages[]
- `POST /api/reorder-pdf` - file, reverse/order
- `POST /api/rotate-pdf` - file, rotation
- `POST /api/compress-pdf` - file
- `POST /api/image-to-pdf` - files[]
- `POST /api/word-to-pdf` - file
- `POST /api/pdf-to-word` - file
- `POST /api/excel-to-pdf` - file
- `GET /api/health` - Server status

## 🎯 Current Status

✅ **READY FOR PRODUCTION**

All features tested and working. Both frontend and backend are fully functional.

- Backend running on: http://localhost:3001
- Frontend running on: http://localhost:5174

Open the frontend URL in your browser to use the application!
