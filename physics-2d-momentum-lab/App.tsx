import React, { useState } from 'react';
import SectionOne from './components/SectionOne';
import SectionTwo from './components/SectionTwo';
import SectionThree from './components/SectionThree';
import SectionFour from './components/SectionFour';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import QRCode from 'react-qr-code';

function App() {
  const [studentName, setStudentName] = useState('');
  const [studentID, setStudentID] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  // centralized state for all sections
  const [labData, setLabData] = useState({
    section1: {},
    section2: {},
    section3: {},
    section4: {}
  });

  const updateData = (section: string, field: string, value: any) => {
    setLabData(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [field]: value
      }
    }));
  };

  const generatePDF = async () => {
    setIsGenerating(true);
    const element = document.getElementById('lab-report');
    if (!element) return;

    element.classList.add('is-printing');

    // --- DIV SWAP LOGIC START ---
    // @ts-ignore
    const textareas = element.querySelectorAll('textarea');
    const replacements: { div: HTMLDivElement; ta: HTMLTextAreaElement }[] = [];

    textareas.forEach((ta) => {
      const div = document.createElement('div');
      div.innerText = ta.value;
      
      const style = window.getComputedStyle(ta);
      div.style.cssText = style.cssText;
      div.style.width = style.width;
      div.style.minHeight = style.height; 
      div.style.whiteSpace = 'pre-wrap'; 
      div.style.overflow = 'hidden';

      ta.parentNode?.insertBefore(div, ta);
      ta.style.display = 'none';
      replacements.push({ div, ta });
    });
    // --- EXPANSION LOGIC END ---

    try {
      // Force scroll to top to ensure header capture
      window.scrollTo(0, 0);
      
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#111827', // dark bg
        useCORS: true
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`2D_Momentum_Lab_${studentName || 'Student'}.pdf`);
    } finally {
      // Cleanup
      replacements.forEach(({ div, ta }) => {
        div.remove();
        ta.style.display = '';
      });
      element.classList.remove('is-printing');
      setIsGenerating(false);
    }
  };

  // SID Validation (6 digits)
  const isSidValid = /^\d{6}$/.test(studentID);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans selection:bg-cyan-500/30">
      
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12 relative z-10" id="lab-report">
        
        {/* Header */}
        <header className="mb-12 text-center border-b border-gray-800 pb-8 relative">
          <div className="inline-block p-4 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 shadow-2xl mb-6 relative group">
             <div className="absolute inset-0 bg-cyan-500/20 blur-xl rounded-full group-hover:bg-cyan-400/30 transition-all duration-500"></div>
             <svg className="w-16 h-16 text-cyan-400 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
             </svg>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-extrabold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent mb-4 tracking-tight">
            2D MOMENTUM LAB
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Analyze the vectors of explosions using conservation principles.
          </p>

          {/* QR Code Display (Hidden in UI usually, but we want it visible for PDF) */}
          {studentID && (
            <div className="absolute top-0 right-0 p-2 bg-white rounded shadow-lg hidden md:block">
               <QRCode value={`SID:${studentID}`} size={64} />
               <div className="text-black text-xs font-mono font-bold mt-1 text-center">SID:{studentID}</div>
            </div>
          )}
        </header>

        {/* Student Info */}
        <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700/50 backdrop-blur-sm mb-12 flex flex-col gap-6">
          <div className="flex flex-col md:flex-row gap-6">
              <div className="w-full md:w-2/3">
                <label className="block text-cyan-400 text-sm font-bold mb-2 uppercase tracking-wider">Student Name</label>
                <input
                  type="text"
                  placeholder="Enter your full name (Required)"
                  className="w-full bg-gray-900/80 border-2 border-gray-700 rounded-lg p-4 text-white placeholder-gray-600 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 transition-all outline-none text-lg"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                />
              </div>
              <div className="w-full md:w-1/3">
                <label className="block text-cyan-400 text-sm font-bold mb-2 uppercase tracking-wider">Student ID</label>
                <div className="relative">
                    <input
                    type="text"
                    maxLength={6}
                    placeholder="6 Digits"
                    className={`w-full bg-gray-900/80 border-2 rounded-lg p-4 text-white placeholder-gray-600 focus:ring-4 transition-all outline-none text-lg font-mono tracking-widest ${isSidValid ? 'border-green-500 focus:border-green-500 focus:ring-green-500/10' : 'border-gray-700 focus:border-red-500 focus:ring-red-500/10'}`}
                    value={studentID}
                    onChange={(e) => setStudentID(e.target.value.replace(/\D/g, ''))}
                    />
                    {isSidValid && (
                        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-green-500">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        </div>
                    )}
                </div>
              </div>
          </div>
          
          {/* Mobile QR check (visible everywhere since layout can shift) */}
          <div className="md:hidden flex justify-center">
             {studentID && (
                <div className="bg-white p-2 rounded">
                    <QRCode value={`SID:${studentID}`} size={80} />
                    <div className="text-black text-xs font-mono font-bold mt-1 text-center">SID:{studentID}</div>
                </div>
             )}
          </div>
        </div>

        {/* Sections */}
        <SectionOne data={labData.section1} updateData={updateData} />
        <SectionTwo data={labData.section2} updateData={updateData} />
        <SectionThree data={labData.section3} updateData={updateData} />
        <SectionFour data={labData.section4} updateData={updateData} />

        {/* Footer / Submit */}
        <div className="mt-16 text-center">
            <button
              onClick={generatePDF}
              disabled={isGenerating || !studentName || !isSidValid}
              className={`
                group relative px-12 py-5 rounded-full font-bold text-xl tracking-wider transition-all duration-300 transform hover:-translate-y-1
                ${(!studentName || !isSidValid)
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50'
                }
              `}
            >
              <span className={`flex items-center gap-3 ${isGenerating ? 'animate-pulse' : ''}`}>
                {isGenerating ? (
                  <>GENERATING PDF...</>
                ) : (
                  <>
                    FINALIZE REPORT
                    <svg className="w-6 h-6 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  </>
                )}
              </span>
            </button>
            <p className="mt-4 text-gray-500 text-sm">
              {!studentName || !isSidValid ? "Enter Name and 6-digit ID to unlock." : "Downloads a PDF to submit for grading."}
            </p>
        </div>

      </div>
    </div>
  );
}

export default App;
