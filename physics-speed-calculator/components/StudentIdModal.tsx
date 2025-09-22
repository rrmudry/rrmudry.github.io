import React, { useState } from 'react';

interface StudentIdModalProps {
  onSubmit: (studentId: string) => void;
}

const StudentIdModal: React.FC<StudentIdModalProps> = ({ onSubmit }) => {
  const [studentId, setStudentId] = useState('');
  const [touched, setTouched] = useState(false);

  const sanitized = studentId.replace(/[^0-9]/g, '').slice(0, 6);
  const isValid = sanitized.length === 6;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setTouched(true);
    if (!isValid) return;
    onSubmit(sanitized);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4">
        <h1 className="text-2xl font-bold text-slate-800 text-center mb-4">Welcome to the Speed Lab</h1>
        <p className="text-slate-600 text-center mb-6">
          Enter your student ID to begin. You’ll unlock tougher levels as you build a streak of correct answers.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-sm font-semibold text-slate-700" htmlFor="student-id">
            Student ID
          </label>
          <input
            id="student-id"
            type="text"
            value={studentId}
            onChange={event => setStudentId(event.target.value)}
            onBlur={() => setTouched(true)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-sky-500"
            placeholder="6-digit ID (e.g., 123456)"
            autoFocus
            inputMode="numeric"
            maxLength={6}
          />
          {touched && !isValid && (
            <p className="text-sm text-red-600">Student ID must be exactly 6 digits.</p>
          )}
          <button
            type="submit"
            className="w-full rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-semibold py-2 transition-colors"
          >
            Start Level 1
          </button>
        </form>
      </div>
    </div>
  );
};

export default StudentIdModal;
