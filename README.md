# 📄 PDF Nexus

<div align="center">
  <img src="assets/Beige___Black_Aesthetic_Flower_Boutique_Logo-removebg-preview.png" alt="PDF Nexus Logo" width="150" height="150">
  
  ### Your Ultimate PDF Toolkit
  
  [![Live Demo](https://img.shields.io/badge/demo-live-success)](https://ritvik78.github.io/PDF-Nexus/)
  [![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
  [![React](https://img.shields.io/badge/React-18.2.0-61dafb.svg)](https://reactjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.3.0-3178c6.svg)](https://www.typescriptlang.org/)
  [![Express](https://img.shields.io/badge/Express-4.18.2-000000.svg)](https://expressjs.com/)
  
  **🌐 [Live Demo](https://ritvik78.github.io/PDF-Nexus/) | [GitHub Repository](https://github.com/ritvik78/PDF-Nexus)**
</div>

---

## 🌟 Features

PDF Nexus is a comprehensive PDF manipulation tool with a beautiful UI and powerful backend processing. All operations work **100% reliably** with automatic fallback to client-side processing.

### 📋 PDF Operations
- **Merge PDF** - Combine multiple PDF files into one
- **Split PDF** - Extract specific pages from PDFs
- **Remove Pages** - Delete unwanted pages from PDFs
- **Reorder PDF** - Rearrange or reverse page order
- **Rotate PDF** - Rotate all pages by 90°, 180°, or 270°
- **Compress PDF** - Reduce file size

### 🔄 Document Conversion
- **Word to PDF** - Convert DOCX/DOC files to PDF
- **PDF to Word** - Extract text from PDF to DOCX
- **Excel to PDF** - Convert spreadsheets to PDF
- **Image to PDF** - Convert JPG/PNG images to PDF

### 🎨 UI Features
- **Drag & Drop** - Easy file upload
- **AI Assistant** - Interactive help with draggable robot interface
- **Search** - Quick tool finder with suggestions
- **Responsive Design** - Works on desktop and mobile
- **Real-time Progress** - Track conversion progress
- **Download** - Instant file downloads

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/ritvik78/PDF-Nexus.git
cd PDF-Nexus
```

2. **Install dependencies**
```bash
# Frontend dependencies
npm install

# Backend dependencies
cd server
npm install
cd ..
```

3. **Start the application**

**Option 1: Using the start script (Windows)**
```bash
.\start.bat
```

**Option 2: Manual start**
```bash
# Terminal 1 - Start backend
cd server
npm start

# Terminal 2 - Start frontend
npm run dev
```

4. **Open in browser**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

---

## 🏗️ Project Structure

```
PDF-Nexus/
├── assets/                          # Logo and images
├── server/                          # Express.js backend
│   ├── server.js                   # Main server file
│   ├── package.json                # Backend dependencies
│   └── .env                        # Environment variables
├── main.tsx                        # Main React component
├── index.tsx                       # React entry point
├── index.css                       # Global styles
├── package.json                    # Frontend dependencies
├── vite.config.ts                  # Vite configuration
├── tailwind.config.js              # Tailwind CSS config
├── tsconfig.json                   # TypeScript config
├── build.bat / build.sh            # Production build scripts
├── start.bat                       # Development start script
├── SETUP.md                        # Detailed setup guide
└── DEPLOYMENT.md                   # Deployment instructions
```

---

## 🛠️ Tech Stack

### Frontend
- **React 18.2.0** - UI framework
- **TypeScript 5.3.0** - Type safety
- **Vite 5.0.0** - Build tool & dev server
- **Tailwind CSS 3.3.0** - Styling
- **Lucide React** - Icons
- **pdf-lib** - PDF manipulation
- **mammoth** - Word document processing
- **docx** - Word document creation
- **xlsx** - Excel processing
- **pptxgenjs** - PowerPoint generation

### Backend
- **Express 4.18.2** - Web framework
- **Multer** - File upload handling
- **pdf-lib** - Server-side PDF processing
- **mammoth** - Word to PDF conversion
- **pdf-parse** - PDF text extraction
- **sharp** - Image processing
- **CORS** - Cross-origin resource sharing

---

## 📚 API Documentation

All endpoints accept `multipart/form-data` and return processed files.

### Endpoints

| Endpoint | Method | Description | Parameters |
|----------|--------|-------------|------------|
| `/api/merge-pdf` | POST | Merge multiple PDFs | `files[]` |
| `/api/split-pdf` | POST | Extract pages | `file`, `page` |
| `/api/remove-pages` | POST | Remove pages | `file`, `pages[]` |
| `/api/reorder-pdf` | POST | Reorder pages | `file`, `reverse/order` |
| `/api/rotate-pdf` | POST | Rotate pages | `file`, `rotation` |
| `/api/compress-pdf` | POST | Compress PDF | `file` |
| `/api/image-to-pdf` | POST | Convert images | `files[]` |
| `/api/word-to-pdf` | POST | Convert Word | `file` |
| `/api/pdf-to-word` | POST | Convert to Word | `file` |
| `/api/excel-to-pdf` | POST | Convert Excel | `file` |
| `/api/health` | GET | Server status | - |

### Example Usage

```javascript
const formData = new FormData();
formData.append('file', pdfFile);

const response = await fetch('http://localhost:3001/api/compress-pdf', {
  method: 'POST',
  body: formData
});

const blob = await response.blob();
// Download the processed file
```

---

## 🌐 Deployment

### Build for Production

**Windows:**
```bash
.\build.bat
```

**Linux/Mac:**
```bash
chmod +x build.sh
./build.sh
```

### Deploy to Cloud

**Recommended Options:**
1. **Frontend**: Vercel, Netlify, or GitHub Pages
2. **Backend**: Railway, Render, or Heroku

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.

---

## 🔧 Configuration

### Frontend Environment Variables

Create `.env` in root:
```env
VITE_API_URL=http://localhost:3001/api
```

### Backend Environment Variables

Create `server/.env`:
```env
PORT=3001
NODE_ENV=development
MAX_FILE_SIZE=104857600
```

---

## 🎯 Key Features Explained

### Automatic Fallback
If the backend server is unavailable, PDF Nexus automatically switches to client-side processing, ensuring uninterrupted functionality.

### Smart Processing
- **Server-side** for reliable, heavy conversions
- **Client-side** as fallback or for quick operations
- **Progress tracking** for better user experience

### Security
- No data stored on servers
- Files automatically deleted after processing
- All processing happens in-memory
- CORS enabled with proper configuration

---

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check if port 3001 is in use
netstat -ano | findstr :3001

# Kill the process if needed
taskkill /F /PID <process_id>
```

### Files not downloading
- Check browser console for errors
- Verify backend is running at http://localhost:3001/api/health
- Ensure CORS is properly configured

### Build errors
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👤 Author

**Ritvik**
- GitHub: [@ritvik78](https://github.com/ritvik78)

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## ⭐ Show your support

Give a ⭐️ if this project helped you!

---

## 📸 Screenshots

### Dashboard
![Dashboard](https://via.placeholder.com/800x400?text=Add+Dashboard+Screenshot)

### PDF Tools
![PDF Tools](https://via.placeholder.com/800x400?text=Add+PDF+Tools+Screenshot)

### AI Assistant
![AI Assistant](https://via.placeholder.com/800x400?text=Add+AI+Assistant+Screenshot)

---

<div align="center">
  Made with ❤️ by Ritvik
  
  [⬆ Back to Top](#-pdf-nexus)
</div>
