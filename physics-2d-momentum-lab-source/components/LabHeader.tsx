
import React, { useEffect, useRef } from 'react';

interface LabHeaderProps {
  studentName: string;
  studentId: string;
  classPeriod: string;
  onUpdate: (field: string, val: string) => void;
}

export const LabHeader: React.FC<LabHeaderProps> = ({ studentName, studentId, classPeriod, onUpdate }) => {
  const qrContainerRef = useRef<HTMLDivElement>(null);
  const qrInstanceRef = useRef<any>(null);

  useEffect(() => {
    // Wait for the DOM element to be available and stable
    const initTimer = setTimeout(() => {
      if (qrContainerRef.current && !qrInstanceRef.current) {
        try {
          const QRCodeLib = (window as any).QRCode;
          if (QRCodeLib) {
            // Using a slightly smaller QR size relative to the container for a "Quiet Zone"
            // Scanners need this white margin to correctly detect the QR code boundaries.
            qrInstanceRef.current = new QRCodeLib(qrContainerRef.current, {
              text: "ID_PENDING",
              width: 72,
              height: 72,
              colorDark: "#000000",
              colorLight: "#ffffff",
              correctLevel: 1 // Level L (highest data capacity)
            });
            
            if (studentId.trim()) {
              qrInstanceRef.current.makeCode(`SID:${studentId.trim()}`);
            }
          }
        } catch (err) {
          console.error("QR Library initialization failed:", err);
        }
      }
    }, 300);

    return () => {
      clearTimeout(initTimer);
      if (qrContainerRef.current) {
        qrContainerRef.current.innerHTML = "";
      }
      qrInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (qrInstanceRef.current) {
      try {
        const idText = studentId.trim();
        qrInstanceRef.current.makeCode(idText ? `SID:${idText}` : "ID_PENDING");
      } catch (err) {
        console.warn("QR Update suppressed to prevent crash:", err);
      }
    }
  }, [studentId]);

  return (
    <header className="bg-[#161b2e] border border-[#1e293b] rounded-2xl p-8 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50"></div>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
        <h1 className="text-3xl md:text-5xl font-orbitron font-bold text-cyan-400 tracking-tighter leading-tight [text-shadow:0_0_20px_rgba(34,211,238,0.3)]">
          PHYSICS LAB:<br/>CONSERVATION OF MOMENTUM
        </h1>

        <div className="flex flex-col items-center space-y-2 p-3 bg-black/40 border border-cyan-500/20 rounded-xl min-w-[110px]">
          {/* 
            Container size: 92x92
            QR size: 72x72
            This provides a 10px white margin (Quiet Zone) on all sides,
            which is essential for QR scanners to work reliably.
          */}
          <div 
            ref={qrContainerRef} 
            className="qr-wrapper w-[92px] h-[92px] bg-white flex items-center justify-center rounded-lg shadow-inner"
            title="Generated Student Authentication QR"
          >
             {!studentId && <span className="text-[9px] text-slate-400 font-orbitron text-center uppercase font-bold leading-tight">WAITING<br/>FOR ID</span>}
          </div>
          <span className="text-[9px] font-orbitron text-cyan-500/60 uppercase tracking-widest font-bold">Student Auth</span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="flex flex-col space-y-3">
          <label className="text-[10px] font-orbitron text-blue-400 uppercase tracking-[0.2em] font-bold">
            Student Name <span className="text-red-500 ml-1">*</span>
          </label>
          <input
            type="text"
            required
            value={studentName}
            onChange={(e) => onUpdate('studentName', e.target.value)}
            placeholder="ENTER FULL NAME"
            className="bg-[#0a0e17] border border-[#334155] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-all font-mono placeholder:opacity-20"
          />
        </div>
        <div className="flex flex-col space-y-3">
          <label className="text-[10px] font-orbitron text-blue-400 uppercase tracking-[0.2em] font-bold">
            Student ID (6 Digits) <span className="text-red-500 ml-1">*</span>
          </label>
          <input
            type="text"
            required
            maxLength={6}
            value={studentId}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '');
              onUpdate('studentId', val);
            }}
            placeholder="000000"
            className="bg-[#0a0e17] border border-[#334155] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-all font-mono placeholder:opacity-20"
          />
        </div>
        <div className="flex flex-col space-y-3">
          <label className="text-[10px] font-orbitron text-blue-400 uppercase tracking-[0.2em] font-bold">
            Class Period
          </label>
          <input
            type="text"
            value={classPeriod}
            onChange={(e) => onUpdate('classPeriod', e.target.value)}
            placeholder="P-01"
            className="bg-[#0a0e17] border border-[#334155] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-all font-mono placeholder:opacity-20"
          />
        </div>
      </div>
    </header>
  );
};
