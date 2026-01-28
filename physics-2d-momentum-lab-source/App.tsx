import React, { useState, useCallback } from 'react';
import { LabHeader } from './components/LabHeader';
import { VideoSection } from './components/VideoSection';
import { SectionOne } from './components/SectionOne';
import { SectionTwo } from './components/SectionTwo';
import { LabState } from './types';

const App: React.FC = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [state, setState] = useState<LabState>({
    studentName: '',
    studentId: '',
    classPeriod: '',
    videoAnswers: { q1: '', q2: '', q3: '', q4: '', q5: '' },
    trial2D: { 
      m1: '', vx1: '', vy1: '', 
      m2: '', vx2: '', vy2: '', 
      m3: '', vx3: '', vy3: '' 
    },
    conceptualAnswers: {
      q1: '',
      q2: '',
    },
  });

  const updateState = (path: string, value: any) => {
    setState((prev) => {
      const parts = path.split('.');
      const newState = { ...prev };

      if (parts.length === 1) {
        // @ts-ignore
        newState[parts[0]] = value;
      } else if (parts.length === 2) {
        const [p1, p2] = parts;
        // @ts-ignore
        newState[p1] = { ...prev[p1], [p2]: value };
      }
      return newState;
    });
  };

  const handleFinalizeClick = () => {
    if (!state.studentName.trim() || !state.studentId.trim()) {
      alert("SYSTEM ERROR: Identification required. Please enter Student Name and ID.");
      return;
    }
    setShowWarning(true);
  };

  const handleExportPDF = useCallback(async () => {
    setShowWarning(false);
    const element = document.getElementById('report-paper');
    if (!element) return;

    setIsGenerating(true);
    element.classList.add('is-printing');

    // --- DIV SWAP LOGIC ---
    // @ts-ignore
    const textareas = element.querySelectorAll('textarea');
    const replacements: { div: HTMLDivElement; ta: HTMLTextAreaElement }[] = [];

    textareas.forEach((ta) => {
      const div = document.createElement('div');
      const style = window.getComputedStyle(ta);
      div.style.width = style.width;
      div.style.minHeight = style.height;
      div.style.padding = style.padding;
      div.style.fontSize = style.fontSize;
      div.style.fontFamily = style.fontFamily;
      div.style.lineHeight = style.lineHeight;
      div.style.color = style.color;
      div.style.backgroundColor = style.backgroundColor;
      div.style.border = style.border;
      div.style.borderRadius = style.borderRadius;
      div.style.whiteSpace = 'pre-wrap';
      div.style.wordWrap = 'break-word';
      div.style.overflow = 'hidden';
      div.innerText = ta.value;
      ta.parentNode?.insertBefore(div, ta);
      ta.style.display = 'none';
      replacements.push({ div, ta });
    });

    await new Promise(resolve => setTimeout(resolve, 800));

    const captureWidth = 900;
    const captureHeight = element.scrollHeight; 
    const mmWidth = captureWidth * 0.264583;
    const mmHeight = (captureHeight * 0.264583) + 10; 

    const opt = {
      margin: 0,
      filename: `2D_Momentum_Lab_${state.studentName.trim().replace(/\s+/g, '_')}.pdf`,
      image: { type: 'jpeg', quality: 0.95 },
      html2canvas: { 
        scale: 1.5,
        useCORS: true, 
        backgroundColor: '#0a0e17',
        width: captureWidth,
        height: captureHeight,
        windowWidth: captureWidth,
        scrollY: 0,
        x: 0,
        y: 0,
        logging: false
      },
      jsPDF: { 
        unit: 'mm', 
        format: [mmWidth, mmHeight], 
        orientation: 'portrait',
        compress: true
      }
    };

    try {
      // @ts-ignore
      await window.html2pdf().set(opt).from(element).save();
    } catch (err) {
      console.error('EXPORT FAILED:', err);
      alert('Data export failed.');
    } finally {
      replacements.forEach(({ div, ta }) => {
        div.remove();
        ta.style.display = '';
      });
      element.classList.remove('is-printing');
      setIsGenerating(false);
    }
  }, [state]);

  return (
    <div className="min-h-screen bg-[#030712] flex flex-col items-center py-0 md:py-10 selection:bg-cyan-500/30 relative">
      
      {showWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md no-print">
          <div className="bg-[#0f172a] border-2 border-cyan-500/50 rounded-2xl p-8 max-w-md w-full shadow-[0_0_50px_rgba(34,211,238,0.3)] space-y-6">
            <div className="flex items-center space-x-3 text-cyan-400">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h3 className="text-xl font-orbitron font-bold uppercase tracking-wider">Finalize 2D Report?</h3>
            </div>
            <div className="space-y-4 text-slate-300">
              <p className="text-sm leading-relaxed text-red-400 font-bold">
                NOTICE: You are about to finalize a 2D CONSERVATION report.
              </p>
              <div className="bg-red-500/10 border-l-4 border-red-500 p-4 rounded">
                <p className="text-sm text-white">Upload this PDf to Classroom for credit.</p>
              </div>
            </div>
            <div className="flex flex-col space-y-3">
              <button onClick={handleExportPDF} className="w-full py-4 bg-cyan-600 hover:bg-cyan-500 text-white font-orbitron font-bold rounded-xl transition-all shadow-lg uppercase tracking-widest">
                Download PDF
              </button>
              <button onClick={() => setShowWarning(false)} className="w-full py-2 text-slate-500 hover:text-white text-xs font-orbitron uppercase transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div id="report-paper" className="w-full max-w-[900px] p-6 md:p-12 space-y-12 relative overflow-hidden border-x border-[#1e293b]/30">
        <div className="hud-corner top-l no-print"></div>
        <div className="hud-corner top-r no-print"></div>
        <div className="hud-corner bot-l no-print"></div>
        <div className="hud-corner bot-r no-print"></div>

        <LabHeader 
          studentName={state.studentName} 
          studentId={state.studentId}
          classPeriod={state.classPeriod}
          onUpdate={(field, val) => updateState(field, val)}
        />

        <VideoSection 
          answers={state.videoAnswers}
          onUpdate={(field, val) => updateState(field, val)}
        />

        <SectionOne 
          data={state.trial2D}
          onUpdate={(field, val) => updateState('trial2D.' + field, val)}
        />

        <SectionTwo 
          answers={state.conceptualAnswers}
          onUpdate={(field, val) => updateState('conceptualAnswers.' + field, val)}
        />

        <div className="no-print py-4 flex flex-col items-center space-y-4">
          <div className="flex items-center space-x-2 text-cyan-400 font-orbitron text-xs tracking-[0.2em] font-bold">
            <span className="opacity-50">----------------</span>
            <span>2D LAB COMPLETE</span>
            <span className="opacity-50">----------------</span>
          </div>
          <div className="flex flex-col items-center space-y-2 animate-bounce">
            <svg className="w-5 h-5 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>

        <div className="pt-10 border-t border-[#1e293b]/50 text-center">
            <p className="text-[#334155] font-orbitron text-[9px] tracking-[0.4em] uppercase opacity-60">
                2D Momentum System v5.0 // Document Secure
            </p>
        </div>

        <div className="flex justify-center pt-8 pb-12 no-print">
          <button
            onClick={handleFinalizeClick}
            disabled={isGenerating}
            className={`
              ${isGenerating ? 'opacity-50 cursor-not-allowed bg-slate-800' : 'btn-glow hover:bg-[#1d4ed8] active:scale-95 bg-[#2563eb]'}
              text-white font-orbitron font-bold py-5 px-20 rounded-xl 
              shadow-[0_0_30px_rgba(37,99,235,0.4)] border border-blue-400/50 transition-all text-lg tracking-widest
            `}
          >
            {isGenerating ? 'SCANNING SYSTEM...' : 'FINALIZE 2D REPORT'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;
