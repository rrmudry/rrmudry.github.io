import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface ScoreSummaryProps {
  studentId: string;
  score: number;
  total: number;
  onRestart: () => void;
}

const ScoreSummary: React.FC<ScoreSummaryProps> = ({ studentId, score, total, onRestart }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const payload = JSON.stringify({ studentId, score, total, timestamp: new Date().toISOString() });
    QRCode.toDataURL(payload, { width: 320, margin: 1, errorCorrectionLevel: 'M' })
      .then(setQrDataUrl)
      .catch(() => {
        setError('Unable to generate QR code. Please capture your score manually.');
      });
  }, [studentId, score, total]);

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `physics-speed-score-${studentId}.png`;
    link.click();
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-2xl p-10 text-center">
      <h2 className="text-3xl font-bold text-slate-800 mb-2">Level 3 Challenge Complete!</h2>
      <p className="text-slate-600 mb-6">
        Student ID <span className="font-semibold text-slate-900">{studentId}</span> · Score <span className="font-semibold text-slate-900">{score}</span> / {total}
      </p>
      {error ? (
        <p className="text-red-600 mb-6">{error}</p>
      ) : (
        <div className="flex flex-col items-center gap-4 mb-6">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-inner">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="Score QR code" className="h-64 w-64 object-contain" />
            ) : (
              <span className="text-slate-500">Generating QR...</span>
            )}
          </div>
          <button
            type="button"
            onClick={handleDownload}
            disabled={!qrDataUrl}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-semibold px-4 py-2 transition-colors disabled:bg-slate-400"
          >
            Download QR Code
          </button>
        </div>
      )}
      <button
        type="button"
        onClick={onRestart}
        className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-100"
      >
        Start Another Student
      </button>
    </div>
  );
};

export default ScoreSummary;
