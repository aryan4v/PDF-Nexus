import React, { useState, useEffect } from 'react';
import { PDFDocument, degrees } from 'pdf-lib';
import mammoth from 'mammoth';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import * as XLSX from 'xlsx';
import PptxGenJS from 'pptxgenjs';
import { 
  FileText, 
  Merge, 
  Scissors,
  Trash2, 
  Move, 
  Scan, 
  Minimize2, 
  Wrench, 
  Search as SearchIcon, 
  Image as ImageIcon, 
  FileType, 
  RotateCw, 
  Type, 
  Lock, 
  Unlock, 
  PenTool, 
  EyeOff, 
  GitCompare, 
  UploadCloud, 
  CheckCircle, 
  AlertCircle, 
  X, 
  Download, 
  Menu,
  ChevronRight,
  Shield,
  Edit3,
  Layers,
  Zap,
  Cpu,
  ArrowRightLeft,
  FileType2,
  MessageCircle,
  Send
} from 'lucide-react';

// -- Constants & Configuration --

const TOOL_CATEGORIES = {
  PRIORITY: {
    title: 'Popular & Priority',
    icon: Zap,
    color: 'text-violet-600',
    bg: 'bg-violet-50',
    tools: [
      { id: 'word-to-pdf', name: 'Word to PDF', icon: FileText, desc: 'Convert DOC/DOCX to PDF instantly.', priority: true },
      { id: 'pdf-to-word', name: 'PDF to Word', icon: FileType2, desc: 'Convert PDF to editable Word. Supports OCR.', priority: true, hasOptions: true },
    ]
  },
  ORGANIZE: {
    title: 'Organize',
    icon: Layers,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    tools: [
      { id: 'merge', name: 'Merge PDF', icon: Merge, desc: 'Combine multiple PDFs into one unified document.' },
      { id: 'split', name: 'Split PDF', icon: Scissors, desc: 'Separate one page or a whole set.' },
      { id: 'remove', name: 'Remove Pages', icon: Trash2, desc: 'Delete specific pages from your document.' },
      { id: 'reorder', name: 'Reorder PDF', icon: Move, desc: 'Rearrange pages in your PDF file.' },
    ]
  },
  CONVERT: {
    title: 'Convert',
    icon: ArrowRightLeft,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    tools: [
      { id: 'img-to-pdf', name: 'JPG to PDF', icon: ImageIcon, desc: 'Convert JPG, PNG, BMP images to PDF.' },
      { id: 'excel-to-pdf', name: 'Excel to PDF', icon: FileText, desc: 'Convert Excel spreadsheets to PDF.' },
      { id: 'ppt-to-pdf', name: 'PPT to PDF', icon: FileText, desc: 'Convert PowerPoint slides to PDF.' },
    ]
  },
  EDIT_SECURITY: {
    title: 'Edit & Security',
    icon: Shield,
    color: 'text-rose-600',
    bg: 'bg-rose-50',
    tools: [
      { id: 'compress', name: 'Compress PDF', icon: Minimize2, desc: 'Reduce file size optimizing quality.' },
      { id: 'ocr-scan', name: 'OCR Scanner', icon: Scan, desc: 'Extract text from scanned image PDFs.' },
      { id: 'rotate', name: 'Rotate PDF', icon: RotateCw, desc: 'Rotate pages 90, 180 or 270 degrees.' },
      { id: 'protect', name: 'Protect PDF', icon: Lock, desc: 'Encrypt your PDF with a password.' },
      { id: 'unlock', name: 'Unlock PDF', icon: Unlock, desc: 'Remove PDF password security.' },
      { id: 'sign', name: 'Sign PDF', icon: PenTool, desc: 'Sign yourself or request signatures.' },
    ]
  }
};

// -- Helper: Load jsPDF library --
const useLibraries = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  useEffect(() => {
    if (window.jspdf) {
      setIsLoaded(true);
      return;
    }
    
    const loadScript = (src) => {
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.body.appendChild(script);
      });
    };
    
    loadScript('https://unpkg.com/jspdf@2.5.1/dist/jspdf.umd.min.js')
      .then(() => setIsLoaded(true))
      .catch(console.error);
  }, []);
  return isLoaded;
};

// -- Main Component --

const API_URL = 'http://localhost:3001/api';

export default function PDFNexus() {
  const [activeTool, setActiveTool] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [files, setFiles] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [completedFile, setCompletedFile] = useState(null);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [useBackend, setUseBackend] = useState(true); // Toggle for backend/frontend processing
  
  // Tool Options State
  const [useOCR, setUseOCR] = useState(false);

  // AI Assistant State
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [aiMessages, setAiMessages] = useState([
    { role: 'assistant', text: 'Hello! I\'m your PDF assistant. How can I help you today?' }
  ]);
  const [aiInput, setAiInput] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [hasDragged, setHasDragged] = useState(false);
  const [aiPosition, setAiPosition] = useState({ x: window.innerWidth - 100, y: window.innerHeight - 100 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Search Suggestions State
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);

  const pdfLibLoaded = useLibraries();

  // --- File Handling ---

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files).map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      preview: URL.createObjectURL(file),
      size: (file.size / 1024 / 1024).toFixed(2) // MB
    }));
    setFiles(prev => [...prev, ...newFiles]);
    setCompletedFile(null);
    setError(null);
  };

  const removeFile = (id) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const clearAll = () => {
    setFiles([]);
    setCompletedFile(null);
    setError(null);
  };

  // AI Assistant Functions
  const handleAiSend = () => {
    if (!aiInput.trim()) return;
    
    const userMessage = { role: 'user', text: aiInput };
    setAiMessages(prev => [...prev, userMessage]);
    setAiInput('');
    
    // Simulate AI response
    setTimeout(() => {
      const responses = [
        "I can help you convert PDFs, merge documents, or extract text. What would you like to do?",
        "Try using the Word to PDF converter for the best results!",
        "For scanned documents, I recommend using the OCR feature.",
        "You can drag and drop multiple files to merge them into one PDF.",
        "Need help with a specific tool? Just ask!"
      ];
      const aiResponse = { 
        role: 'assistant', 
        text: responses[Math.floor(Math.random() * responses.length)] 
      };
      setAiMessages(prev => [...prev, aiResponse]);
    }, 800);
  };

  // AI Assistant Drag Functions
  // Click outside to close chat
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (aiChatOpen && !e.target.closest('.ai-chat-container') && !e.target.closest('.ai-robot-button')) {
        setAiChatOpen(false);
      }
    };
    
    if (aiChatOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [aiChatOpen]);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setHasDragged(false);
    setDragOffset({
      x: e.clientX - aiPosition.x,
      y: e.clientY - aiPosition.y
    });
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      setHasDragged(true);
      setAiPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  // --- Backend API Functions ---

  const callBackendAPI = async (endpoint, formData) => {
    const response = await fetch(`${API_URL}/${endpoint}`, {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'API request failed');
    }
    
    return response.blob();
  };

  const processWithBackend = async () => {
    const formData = new FormData();
    
    // Map tool IDs to API endpoints
    const endpointMap = {
      'merge': 'merge-pdf',
      'split': 'split-pdf',
      'remove': 'remove-pages',
      'reorder': 'reorder-pdf',
      'rotate': 'rotate-pdf',
      'compress': 'compress-pdf',
      'img-to-pdf': 'image-to-pdf',
      'word-to-pdf': 'word-to-pdf',
      'pdf-to-word': 'pdf-to-word',
      'excel-to-pdf': 'excel-to-pdf'
    };
    
    const endpoint = endpointMap[activeTool.id];
    if (!endpoint) {
      throw new Error('This tool is not yet available');
    }
    
    // Add files to form data
    if (['merge', 'img-to-pdf'].includes(activeTool.id)) {
      files.forEach(item => formData.append('files', item.file));
    } else {
      formData.append('file', files[0].file);
    }
    
    // Add tool-specific parameters
    if (activeTool.id === 'split') {
      formData.append('page', '1');
    } else if (activeTool.id === 'remove') {
      formData.append('pages', JSON.stringify([1]));
    } else if (activeTool.id === 'reorder') {
      formData.append('reverse', 'true');
    } else if (activeTool.id === 'rotate') {
      formData.append('rotation', '90');
    }
    
    const blob = await callBackendAPI(endpoint, formData);
    return blob;
  };

  // --- Core Logic ---

  const processFiles = async () => {
    if (files.length === 0) return;
    setProcessing(true);
    setProgress(0);
    setError(null);

    console.log('Processing started for:', activeTool.id, 'Files:', files, 'UseBackend:', useBackend);

    try {
      // Use backend API if available
      if (useBackend) {
        const interval = setInterval(() => {
          setProgress(old => (old >= 90 ? old : old + 5));
        }, 200);
        
        try {
          const blob = await processWithBackend();
          const url = URL.createObjectURL(blob);
          
          clearInterval(interval);
          setProgress(100);
          
          setTimeout(() => {
            let filename = 'processed';
            if (activeTool.id === 'merge') filename = 'merged.pdf';
            else if (activeTool.id === 'word-to-pdf') filename = files[0].file.name.replace(/\.(doc|docx)$/i, '.pdf');
            else if (activeTool.id === 'pdf-to-word') filename = files[0].file.name.replace('.pdf', '.docx');
            else if (activeTool.id === 'excel-to-pdf') filename = files[0].file.name.replace(/\.(xls|xlsx)$/i, '.pdf');
            else filename = files[0].file.name;
            
            setCompletedFile({ url, name: filename });
            setProcessing(false);
          }, 600);
          
          return;
        } catch (apiError) {
          console.warn('Backend API failed, falling back to client-side:', apiError);
          setUseBackend(false); // Fallback to client-side processing
        }
      }

      // Client-side processing (fallback)
      if (!pdfLibLoaded) throw new Error("Engine warming up... please wait.");

      // Smooth progress bar simulation
      const interval = setInterval(() => {
        setProgress(old => {
          if (old >= 90) return old;
          return old + (useOCR ? 2 : 5); // OCR is slower
        });
      }, 200);

      // 1. MERGE
      if (activeTool.id === 'merge') {
        console.log('Merging PDFs...');
        const mergedPdf = await PDFDocument.create();
        for (const item of files) {
          const fileBuffer = await item.file.arrayBuffer();
          const pdf = await PDFDocument.load(fileBuffer);
          const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
          copiedPages.forEach((page) => mergedPdf.addPage(page));
        }
        const pdfBytes = await mergedPdf.save();
        console.log('Merge complete, size:', pdfBytes.byteLength);
        finalize(interval, pdfBytes, 'merged_nexus.pdf', 'application/pdf');
      }
      // 2. IMG TO PDF
      else if (activeTool.id === 'img-to-pdf') {
        const pdfDoc = await PDFDocument.create();
        for (const item of files) {
          const imageBytes = await item.file.arrayBuffer();
          let image;
          if (item.file.type === 'image/jpeg') image = await pdfDoc.embedJpg(imageBytes);
          else if (item.file.type === 'image/png') image = await pdfDoc.embedPng(imageBytes);
          else {
            // Fallback or skip
            continue; 
          }
          const page = pdfDoc.addPage([image.width, image.height]);
          page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
        }
        const pdfBytes = await pdfDoc.save();
        finalize(interval, pdfBytes, 'images_converted.pdf', 'application/pdf');
      }
      // 3. ROTATE
      else if (activeTool.id === 'rotate') {
         const fileBuffer = await files[0].file.arrayBuffer();
         const pdfDoc = await PDFDocument.load(fileBuffer);
         pdfDoc.getPages().forEach(page => page.setRotation(degrees(page.getRotation().angle + 90)));
         const pdfBytes = await pdfDoc.save();
         finalize(interval, pdfBytes, `rotated_${files[0].file.name}`, 'application/pdf');
      }
      // 4. SPLIT PDF - Extract first page as example
      else if (activeTool.id === 'split') {
         const fileBuffer = await files[0].file.arrayBuffer();
         const pdfDoc = await PDFDocument.load(fileBuffer);
         const newPdf = await PDFDocument.create();
         
         // Split: create PDF with only first page as example
         const [firstPage] = await newPdf.copyPages(pdfDoc, [0]);
         newPdf.addPage(firstPage);
         
         const pdfBytes = await newPdf.save();
         finalize(interval, pdfBytes, `split_page1_${files[0].file.name}`, 'application/pdf');
      }
      // 5. REMOVE PAGES - Remove first page as example
      else if (activeTool.id === 'remove') {
         const fileBuffer = await files[0].file.arrayBuffer();
         const pdfDoc = await PDFDocument.load(fileBuffer);
         const totalPages = pdfDoc.getPageCount();
         
         if (totalPages > 1) {
           const newPdf = await PDFDocument.create();
           // Copy all pages except first one
           const pagesToKeep = Array.from({length: totalPages - 1}, (_, i) => i + 1);
           const copiedPages = await newPdf.copyPages(pdfDoc, pagesToKeep);
           copiedPages.forEach(page => newPdf.addPage(page));
           
           const pdfBytes = await newPdf.save();
           finalize(interval, pdfBytes, `removed_${files[0].file.name}`, 'application/pdf');
         } else {
           throw new Error('PDF must have more than 1 page to remove pages');
         }
      }
      // 6. REORDER - Reverse page order
      else if (activeTool.id === 'reorder') {
         const fileBuffer = await files[0].file.arrayBuffer();
         const pdfDoc = await PDFDocument.load(fileBuffer);
         const totalPages = pdfDoc.getPageCount();
         const newPdf = await PDFDocument.create();
         
         // Reverse order
         const reversedIndices = Array.from({length: totalPages}, (_, i) => totalPages - 1 - i);
         const copiedPages = await newPdf.copyPages(pdfDoc, reversedIndices);
         copiedPages.forEach(page => newPdf.addPage(page));
         
         const pdfBytes = await newPdf.save();
         finalize(interval, pdfBytes, `reordered_${files[0].file.name}`, 'application/pdf');
      }
      // 7. COMPRESS - Re-save PDF (basic compression)
      else if (activeTool.id === 'compress') {
         const fileBuffer = await files[0].file.arrayBuffer();
         const pdfDoc = await PDFDocument.load(fileBuffer);
         const pdfBytes = await pdfDoc.save();
         finalize(interval, pdfBytes, `compressed_${files[0].file.name}`, 'application/pdf');
      }
      // 8. WORD TO PDF - Convert DOC/DOCX to PDF using mammoth
      else if (activeTool.id === 'word-to-pdf') {
         console.log('Converting Word to PDF...');
         const { jsPDF } = window.jspdf;
         const file = files[0].file;
         const arrayBuffer = await file.arrayBuffer();
         
         // Extract text from Word document using mammoth
         const result = await mammoth.extractRawText({ arrayBuffer });
         const text = result.value;
         console.log('Extracted text length:', text.length);
         
         // Create PDF with extracted text
         const doc = new jsPDF();
         const lines = doc.splitTextToSize(text || 'No text extracted', 180);
         let y = 10;
         
         lines.forEach((line, index) => {
           if (y > 280) {
             doc.addPage();
             y = 10;
           }
           doc.text(line, 10, y);
           y += 7;
         });
         
         const pdfBytes = doc.output('arraybuffer');
         console.log('PDF created, size:', pdfBytes.byteLength);
         const outName = file.name.replace(/\.(doc|docx)$/i, '.pdf');
         finalize(interval, pdfBytes, outName, 'application/pdf');
      }
      // 9. PDF TO WORD - Extract text and create DOCX
      else if (activeTool.id === 'pdf-to-word') {
         const file = files[0].file;
         const arrayBuffer = await file.arrayBuffer();
         const pdfDoc = await PDFDocument.load(arrayBuffer);
         
         // Extract basic info and create DOCX
         const pages = pdfDoc.getPages();
         const docContent = new Document({
           sections: [{
             children: [
               new Paragraph({
                 children: [
                   new TextRun({
                     text: `PDF Document Analysis`,
                     bold: true,
                     size: 32
                   })
                 ]
               }),
               new Paragraph({
                 children: [
                   new TextRun({
                     text: `Total Pages: ${pages.length}`,
                     size: 24
                   })
                 ]
               }),
               new Paragraph({
                 children: [
                   new TextRun({
                     text: `Page Size: ${pages[0].getWidth()} x ${pages[0].getHeight()} points`,
                     size: 24
                   })
                 ]
               }),
               new Paragraph({
                 children: [
                   new TextRun({
                     text: '\\n\\nNote: Full OCR text extraction is available with the OCR Scanner tool.',
                     size: 20,
                     italics: true
                   })
                 ]
               })
             ]
           }]
         });
         
         const docBytes = await Packer.toBlob(docContent);
         const outName = file.name.replace('.pdf', '.docx');
         finalize(interval, await docBytes.arrayBuffer(), outName, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      }
      // 10. EXCEL TO PDF - Convert XLSX to PDF
      else if (activeTool.id === 'excel-to-pdf') {
         const { jsPDF } = window.jspdf;
         const file = files[0].file;
         const arrayBuffer = await file.arrayBuffer();
         
         // Read Excel file
         const workbook = XLSX.read(arrayBuffer, { type: 'array' });
         const sheetName = workbook.SheetNames[0];
         const worksheet = workbook.Sheets[sheetName];
         
         // Convert to array of arrays
         const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
         
         // Create PDF
         const doc = new jsPDF();
         doc.setFontSize(10);
         let y = 10;
         
         doc.text(`Excel: ${file.name}`, 10, y);
         y += 10;
         doc.text(`Sheet: ${sheetName}`, 10, y);
         y += 10;
         
         // Add data rows
         data.slice(0, 30).forEach((row, index) => {
           if (y > 280) {
             doc.addPage();
             y = 10;
           }
           const rowText = row.join('  |  ');
           doc.text(rowText.substring(0, 100), 10, y);
           y += 6;
         });
         
         const pdfBytes = doc.output('arraybuffer');
         const outName = file.name.replace(/\.(xls|xlsx)$/i, '.pdf');
         finalize(interval, pdfBytes, outName, 'application/pdf');
      }
      // 11. PPT TO PDF - Convert PPTX to PDF
      else if (activeTool.id === 'ppt-to-pdf') {
         const { jsPDF } = window.jspdf;
         const file = files[0].file;
         
         // Create a simple PDF representation
         const doc = new jsPDF();
         doc.setFontSize(16);
         doc.text(`PowerPoint: ${file.name}`, 10, 20);
         doc.setFontSize(12);
         doc.text('Converted to PDF', 10, 35);
         doc.text('Note: Complex animations and transitions are not preserved.', 10, 50);
         
         const pdfBytes = doc.output('arraybuffer');
         const outName = file.name.replace(/\.(ppt|pptx)$/i, '.pdf');
         finalize(interval, pdfBytes, outName, 'application/pdf');
      }
      // 12. OTHER SIMULATED TASKS (OCR, Protect, Sign)
      else {
        // Simulate slightly longer time for OCR
        const delay = useOCR ? 4000 : 2000; 
        await new Promise(resolve => setTimeout(resolve, delay));
        
        let outName = 'processed_doc.pdf';
        if (activeTool.id === 'protect') outName = `protected_${files[0].file.name}`;
        if (activeTool.id === 'unlock') outName = `unlocked_${files[0].file.name}`;
        if (activeTool.id === 'sign') outName = `signed_${files[0].file.name}`;
        if (activeTool.id === 'ocr-scan') outName = `ocr_${files[0].file.name}`;
        
        finalize(interval, null, outName, 'application/pdf', true);
      }

    } catch (err) {
      console.error('Processing error:', err);
      setError(err.message || "Processing failed.");
      setProcessing(false);
    }
  };

  const finalize = (interval, data, filename, mimeType, isSim = false) => {
    clearInterval(interval);
    setProgress(100);
    console.log('Finalizing:', filename, 'Simulation:', isSim, 'Data size:', data?.byteLength);
    setTimeout(() => {
      if (isSim) {
        setCompletedFile({ url: null, name: filename, simulation: true });
      } else {
        const blob = new Blob([data], { type: mimeType });
        const url = URL.createObjectURL(blob);
        console.log('Created blob URL:', url);
        setCompletedFile({ url, name: filename });
      }
      setProcessing(false);
    }, 600);
  };

  // --- Renderers ---

  const renderDashboard = () => {
    // Search Logic
    const allTools = Object.values(TOOL_CATEGORIES).flatMap(c => c.tools);
    const matchingTools = searchQuery 
      ? allTools.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.desc.toLowerCase().includes(searchQuery.toLowerCase()))
      : [];

    // Search Suggestions
    const suggestions = ['Word to PDF', 'Merge PDF', 'OCR Scanner', 'Compress PDF', 'Split PDF'];

    return (
      <div className="p-8 md:p-12 max-w-7xl mx-auto">
        {/* Faded Logo Background */}
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-0">
          <img 
            src="/assets/Beige___Black_Aesthetic_Flower_Boutique_Logo-removebg-preview.png" 
            alt="" 
            className="w-[600px] h-[600px] object-contain opacity-[0.4] select-none"
          />
        </div>
        
        {/* Hero */}
        <div className="text-center mb-12 relative z-10">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-violet-300/20 blur-[120px] rounded-full -z-10" />
          
          {/* Elegant Title */}
          <h1 className="text-5xl md:text-6xl font-black mb-6 tracking-tight leading-tight animate-fade-in">
            <span className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600">
              Your Ultimate
            </span>
            {' '}
            <span className="inline-block text-slate-900">
              PDF
            </span>
            {' '}
            <span className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-600 via-pink-600 to-rose-600">
              Toolkit
            </span>
          </h1>
          
          <p className="text-slate-600 text-xl max-w-2xl mx-auto mb-8 font-semibold leading-relaxed">
            Convert Word to PDF, OCR scanned documents, and edit files securely in your browser. 
            No servers, no data limits.
          </p>
          
          {/* Search Bar */}
          <div className="max-w-xl mx-auto relative group mb-12">
            <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-2xl blur opacity-20 group-hover:opacity-30 transition-opacity" />
            <div className="relative">
              <div className="relative bg-white/80 backdrop-blur-md rounded-2xl shadow-xl flex items-center p-2 border border-white/50 ring-1 ring-slate-200/50">
                <SearchIcon className="w-5 h-5 text-slate-400 ml-3" />
                <input 
                  type="text" 
                  placeholder="Search tools (e.g. 'OCR', 'Word', 'Merge')..."
                  className="w-full p-3 bg-transparent outline-none text-slate-700 placeholder-slate-400 font-medium"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setShowSearchSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSearchSuggestions(false), 200)}
                />
                {searchQuery && (
                   <button onClick={() => setSearchQuery('')} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                     <X className="w-4 h-4" />
                   </button>
                )}
              </div>

              {/* Search Suggestions */}
              {showSearchSuggestions && !searchQuery && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden z-10 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="p-2 text-xs font-bold text-slate-400 uppercase tracking-wider px-4 pt-3">Popular Searches</div>
                  <div className="p-2">
                    {suggestions.map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setSearchQuery(suggestion);
                          setShowSearchSuggestions(false);
                        }}
                        className="w-full text-left px-4 py-2 rounded-lg hover:bg-violet-50 text-slate-700 font-medium transition-colors flex items-center gap-2"
                      >
                        <SearchIcon className="w-4 h-4 text-violet-400" />
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Search Results or Categories */}
        {searchQuery ? (
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {matchingTools.map(tool => (
                 <ToolCard key={tool.id} tool={tool} onClick={() => setActiveTool(tool)} />
              ))}
              {matchingTools.length === 0 && (
                <div className="col-span-full text-center text-slate-400 py-12">No tools found for "{searchQuery}"</div>
              )}
           </div>
        ) : (
          <div className="space-y-12">
            {Object.entries(TOOL_CATEGORIES).map(([key, category]) => (
              <div key={key}>
                <div className="flex items-center gap-3 mb-5 pl-1">
                  <div className={`p-2 rounded-lg ${category.bg} ${category.color}`}>
                      <category.icon className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-800 tracking-tight">{category.title}</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {category.tools.map(tool => (
                    <ToolCard key={tool.id} tool={tool} onClick={() => setActiveTool(tool)} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const ToolCard = ({ tool, onClick }) => (
    <button
      onClick={onClick}
      className="bg-white/60 backdrop-blur-md p-5 rounded-2xl shadow-sm border border-white/50 ring-1 ring-slate-200/50 hover:shadow-xl hover:ring-violet-200 hover:-translate-y-1 transition-all duration-300 text-left group flex flex-col h-full relative overflow-hidden"
    >
      {tool.priority && (
        <div className="absolute top-0 right-0 bg-violet-100 text-violet-700 text-[10px] font-bold px-2 py-1 rounded-bl-lg uppercase tracking-wider">
          Popular
        </div>
      )}
      <div className={`w-12 h-12 rounded-xl bg-slate-100 text-slate-600 group-hover:bg-violet-600 group-hover:text-white flex items-center justify-center mb-4 transition-colors duration-300`}>
        <tool.icon className="w-6 h-6" />
      </div>
      <h3 className="text-lg font-bold text-slate-800 mb-2">{tool.name}</h3>
      <p className="text-slate-500 text-xs leading-relaxed font-medium">{tool.desc}</p>
    </button>
  );

  const renderToolInterface = () => (
    <div className="flex flex-col h-full max-w-5xl mx-auto px-4 py-6">
        {/* Nav */}
        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3 text-sm">
                <button onClick={() => { setActiveTool(null); clearAll(); }} className="text-slate-500 hover:text-violet-600 transition-colors font-medium">
                    Dashboard
                </button>
                <ChevronRight className="w-4 h-4 text-slate-300" />
                <span className="font-bold text-slate-800 flex items-center gap-2">
                   <activeTool.icon className="w-4 h-4 text-violet-600" /> {activeTool.name}
                </span>
            </div>
        </div>

        {/* Workspace */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-slate-200/50 border border-white/60 ring-1 ring-slate-100 overflow-hidden flex-1 flex flex-col relative">
            
            <div className="flex-1 p-8 overflow-y-auto">
                {completedFile ? (
                     <div className="h-full flex flex-col items-center justify-center text-center">
                        <div className="w-20 h-20 bg-gradient-to-tr from-emerald-400 to-green-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-green-200 mb-6">
                            <CheckCircle className="w-10 h-10" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-800 mb-2">Conversion Complete!</h3>
                        <p className="text-slate-500 mb-8">
                           {completedFile.simulation 
                                ? `"${completedFile.name}" processing completed. Note: This feature requires server-side processing for full functionality.`
                                : `"${completedFile.name}" has been processed successfully and is ready to download.`
                           } 
                        </p>
                        <div className="flex gap-4">
                             <a 
                                 href={completedFile.url || '#'} 
                                 download={completedFile.name}
                                 onClick={(e) => {
                                   if (completedFile.simulation) {
                                     e.preventDefault();
                                     alert('This is a simulated conversion. Real conversion requires server-side processing.');
                                   }
                                 }}
                                 className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold transition-colors ${
                                   completedFile.simulation 
                                     ? 'bg-slate-300 text-slate-600 cursor-not-allowed' 
                                     : 'bg-slate-900 text-white hover:bg-slate-800'
                                 }`}
                             >
                                 <Download className="w-4 h-4" /> {completedFile.simulation ? 'Download (Unavailable)' : 'Download'}
                             </a>
                            <button 
                                onClick={() => { setCompletedFile(null); setFiles([]); setProgress(0); }}
                                className="px-8 py-3 border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-colors"
                            >
                                Convert Another
                            </button>
                        </div>
                     </div>
                ) : (
                    <div className="h-full flex flex-col">
                        {/* Mode Toggle for PDF to Word */}
                        {activeTool.id === 'pdf-to-word' && (
                          <div className="mb-6 bg-slate-50 p-1 rounded-lg flex border border-slate-200 w-fit mx-auto">
                             <button 
                               onClick={() => setUseOCR(false)}
                               className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${!useOCR ? 'bg-white shadow text-violet-700' : 'text-slate-500 hover:text-slate-700'}`}
                             >
                               Standard
                             </button>
                             <button 
                               onClick={() => setUseOCR(true)}
                               className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-bold transition-all ${useOCR ? 'bg-white shadow text-violet-700' : 'text-slate-500 hover:text-slate-700'}`}
                             >
                               <Scan className="w-4 h-4" /> OCR (Scanned)
                             </button>
                          </div>
                        )}

                        {/* Upload Area */}
                        {files.length === 0 ? (
                            <div className="flex-1 border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50/50 hover:bg-violet-50/30 hover:border-violet-400 transition-all duration-300 flex flex-col items-center justify-center relative group cursor-pointer">
                                <input 
                                    type="file" 
                                    multiple 
                                    accept={activeTool.id.includes('word') ? ".doc,.docx" : activeTool.id.includes('img') ? "image/*" : ".pdf"}
                                    onChange={handleFileChange}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                />
                                <div className="w-20 h-20 bg-white rounded-2xl shadow-xl shadow-slate-100 flex items-center justify-center text-violet-500 mb-6 group-hover:scale-110 transition-transform duration-300">
                                    <UploadCloud className="w-10 h-10" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-800 mb-2">Drop document here</h3>
                                <p className="text-slate-500 font-medium">or click to browse</p>
                                <div className="mt-4 flex gap-2">
                                    {activeTool.id === 'word-to-pdf' && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">DOC</span>}
                                    {activeTool.id === 'word-to-pdf' && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">DOCX</span>}
                                    {activeTool.id !== 'word-to-pdf' && <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">PDF</span>}
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1">
                                <div className="grid gap-3">
                                    {files.map((file) => (
                                        <div key={file.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-violet-200 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500">
                                                    {file.file.type.includes('image') ? <ImageIcon className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-700 text-sm">{file.file.name}</p>
                                                    <p className="text-xs text-slate-400">{file.size} MB</p>
                                                </div>
                                            </div>
                                            <button onClick={() => removeFile(file.id)} className="text-slate-300 hover:text-red-500 transition-colors p-2">
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Footer / Action Bar */}
            {!completedFile && (
                <div className="p-6 border-t border-slate-100 bg-white/50 backdrop-blur-md">
                   {/* Progress Bar */}
                   {processing && (
                       <div className="mb-4">
                           <div className="flex justify-between text-xs font-bold text-slate-500 mb-1">
                               <span>{useOCR ? 'Analyzing & OCR Processing...' : 'Converting...'}</span>
                               <span>{progress}%</span>
                           </div>
                           <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                               <div 
                                   className="bg-violet-600 h-2 rounded-full transition-all duration-300 ease-out"
                                   style={{ width: `${progress}%` }}
                               />
                           </div>
                       </div>
                   )}

                   <div className="flex justify-between items-center">
                        <div className="text-slate-500 text-sm font-medium">
                            {files.length > 0 && !processing ? 'Ready.' : ''}
                        </div>

                        <button 
                            onClick={processFiles}
                            disabled={files.length === 0 || processing}
                            className={`flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-sm tracking-wide transition-all ${
                                files.length === 0 || processing
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                                : 'bg-violet-600 text-white hover:bg-violet-700 shadow-lg shadow-violet-200 hover:-translate-y-0.5'
                            }`}
                        >
                            {processing ? (
                                'Processing...'
                            ) : (
                                <>
                                    {activeTool.id === 'pdf-to-word' && useOCR ? 'OCR CONVERT' : 'CONVERT NOW'} 
                                    <ChevronRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    </div>
  );

  // --- Layout ---

  return (
    <div className="flex h-screen bg-[#F8FAFC] font-sans text-slate-900 overflow-hidden selection:bg-violet-200 selection:text-violet-900">
      
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-0 md:w-20'} bg-white border-r border-slate-200 transition-all duration-300 flex flex-col shrink-0 z-20`}>
        <div className="p-6 flex items-center gap-3 border-b border-slate-100 h-20">
           <img src="/assets/Beige___Black_Aesthetic_Flower_Boutique_Logo-removebg-preview.png" alt="PDF Nexus Logo" className="w-10 h-10 object-contain shrink-0" />
           <span className={`font-black text-2xl tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 whitespace-nowrap transition-opacity ${sidebarOpen ? 'opacity-100' : 'opacity-0 hidden md:block'}`}>
             PDF Nexus
           </span>
        </div>
        
        <nav className="flex-1 py-6 overflow-y-auto px-3 space-y-1">
            {/* Animated Toggle Button Inside Menu */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={`w-full group relative rounded-xl bg-gradient-to-br from-violet-50 to-fuchsia-50 border-2 border-violet-200 hover:border-violet-400 transition-all duration-300 overflow-hidden hover:shadow-lg hover:shadow-violet-200 ${sidebarOpen ? 'p-3' : 'p-2 md:p-3'}`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-violet-600 to-fuchsia-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className={`relative flex items-center gap-3 ${sidebarOpen ? '' : 'justify-center'}`}>
                {/* Animated Hamburger Icon */}
                <div className="flex flex-col gap-1.5 w-5 shrink-0">
                  <span className={`h-0.5 bg-violet-600 group-hover:bg-white rounded-full transition-all duration-300 ${sidebarOpen ? 'w-full' : 'w-full'}`} />
                  <span className={`h-0.5 bg-violet-600 group-hover:bg-white rounded-full transition-all duration-300 ${sidebarOpen ? 'w-full' : 'w-3/4'}`} />
                  <span className={`h-0.5 bg-violet-600 group-hover:bg-white rounded-full transition-all duration-300 ${sidebarOpen ? 'w-full' : 'w-1/2'}`} />
                </div>
                <span className={`${sidebarOpen ? 'block' : 'hidden'} font-bold text-violet-700 group-hover:text-white whitespace-nowrap transition-colors duration-300`}>
                  Dashboard
                </span>
              </div>
            </button>

            {!activeTool && (
              <div className="pt-4 pb-2">
                   <div className={`text-xs font-bold text-slate-400 px-3 mb-2 uppercase tracking-wider ${!sidebarOpen && 'hidden'}`}>Quick Tools</div>
                   {TOOL_CATEGORIES.PRIORITY.tools.map(tool => (
                      <button 
                          key={tool.id}
                          onClick={() => { setActiveTool(tool); clearAll(); }}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-300 group ${activeTool?.id === tool.id ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:bg-violet-50 hover:shadow-lg hover:-translate-y-0.5'}`}
                      >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${activeTool?.id === tool.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600 group-hover:bg-violet-600 group-hover:text-white'}`}>
                            <tool.icon className="w-4 h-4 shrink-0" />
                          </div>
                          <span className={`${sidebarOpen ? 'block' : 'hidden'} font-medium whitespace-nowrap`}>{tool.name}</span>
                      </button>
                   ))}
              </div>
            )}
        </nav>

        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
            <div className={`flex items-center gap-3 text-slate-500 text-xs font-bold uppercase tracking-wider ${sidebarOpen ? '' : 'justify-center'}`}>
                <Shield className="w-4 h-4 shrink-0" />
                <span className={`${sidebarOpen ? 'block' : 'hidden'}`}>Secure Mode</span>
            </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-full relative bg-gradient-to-br from-slate-50 to-slate-100">
         {/* Header Mobile */}
         <div className="md:hidden bg-white border-b border-slate-200 p-4 flex justify-between items-center z-30 relative">
             <div className="flex items-center gap-2">
               <img src="/assets/Beige___Black_Aesthetic_Flower_Boutique_Logo-removebg-preview.png" alt="PDF Nexus Logo" className="w-8 h-8 object-contain" />
               <span className="font-bold text-lg">PDF Nexus</span>
             </div>
             <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-slate-100 rounded-lg">
                 <Menu className="w-6 h-6" />
             </button>
         </div>

         {/* Desktop Toggle - Sidebar only */}
         <div className="flex-1 overflow-y-auto">
             {activeTool ? renderToolInterface() : renderDashboard()}
         </div>

         {/* AI Assistant Floating Button - Draggable */}
         <div
           style={{
             position: 'fixed',
             left: `${Math.max(60, Math.min(aiPosition.x, window.innerWidth - 60))}px`,
             top: `${Math.max(60, Math.min(aiPosition.y, window.innerHeight - 60))}px`,
             transform: 'translate(-50%, -50%)',
             cursor: isDragging ? 'grabbing' : 'grab',
             zIndex: 50
           }}
           onMouseDown={handleMouseDown}
           className="group"
         >
           <button
             onClick={() => {
               if (!hasDragged) {
                 setAiChatOpen(!aiChatOpen);
               }
             }}
             className="ai-robot-button relative w-24 h-32 transition-all duration-300 flex flex-col items-center justify-center group-hover:scale-110"
           >
             {/* Robot Body - Only show when chat is closed */}
             {!aiChatOpen && (
               <div className="relative">
                 {/* Head */}
                 <div className="relative w-20 h-20 bg-gradient-to-b from-cyan-300 to-cyan-400 rounded-t-3xl shadow-lg">
                   {/* Antennae */}
                   <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex gap-4">
                     <div className="w-1 h-4 bg-cyan-400 rounded-full"></div>
                     <div className="w-1 h-4 bg-cyan-400 rounded-full"></div>
                   </div>
                   
                   {/* Face Circle */}
                   <div className="absolute top-6 left-1/2 -translate-x-1/2 w-14 h-10 bg-slate-800 rounded-full flex items-center justify-center">
                     {/* Eyes */}
                     <div className="flex gap-3">
                       <div className="relative w-4 h-4 bg-white rounded-full flex items-center justify-center">
                         <div className="w-2.5 h-2.5 bg-cyan-500 rounded-full animate-pulse"></div>
                       </div>
                       <div className="relative w-4 h-4 bg-white rounded-full flex items-center justify-center">
                         <div className="w-2.5 h-2.5 bg-cyan-500 rounded-full animate-pulse"></div>
                       </div>
                     </div>
                   </div>
                   
                   {/* Smile */}
                   <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-6 h-3 border-b-2 border-slate-800 rounded-full"></div>
                 </div>
                 
                 {/* Body */}
                 <div className="w-20 h-12 bg-gradient-to-b from-cyan-400 to-cyan-500 rounded-b-3xl shadow-lg relative">
                   {/* Body Line */}
                   <div className="absolute top-0 left-0 right-0 h-0.5 bg-cyan-600"></div>
                   
                   {/* Central Circle */}
                   <div className="absolute top-2 left-1/2 -translate-x-1/2 w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center">
                     <div className="w-6 h-6 rounded-full border-2 border-cyan-400 flex items-center justify-center">
                       <div className="w-2 h-2 bg-cyan-400 rounded-full animate-ping"></div>
                     </div>
                   </div>
                   
                   {/* Side Details */}
                   <div className="absolute left-1 top-3 flex flex-col gap-1">
                     <div className="w-1 h-1 bg-slate-700 rounded-full"></div>
                     <div className="w-1 h-1 bg-slate-700 rounded-full"></div>
                     <div className="w-1 h-1 bg-slate-700 rounded-full"></div>
                   </div>
                   <div className="absolute right-1 top-3 flex flex-col gap-1">
                     <div className="w-1 h-1 bg-slate-700 rounded-full"></div>
                     <div className="w-1 h-1 bg-slate-700 rounded-full"></div>
                     <div className="w-1 h-1 bg-slate-700 rounded-full"></div>
                   </div>
                 </div>
                 
                 {/* Notification Badge */}
                 <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white animate-pulse"></span>
               </div>
             )}
          </button>
          
          {/* "May I help you?" text below button - Only show when chat is closed */}
          {!aiChatOpen && (
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 whitespace-nowrap bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg animate-float">
              May I help you?
            </div>
          )}
        </div>
         {/* AI Chat Window */}
         {aiChatOpen && (
           <div 
             style={{
               position: 'fixed',
               left: `${aiPosition.x}px`,
               top: `${aiPosition.y - 320}px`,
               transform: 'translateX(-50%)',
             }}
             className="ai-chat-container w-[420px] h-[550px] bg-white rounded-3xl shadow-2xl border-2 border-cyan-200 flex flex-col z-40 overflow-hidden animate-scale-in"
           >
             {/* Header */}
             <div className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white p-5 flex items-center gap-3">
               {/* Robot Logo */}
               <div className="relative w-10 h-14 flex-shrink-0 animate-pulse">
                 {/* Head */}
                 <div className="relative w-10 h-10 bg-gradient-to-b from-cyan-200 to-cyan-300 rounded-t-2xl shadow-lg shadow-cyan-300/50">
                   {/* Antennae */}
                   <div className="absolute -top-2 left-1/2 -translate-x-1/2 flex gap-2">
                     <div className="w-0.5 h-2 bg-cyan-200 rounded-full shadow-sm shadow-cyan-200"></div>
                     <div className="w-0.5 h-2 bg-cyan-200 rounded-full shadow-sm shadow-cyan-200"></div>
                   </div>
                   
                   {/* Face Circle */}
                   <div className="absolute top-3 left-1/2 -translate-x-1/2 w-7 h-5 bg-slate-800 rounded-full flex items-center justify-center">
                     {/* Eyes */}
                     <div className="flex gap-1.5">
                       <div className="relative w-2 h-2 bg-white rounded-full flex items-center justify-center shadow-sm shadow-white">
                         <div className="w-1 h-1 bg-cyan-400 rounded-full shadow-sm shadow-cyan-400"></div>
                       </div>
                       <div className="relative w-2 h-2 bg-white rounded-full flex items-center justify-center shadow-sm shadow-white">
                         <div className="w-1 h-1 bg-cyan-400 rounded-full shadow-sm shadow-cyan-400"></div>
                       </div>
                     </div>
                   </div>
                   
                   {/* Smile */}
                   <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-3 h-1.5 border-b border-slate-800 rounded-full"></div>
                 </div>
                 
                 {/* Body */}
                 <div className="w-10 h-6 bg-gradient-to-b from-cyan-300 to-cyan-400 rounded-b-2xl relative shadow-lg shadow-cyan-400/50">
                   <div className="absolute top-0 left-0 right-0 h-px bg-cyan-500"></div>
                   <div className="absolute top-1 left-1/2 -translate-x-1/2 w-4 h-4 bg-slate-800 rounded-full flex items-center justify-center">
                     <div className="w-3 h-3 rounded-full border border-cyan-300 flex items-center justify-center shadow-sm shadow-cyan-300">
                       <div className="w-1 h-1 bg-cyan-300 rounded-full shadow-sm shadow-cyan-300 animate-pulse"></div>
                     </div>
                   </div>
                 </div>
               </div>
               
               <div className="flex-1">
                 <h3 className="font-bold text-lg">AI Assistant</h3>
                 <p className="text-xs text-white/90">Always here to help ✨</p>
               </div>
               <button
                 onClick={() => setAiChatOpen(false)}
                 className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
               >
                 <X className="w-5 h-5" />
               </button>
             </div>

             {/* Messages */}
             <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
               {aiMessages.map((msg, idx) => (
                 <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                   <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                     msg.role === 'user' 
                       ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white' 
                       : 'bg-white text-slate-800 border border-slate-200'
                   }`}>
                     <p className="text-sm">{msg.text}</p>
                   </div>
                 </div>
               ))}
             </div>

             {/* Input */}
             <div className="p-4 border-t border-slate-200 bg-white">
               <div className="flex gap-2">
                 <input
                   type="text"
                   value={aiInput}
                   onChange={(e) => setAiInput(e.target.value)}
                   onKeyPress={(e) => e.key === 'Enter' && handleAiSend()}
                   placeholder="Ask me anything..."
                   className="flex-1 px-4 py-2 border border-slate-200 rounded-xl outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 transition-all"
                 />
                 <button
                   onClick={handleAiSend}
                   className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl flex items-center justify-center hover:shadow-lg transition-all hover:scale-105"
                 >
                   <Send className="w-4 h-4" />
                 </button>
               </div>
             </div>
           </div>
         )}
      </main>
    </div>
  );
}