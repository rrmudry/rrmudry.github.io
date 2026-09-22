const fs = require('fs');
const path = require('path');
const { QUESTIONS } = require('./questions.js');

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Kinematic Velocity Calculator | v_f = v_o + at</title>
  
  <!-- CDNs for styling, icons, and libraries -->
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/lucide@latest"></script>
  <script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js"></script>

  <!-- Official Desmos Scientific Calculator API -->
  <script src="https://www.desmos.com/api/v1.9/calculator.js?apiKey=dcb31709b452b1cf9dc26972add0fda6"></script>

  <!-- Firebase SDK -->
  <script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-auth-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore-compat.js"></script>
  <script>
    const firebaseConfig = {
      projectId: "site-6e500",
      appId: "1:591530758858:web:1996cdca7316ffc3781a33",
      storageBucket: "site-6e500.firebasestorage.app",
      apiKey: "AIzaSyAji2nTjD2dbmzgk8gySWCy-aiQyKvR1i4",
      authDomain: "site-6e500.firebaseapp.com",
      messagingSenderId: "591530758858"
    };
    if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
    const fbAuth = firebase.auth();
    const fbDb = firebase.firestore();
  </script>
  
  <!-- Premium Fonts -->
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@100;300;400;600;700;900&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
  
  <style>
    :root {
      --bg: #070b1a;
      --bg-alt: #0e1328;
      --surface: rgba(13, 19, 40, 0.65);
      --border: rgba(120, 141, 255, 0.15);
      --accent: #0284c7;
      --accent-soft: #38bdf8;
      --accent-neon: #00f3ff;
      --accent-purple: #d946ef;
      --accent-emerald: #10b981;
      --accent-amber: #f59e0b;
    }
    
    body {
      font-family: 'Outfit', sans-serif;
      background-color: var(--bg);
      background-image: 
        radial-gradient(circle at top left, rgba(56, 189, 248, 0.08), transparent 55%),
        radial-gradient(circle at bottom right, rgba(217, 70, 239, 0.06), transparent 50%);
      color: #f8fafc;
      min-height: 100vh;
      overflow-x: hidden;
    }
    
    .mono {
      font-family: 'JetBrains Mono', monospace;
    }
    
    .glass {
      background: var(--surface);
      backdrop-filter: blur(16px);
      border: 1px solid var(--border);
    }
    
    .glass-highlight {
      background: rgba(255, 255, 255, 0.03);
      backdrop-filter: blur(8px);
      border: 1px solid rgba(255, 255, 255, 0.08);
    }

    .bg-grid {
      background-image: radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.015) 1px, transparent 0);
      background-size: 30px 30px;
    }

    /* custom scrollbar */
    ::-webkit-scrollbar {
      width: 6px;
    }
    ::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.02);
    }
    ::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 3px;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    /* Drag & Drop Visuals */
    .drag-target {
      transition: all 0.2s ease;
    }
    .drag-target.drag-over {
      border-color: var(--accent-neon);
      background: rgba(0, 243, 255, 0.1);
      box-shadow: 0 0 15px rgba(0, 243, 255, 0.2);
    }

    /* Fixed slot dimensions preventing wrapping under all viewport conditions */
    .equation-slot {
      width: 78px;
      height: 78px;
      flex-shrink: 0;
    }
    @media (min-width: 640px) {
      .equation-slot {
        width: 104px;
        height: 94px;
      }
    }
    @media (min-width: 768px) {
      .equation-slot {
        width: 120px;
        height: 100px;
      }
    }

    .glow-neon {
      box-shadow: 0 0 20px rgba(0, 243, 255, 0.25);
      border-color: var(--accent-neon);
    }

    /* Drag and drop item cursor states */
    .drag-item {
      cursor: grab;
      user-select: none;
    }
    .drag-item:active {
      cursor: grabbing;
    }

    .animate-shake {
      animation: shake 0.4s ease-in-out;
    }

    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      20%, 60% { transform: translateX(-6px); }
      40%, 80% { transform: translateX(6px); }
    }

    @keyframes levelPulse {
      0%, 100% {
        box-shadow: 0 0 5px rgba(245, 158, 11, 0.2);
        border-color: rgba(245, 158, 11, 0.3);
      }
      50% {
        box-shadow: 0 0 20px rgba(245, 158, 11, 0.7);
        border-color: rgba(245, 158, 11, 0.8);
      }
    }
    .pulse-amber {
      animation: levelPulse 1.5s infinite ease-in-out;
    }

    /* Print Certificate Styles */
    @media print {
      body {
        background: #ffffff !important;
        color: #000000 !important;
      }
      body * {
        visibility: hidden !important;
      }
      #modal-completion, #modal-completion * {
        visibility: visible !important;
      }
      #modal-completion {
        position: fixed !important;
        inset: 0 !important;
        background: #ffffff !important;
        padding: 0 !important;
        margin: 0 !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        backdrop-filter: none !important;
        z-index: 999999 !important;
      }
      .cert-card {
        background: #ffffff !important;
        color: #0f172a !important;
        border: 4px double #b45309 !important;
        box-shadow: none !important;
        width: 100% !important;
        max-width: 680px !important;
        padding: 24px !important;
      }
      .cert-card * {
        color: #0f172a !important;
        text-shadow: none !important;
      }
      .cert-card #cert-student-name {
        color: #b45309 !important;
      }
      .cert-card .cert-badge {
        background: #f8fafc !important;
        border: 1px solid #cbd5e1 !important;
      }
      .no-print {
        display: none !important;
      }
    }
  </style>
</head>
<body class="bg-grid min-h-screen flex flex-col relative overflow-hidden">

  <!-- Header -->
  <header class="w-full py-2 px-4 border-b border-white/5 bg-[#050917]/70 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between">
    <div class="flex items-center gap-3">
      <a href="../../index.html" class="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mr-2" title="Return to Dashboard">
        <i data-lucide="arrow-left" class="w-5 h-5"></i>
      </a>
      <div class="bg-sky-600/20 p-1.5 rounded-lg border border-sky-500/30">
        <i data-lucide="gauge" class="text-sky-400 w-5 h-5 animate-pulse"></i>
      </div>
      <div>
        <h1 class="text-lg font-bold tracking-tight">Kinematic Velocity <span class="text-sky-400">Calculator</span></h1>
        <p class="text-[10px] text-slate-400 font-medium">Linear Acceleration &bull; v<sub>f</sub> = v<sub>o</sub> + at</p>
      </div>
    </div>
    
    <!-- Student Badge -->
    <div id="student-badge" class="hidden flex items-center gap-4">
      <div class="glass px-2.5 py-1 rounded-lg border border-white/5 flex items-center gap-1.5">
        <img id="badge-avatar" src="" class="w-5 h-5 rounded-full hidden" alt="">
        <span class="text-[10px] text-slate-400">Signed in:</span>
        <span id="badge-id" class="text-xs font-bold mono text-sky-400">student</span>
      </div>
      <button onclick="logout()" class="text-slate-400 hover:text-rose-400 transition-colors p-1 rounded-md hover:bg-white/5" title="Exit Laboratory">
        <i data-lucide="log-out" class="w-3.5 h-3.5"></i>
      </button>
    </div>
  </header>

  <!-- Main View Container -->
  <main class="flex-grow flex items-center justify-center p-2 md:p-3 z-10">
    
    <!-- SECTION 1: GOOGLE SIGN-IN -->
    <section id="view-register" class="max-w-md w-full glass p-8 md:p-10 rounded-[2.5rem] border border-white/10 relative z-10 shadow-2xl transition-all duration-500">
      <div class="text-center space-y-6">
        <div class="bg-sky-600 w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto shadow-[0_0_40px_rgba(2,132,199,0.3)]">
          <i data-lucide="gauge" class="text-white w-10 h-10"></i>
        </div>
        <div>
          <h2 class="text-3xl font-black uppercase tracking-tight italic">Initialize <span class="text-sky-400">Lab Log</span></h2>
          <p class="text-slate-400 font-medium text-sm mt-2 leading-relaxed">Sign in with your school Google account to access your kinematic velocity equation practice.</p>
        </div>
        
        <div class="space-y-4 pt-2">
          <button id="btn-google-signin" type="button" onclick="handleGoogleSignIn()" class="w-full bg-white text-slate-900 py-4 rounded-2xl font-black uppercase tracking-widest hover:scale-[1.02] hover:bg-slate-100 transition-all flex items-center justify-center gap-3 shadow-2xl cursor-pointer">
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" class="w-5 h-5" alt="Google">
            Sign In with Google
          </button>
          <p class="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] leading-relaxed">
            Use your school-issued <span class="text-sky-400">@orangeusd.org</span> account
          </p>

          <div class="relative flex py-1 items-center">
            <div class="flex-grow border-t border-white/10"></div>
            <span class="flex-shrink mx-3 text-[10px] uppercase tracking-widest text-slate-500 font-bold">Or Instant Preview</span>
            <div class="flex-grow border-t border-white/10"></div>
          </div>

          <button id="btn-guest-preview" type="button" onclick="startGuestMode()" class="w-full bg-slate-800/90 hover:bg-slate-700 text-sky-300 border border-sky-500/30 hover:border-sky-400/50 py-3.5 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2.5 hover:scale-[1.02] shadow-lg cursor-pointer">
            <i data-lucide="eye" class="w-4 h-4 text-sky-400"></i>
            <span>Teacher Preview / Test Mode (No Login)</span>
          </button>
        </div>
        <p id="register-error" class="text-rose-400 text-xs font-bold uppercase tracking-wider hidden">Access denied &mdash; use your @orangeusd.org school account</p>
        <p id="register-status" class="text-sky-400 text-[10px] font-bold uppercase tracking-widest animate-pulse hidden">Connecting&hellip;</p>
      </div>
    </section>

    <!-- SECTION 2: WORKSPACE -->
    <section id="view-workspace" class="max-w-4xl w-full hidden flex flex-col gap-3.5 transition-all duration-500">
      
      <!-- Top Stats Bar -->
      <div class="flex flex-col md:flex-row justify-between items-center gap-3 glass p-2.5 rounded-xl border border-white/5">
        
        <!-- Level Select Buttons -->
        <div class="flex gap-2">
          <button id="btn-level-1" onclick="changeLevel(1)" class="px-3 py-1.5 text-xs rounded-lg font-bold transition-all bg-slate-800 text-slate-400 border border-white/5">Level 1</button>
          <button id="btn-level-2" onclick="changeLevel(2)" class="px-3 py-1.5 text-xs rounded-lg font-bold transition-all bg-slate-800 text-slate-400 border border-white/5 cursor-not-allowed" disabled>Level 2</button>
          <button id="btn-level-3" onclick="changeLevel(3)" class="px-3 py-1.5 text-xs rounded-lg font-bold transition-all bg-slate-800 text-slate-400 border border-white/5 cursor-not-allowed" disabled>Level 3</button>
        </div>
 
        <!-- Telemetry HUD -->
        <div class="flex items-center gap-3 sm:gap-5 text-xs text-slate-400 flex-wrap justify-center">
          <div>
            <span class="font-semibold block md:inline">Student:</span> 
            <span id="hud-student-id" class="text-white font-bold mono ml-1">—</span>
          </div>
          <div>
            <span class="font-semibold block md:inline">Progress:</span> 
            <span id="hud-answered" class="text-white font-bold mono ml-1">0 / 6 Completed</span>
          </div>
          <div id="hud-streak-container">
            <span class="font-semibold block md:inline">Streak:</span> 
            <span id="hud-streak" class="text-white font-bold mono ml-1">0 / 4</span>
          </div>
          <div id="hud-cloud-status" class="flex items-center gap-1.5 text-[10px] text-emerald-400 bg-emerald-950/70 border border-emerald-500/30 px-2.5 py-1 rounded-lg transition-all font-mono">
            <i data-lucide="cloud-check" class="w-3.5 h-3.5 text-emerald-400"></i>
            <span id="hud-cloud-text">Auto-Saved</span>
          </div>
          <button id="btn-view-cert" onclick="openCompletionCertificateModal()" type="button" class="hidden px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer" title="View your earned Certificate of Kinematic Mastery">
            <span>🏆</span> View Certificate
          </button>
        </div>
      </div>
 
      <!-- Question Progress Bar -->
      <div class="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-white/5">
        <div id="progress-bar-fill" class="h-full bg-sky-500 transition-all duration-500 ease-out" style="width: 0%;"></div>
      </div>
 
      <!-- Workspace Layout Container (collapsible sidebar) -->
      <div class="flex flex-col lg:flex-row gap-4 items-start w-full">
         
         <!-- Main Interaction Area (Full Width Column) -->
         <div class="flex-grow w-full min-w-0 flex flex-col gap-3.5">

            <!-- Card 1: Word Problem Card & TTS Button -->
            <div class="glass rounded-xl p-4 sm:p-5 border border-white/5 flex flex-col justify-center relative min-h-[95px]">
              <button onclick="readQuestionAloud()" id="btn-tts" class="absolute top-3 right-3 p-1.5 rounded-full transition-all duration-200 bg-slate-800/80 text-slate-400 hover:text-white border border-white/5" title="Read Aloud">
                <i data-lucide="volume-2" class="w-4 h-4"></i>
              </button>
              
              <p id="question-text" class="text-base sm:text-lg font-semibold leading-relaxed text-slate-100 pr-8 text-center">
                <!-- Inline values and unknown will be rendered here dynamically -->
              </p>
            </div>

            <!-- Card 2: Full-Width Equation Arranging Board (NEVER WRAPS) -->
            <div class="glass rounded-xl p-3 sm:p-4 border border-white/5 flex flex-col items-center justify-center w-full shadow-lg">
              
              <!-- Equation Scroll Container: Strictly horizontal with flex-nowrap -->
              <div class="w-full flex items-center justify-center overflow-x-auto py-2 px-1">
                <div class="flex items-center justify-center gap-1.5 sm:gap-2.5 md:gap-3.5 font-mono flex-nowrap shrink-0 select-none">
                  
                  <!-- vf Slot (Final Velocity) -->
                  <div 
                    data-slot="vf" 
                    class="drag-target equation-slot bg-slate-950/80 rounded-xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center text-sm font-semibold select-none cursor-pointer transition-all"
                    onclick="handleSlotClick(this)"
                  >
                    <span class="text-slate-500 text-lg sm:text-2xl md:text-3xl font-mono select-none">v<sub>f</sub></span>
                    <span class="text-[7.5px] sm:text-[9px] text-slate-600 font-sans tracking-wider uppercase font-semibold select-none mt-0.5">final vel</span>
                  </div>

                  <span class="font-sans text-slate-400 font-bold select-none text-lg sm:text-2xl md:text-3xl px-0.5 shrink-0">=</span>

                  <!-- vo Slot (Initial Velocity) -->
                  <div 
                    data-slot="vo" 
                    class="drag-target equation-slot bg-slate-950/80 rounded-xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center text-sm font-semibold select-none cursor-pointer transition-all"
                    onclick="handleSlotClick(this)"
                  >
                    <span class="text-slate-500 text-lg sm:text-2xl md:text-3xl font-mono select-none">v<sub>o</sub></span>
                    <span class="text-[7.5px] sm:text-[9px] text-slate-600 font-sans tracking-wider uppercase font-semibold select-none mt-0.5">initial vel</span>
                  </div>

                  <span class="font-sans text-slate-400 font-bold select-none text-lg sm:text-2xl md:text-3xl px-0.5 shrink-0">+</span>

                  <!-- a Slot (Acceleration) -->
                  <div 
                    data-slot="a" 
                    class="drag-target equation-slot bg-slate-950/80 rounded-xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center text-sm font-semibold select-none cursor-pointer transition-all"
                    onclick="handleSlotClick(this)"
                  >
                    <span class="text-slate-500 text-lg sm:text-2xl md:text-3xl font-mono select-none">a</span>
                    <span class="text-[7.5px] sm:text-[9px] text-slate-600 font-sans tracking-wider uppercase font-semibold select-none mt-0.5">accel</span>
                  </div>

                  <span class="font-sans text-slate-400 font-bold select-none text-lg sm:text-2xl md:text-3xl px-0.5 shrink-0">&middot;</span>

                  <!-- t Slot (Time) -->
                  <div 
                    data-slot="t" 
                    class="drag-target equation-slot bg-slate-950/80 rounded-xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center text-sm font-semibold select-none cursor-pointer transition-all"
                    onclick="handleSlotClick(this)"
                  >
                    <span class="text-slate-500 text-lg sm:text-2xl md:text-3xl font-mono select-none">t</span>
                    <span class="text-[7.5px] sm:text-[9px] text-slate-600 font-sans tracking-wider uppercase font-semibold select-none mt-0.5">time</span>
                  </div>

                </div>
              </div>

              <!-- Selection helper text -->
              <div id="selection-helper" class="text-center text-[10px] sm:text-[11px] text-slate-400 font-semibold h-4 select-none mt-1">
                <!-- Selected item details -->
              </div>
            </div>

            <!-- Card 3: Action Controls & Feedback Grid -->
            <div class="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-stretch">
              
              <!-- LEFT: Feedback Message Box & Desmos Telemetry (md:col-span-7) -->
              <div class="md:col-span-7 flex flex-col gap-3">
                
                <!-- Feedback Message box -->
                <div id="feedback-box" class="glass rounded-xl p-3 text-center font-bold text-xs min-h-[48px] flex items-center justify-center border border-white/5">
                  Place the given values and unknown term into the equation, then check your work.
                </div>

                <!-- Calculation input helper (For Level 2 & 3) -->
                <div id="calc-input-helper" class="glass rounded-xl p-3.5 border border-white/5 flex flex-col hidden">
                  <div class="flex items-center justify-between gap-2">
                    <div>
                      <span class="text-[9px] text-sky-400 uppercase tracking-widest block font-bold">Calculation Telemetry</span>
                      <p class="text-[11px] text-slate-400 mt-0.5 leading-relaxed">Calculate in Desmos, then paste or enter your result below.</p>
                    </div>
                    <span id="telemetry-req-badge" class="text-[8px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 uppercase tracking-wider">
                      Desmos Required
                    </span>
                  </div>
                  
                  <div class="my-2.5 flex flex-col sm:flex-row gap-2">
                    <input 
                      type="number" 
                      step="0.01" 
                      id="manual-user-answer" 
                      placeholder="Enter result..." 
                      oninput="syncManualInput(this.value)"
                      class="flex-1 bg-slate-950/85 text-white py-2.5 px-3 rounded-xl border border-white/10 text-center font-bold tracking-wide text-lg focus:border-sky-500 focus:outline-none transition-all mono placeholder:font-normal placeholder:text-slate-600"
                    >
                    <button 
                      id="btn-paste-desmos-input"
                      type="button" 
                      onclick="pasteDesmosResult()" 
                      class="sm:w-auto px-4 py-2.5 bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 text-white rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md hover:scale-[1.01] active:scale-95 border border-sky-400/30 cursor-pointer shrink-0"
                      title="Paste latest calculated value from Desmos"
                    >
                      <i data-lucide="clipboard-paste" class="w-4 h-4 text-cyan-200"></i>
                      <span>Paste Desmos</span>
                    </button>
                  </div>

                  <div id="calc-telemetry-status" class="text-[10px] text-slate-400 font-mono text-center min-h-[16px]">
                    Use the Desmos calculator on the right to compute your answer.
                  </div>
                </div>

              </div>

              <!-- RIGHT: Action Buttons & Utilities (md:col-span-5) -->
              <div class="md:col-span-5 flex flex-col gap-2 justify-between">
                <div class="flex flex-col gap-2">
                  <button id="btn-check-answer" onclick="checkCurrentAnswer()" class="w-full bg-sky-600 hover:bg-sky-500 text-white font-black py-2.5 px-4 rounded-xl transition-all shadow-lg text-xs uppercase tracking-wider cursor-pointer">
                    Check Answer
                  </button>
                  <button onclick="resetWorkspace()" class="w-full bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold py-2.5 px-4 rounded-xl transition-all border border-white/5 text-xs uppercase tracking-wider cursor-pointer">
                    Reset Workspace
                  </button>
                  <button id="btn-next-question" onclick="nextQuestion()" class="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-2.5 px-4 rounded-xl transition-all shadow-lg text-xs uppercase tracking-wider hidden cursor-pointer">
                    Next Question
                  </button>
                </div>
                
                <!-- Utility Bar: Help & Calculator buttons -->
                <div class="grid grid-cols-2 gap-2 mt-1">
                  <button onclick="toggleHelpModal(true)" class="bg-slate-900 hover:bg-slate-800 text-slate-300 py-2.5 rounded-xl border border-white/5 font-semibold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 cursor-pointer">
                    <i data-lucide="help-circle" class="w-4 h-4"></i> Help Guide
                  </button>
                  <button onclick="toggleCalculatorModal(true)" class="bg-slate-900 hover:bg-slate-800 text-slate-300 py-2.5 rounded-xl border border-white/5 font-semibold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 cursor-pointer">
                    <i data-lucide="calculator" class="w-4 h-4"></i> Calculator
                  </button>
                </div>
              </div>

            </div>

         </div>

         <!-- Calculator Sidebar Panel -->
         <div id="modal-calculator" class="w-full lg:w-[410px] flex-shrink-0 hidden transition-all duration-300">
           <div id="desmos-card-wrapper" class="bg-slate-900 border border-white/10 shadow-2xl rounded-2xl overflow-hidden lg:sticky lg:top-24">
             
             <!-- Titlebar -->
             <div class="flex items-center justify-between px-3.5 py-2.5 bg-slate-800 text-white rounded-t-2xl select-none">
               <div class="flex items-center gap-2 text-slate-300">
                 <i data-lucide="calculator" class="w-4 h-4 text-sky-400"></i>
                 <span class="text-xs font-bold uppercase tracking-wider font-sans">Desmos Scientific</span>
                 <span id="desmos-status-badge" class="text-[8px] font-bold text-sky-300 bg-sky-950/80 px-2 py-0.5 rounded border border-sky-500/30 uppercase tracking-wider font-mono">STANDBY</span>
               </div>
               <div class="flex items-center gap-2">
                 <button id="btn-desmos-paste-header" onclick="pasteDesmosResult()" type="button" class="hidden px-2 py-1 rounded-md bg-sky-600 hover:bg-sky-500 text-white text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center gap-1" title="Paste result into answer box">
                   <i data-lucide="clipboard-paste" class="w-3 h-3"></i> Paste
                 </button>
                 <button onclick="toggleCalculatorModal(false)" class="text-slate-400 hover:text-white p-1 rounded hover:bg-white/10 transition-colors" title="Collapse Calculator">
                   <i data-lucide="x" class="w-4 h-4"></i>
                 </button>
               </div>
             </div>

             <!-- Calculator Body -->
             <div class="p-0.5 bg-slate-900 overflow-hidden">
               <div id="desmos-calculator-container" class="w-full h-[400px] bg-white rounded-b-xl overflow-hidden"></div>
             </div>

             <!-- Calculator Footer Action Bar -->
             <div id="desmos-footer-action" class="px-3.5 py-2.5 bg-slate-800/90 border-t border-white/10 flex items-center justify-between gap-2">
               <span id="desmos-live-feedback" class="text-[11px] text-slate-300 font-mono truncate">Ready for calculation...</span>
               <button onclick="pasteDesmosResult()" type="button" class="px-3 py-1.5 bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 text-white text-xs font-bold uppercase tracking-wider rounded-lg flex items-center gap-1.5 transition-all shadow-md hover:scale-[1.02] active:scale-95 flex-shrink-0 border border-sky-400/30">
                 <i data-lucide="clipboard-paste" class="w-3.5 h-3.5"></i> Paste Result
               </button>
             </div>

           </div>
         </div>

      </div>

    </section>

  </main>

  <!-- HELP GUIDE MODAL (Understanding the Kinematic Equation) -->
  <div id="modal-help" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 hidden">
    <div class="bg-slate-900 border border-white/10 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl relative">
      <div class="flex items-center justify-between border-b border-white/5 pb-3">
        <h3 class="text-lg font-bold text-white flex items-center gap-2">
          <i data-lucide="help-circle" class="w-5 h-5 text-sky-400"></i>
          Formula Rearrangement Guide
        </h3>
        <button onclick="toggleHelpModal(false)" class="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors">
          <i data-lucide="x" class="w-6 h-6"></i>
        </button>
      </div>

      <p class="text-slate-400 text-sm leading-relaxed">
        Click a physical variable below to see its base equation and understand how <strong>v<sub>f</sub> = v<sub>o</sub> + at</strong> is algebraically rearranged to solve for each term.
      </p>

      <!-- Formula Variable Selector -->
      <div class="grid grid-cols-4 gap-2 py-2">
        <button onclick="selectHelpVariable('vf')" id="btn-help-vf" class="py-3 rounded-xl font-bold text-center border transition-all text-base mono">v<sub>f</sub><span class="block text-[9px] font-sans font-normal text-slate-500 uppercase not-italic tracking-wider mt-0.5">Final</span></button>
        <button onclick="selectHelpVariable('vo')" id="btn-help-vo" class="py-3 rounded-xl font-bold text-center border transition-all text-base mono">v<sub>o</sub><span class="block text-[9px] font-sans font-normal text-slate-500 uppercase not-italic tracking-wider mt-0.5">Initial</span></button>
        <button onclick="selectHelpVariable('a')" id="btn-help-a" class="py-3 rounded-xl font-bold text-center border transition-all text-base mono">a<span class="block text-[9px] font-sans font-normal text-slate-500 uppercase not-italic tracking-wider mt-0.5">Accel</span></button>
        <button onclick="selectHelpVariable('t')" id="btn-help-t" class="py-3 rounded-xl font-bold text-center border transition-all text-base mono">t<span class="block text-[9px] font-sans font-normal text-slate-500 uppercase not-italic tracking-wider mt-0.5">Time</span></button>
      </div>

      <!-- Dynamic Formula Display Panel -->
      <div class="bg-slate-950 border border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center min-h-[140px]">
        <div id="help-equation-render" class="text-2xl sm:text-3xl font-mono text-white flex items-center gap-3">
          <!-- Dynamic equation goes here -->
        </div>
        <p id="help-equation-desc" class="text-slate-400 text-xs text-center mt-3 max-w-sm">
          <!-- Dynamic description goes here -->
        </p>
      </div>

      <div class="text-center pt-2">
        <button onclick="toggleHelpModal(false)" class="bg-white text-black py-3 px-8 rounded-xl font-black uppercase tracking-wider hover:bg-slate-200 transition-all text-xs">
          Close Help
        </button>
      </div>
    </div>
  </div>

  <!-- LEVEL UNLOCKED MODAL -->
  <div id="modal-level-unlocked" class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md px-4 hidden transition-opacity duration-300">
    <div class="w-full max-w-sm bg-slate-900 border border-white/10 shadow-2xl rounded-3xl p-6 space-y-6 text-center transform scale-95 transition-all duration-300">
      
      <div class="bg-amber-500/10 text-amber-400 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto border border-amber-500/20 shadow-[0_0_30px_rgba(245,158,11,0.15)] animate-bounce">
        <i data-lucide="unlock" class="w-8 h-8"></i>
      </div>
      
      <div>
        <h2 class="text-2xl font-black tracking-tight text-white uppercase italic">Level Unlocked!</h2>
        <p id="unlock-level-title" class="text-amber-400 font-bold text-sm mt-1">LEVEL 2 IS NOW ACCESSIBLE</p>
      </div>

      <div class="w-full h-px bg-white/10"></div>

      <p id="unlock-level-description" class="text-slate-400 text-xs leading-relaxed">
        Place kinematic values and calculate numerical answers using the integrated Desmos Scientific Calculator.
      </p>

      <div class="flex flex-col gap-2 pt-2">
        <button id="btn-start-unlocked-level" onclick="startUnlockedLevel()" class="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-extrabold transition-all text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-1.5 hover:scale-[1.02]">
          Go to Level <span id="unlock-level-num">2</span> <i data-lucide="arrow-right" class="w-4 h-4"></i>
        </button>
        <button onclick="closeUnlockModal()" class="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition-all text-xs uppercase tracking-wider border border-white/5">
          Keep Practicing
        </button>
      </div>

    </div>
  </div>

  <!-- COMPLETION CERTIFICATE MODAL -->
  <div id="modal-completion" class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md px-3 sm:px-4 hidden transition-opacity duration-300 overflow-y-auto py-6">
    <div class="cert-card w-full max-w-2xl bg-gradient-to-b from-slate-900 via-[#0a1026] to-slate-950 border-2 border-amber-500/40 shadow-2xl rounded-3xl p-6 sm:p-8 space-y-5 text-center relative overflow-hidden my-auto">
      
      <!-- Top Decorative Gradient Ribbon -->
      <div class="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-500 via-sky-400 to-amber-500"></div>

      <!-- Close Button -->
      <button onclick="closeCompletionModal(false)" class="no-print absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer" title="Close Certificate">
        <i data-lucide="x" class="w-5 h-5"></i>
      </button>

      <!-- Certificate Header -->
      <div class="space-y-1.5 pt-1">
        <div class="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-3xl shadow-lg shadow-amber-500/10 mb-1">
          🏆
        </div>
        <div class="text-[10px] sm:text-[11px] font-mono uppercase tracking-[0.25em] text-amber-400 font-bold">
          Orange High School Physics Laboratory
        </div>
        <h2 class="text-2xl sm:text-3xl font-black tracking-tight text-white uppercase italic">
          Certificate of Kinematic Velocity Mastery
        </h2>
        <p class="text-slate-400 text-xs sm:text-sm font-medium">
          Linear Acceleration &amp; Velocity Problem-Solving Core &bull; v<sub>f</sub> = v<sub>o</sub> + at
        </p>
      </div>

      <!-- Golden Divider -->
      <div class="w-full h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent"></div>

      <!-- Recipient -->
      <div class="space-y-1 py-0.5">
        <p class="text-slate-400 text-[11px] uppercase tracking-widest font-semibold">This certifies that</p>
        <div id="cert-student-name" class="text-2xl sm:text-3xl font-black text-amber-300 tracking-wide font-sans py-0.5">
          Student Name
        </div>
        <p class="text-slate-400 text-xs mono">
          Student Account: <span id="cert-student-id" class="text-white font-bold">000000</span>
        </p>
      </div>

      <!-- Citation -->
      <p class="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-lg mx-auto">
        has successfully demonstrated quantitative problem-solving mastery in formulating and computing linear kinematic values for 
        <strong class="text-emerald-400">Final Velocity (v<sub>f</sub> = v<sub>o</sub> + at)</strong>, 
        <strong class="text-sky-400">Initial Velocity (v<sub>o</sub> = v<sub>f</sub> - at)</strong>, 
        <strong class="text-amber-400">Acceleration (a = [v<sub>f</sub> - v<sub>o</sub>] / t)</strong>, and 
        <strong class="text-purple-400">Time (t = [v<sub>f</sub> - v<sub>o</sub>] / a)</strong> 
        across all three scaffolded tiers with scientific precision.
      </p>

      <!-- Performance Badges Grid -->
      <div class="grid grid-cols-3 gap-2 sm:gap-3 max-w-md mx-auto">
        <div class="cert-badge p-2.5 rounded-xl bg-slate-900/80 border border-white/10 text-center">
          <span class="text-[9px] uppercase tracking-wider text-slate-400 block font-bold">Tier 1: Formula</span>
          <span class="text-xs font-bold text-emerald-400 mt-1 block">Mastered ✓</span>
        </div>
        <div class="cert-badge p-2.5 rounded-xl bg-slate-900/80 border border-white/10 text-center">
          <span class="text-[9px] uppercase tracking-wider text-slate-400 block font-bold">Tier 2: Desmos</span>
          <span class="text-xs font-bold text-emerald-400 mt-1 block">Mastered ✓</span>
        </div>
        <div class="cert-badge p-2.5 rounded-xl bg-slate-900/80 border border-white/10 text-center">
          <span class="text-[9px] uppercase tracking-wider text-slate-400 block font-bold">Tier 3: Final Score</span>
          <span id="cert-score" class="text-xs font-bold text-amber-300 mono mt-1 block">6 / 6</span>
        </div>
      </div>

      <!-- Automatic Cloud Save Indication Box -->
      <div class="p-3 bg-emerald-950/70 border border-emerald-500/40 rounded-2xl flex items-center justify-center gap-3 text-emerald-300 text-left max-w-lg mx-auto shadow-lg shadow-emerald-950/40">
        <div class="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0 text-emerald-400">
          <i data-lucide="cloud-check" class="w-5 h-5"></i>
        </div>
        <div>
          <div class="text-xs font-bold text-emerald-200 flex items-center gap-1.5">
            <span>Score Automatically Saved to Teacher Gradebook</span>
            <span class="text-[9px] font-mono bg-emerald-500/20 px-1.5 py-0.5 rounded text-emerald-300 border border-emerald-500/30">CONFIRMED ✓</span>
          </div>
          <div class="text-[11px] text-emerald-300/85 leading-snug mt-0.5">
            Your results have been automatically recorded in Firestore. No screenshot or manual turn-in is required!
          </div>
        </div>
      </div>

      <!-- Certificate Metadata & Verification Code -->
      <div class="flex flex-col sm:flex-row items-center justify-between gap-1.5 text-[10px] text-slate-400 mono border-t border-white/10 pt-3">
        <div>Date: <span id="cert-date" class="text-slate-200 font-bold">—</span></div>
        <div>Standard: <span class="text-slate-200 font-bold">NGSS HS-PS2-1</span></div>
        <div>Token: <span id="cert-token" class="text-slate-200 select-all font-bold">—</span></div>
      </div>

      <!-- Action Buttons -->
      <div class="no-print flex flex-col sm:flex-row gap-2.5 justify-center pt-1">
        <button onclick="window.print()" class="flex-1 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 rounded-xl font-bold transition-all text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer">
          <i data-lucide="printer" class="w-4 h-4"></i> Print / Save PDF
        </button>
        <button onclick="closeCompletionModal(true)" class="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold transition-all text-xs uppercase tracking-wider border border-white/10 cursor-pointer">
          Practice Again
        </button>
      </div>

    </div>
  </div>

  <!-- Footer -->
  <footer class="w-full py-2 text-center border-t border-white/5 bg-[#050917]/70 backdrop-blur-md text-[10px] text-slate-500 select-none z-10">
    &copy; 2026 Mr. Mudry's Physics Science Laboratory &bull; Kinematic Velocity Problem-Solving Core &bull; v<sub>f</sub> = v<sub>o</sub> + at
  </footer>

  <!-- Web Audio Synthesizer & Game Control Logic -->
  <script>
    // -------------------------------------------------------------
    // AUDIO SYNTHESIZER (Web Audio API)
    // -------------------------------------------------------------
    class SynthManager {
      constructor() {
        this.ctx = null;
      }

      init() {
        if (!this.ctx) {
          const AudioContext = window.AudioContext || window.webkitAudioContext;
          this.ctx = new AudioContext();
        }
        if (this.ctx.state === 'suspended') {
          this.ctx.resume();
        }
      }

      playBeep() {
        this.init();
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.12);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.12);
      }

      playSuccess() {
        this.init();
        if (!this.ctx) return;
        
        const now = this.ctx.currentTime;
        const playNote = (freq, delay, dur) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.connect(gain);
          gain.connect(this.ctx.destination);

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + delay);
          gain.gain.setValueAtTime(0, now + delay);
          gain.gain.linearRampToValueAtTime(0.12, now + delay + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + dur);

          osc.start(now + delay);
          osc.stop(now + delay + dur);
        };

        playNote(261.63, 0, 0.4);      // C4
        playNote(329.63, 0.08, 0.4);   // E4
        playNote(392.00, 0.16, 0.4);   // G4
        playNote(523.25, 0.24, 0.6);   // C5
      }

      playError() {
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.linearRampToValueAtTime(110, now + 0.35);

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

        osc.start();
        osc.stop(now + 0.35);
      }

      playCombo() {
        this.init();
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.15);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.15);
      }
    }

    const sound = new SynthManager();

    // -------------------------------------------------------------
    // QUESTIONS DATABASE (50 Curated Problems)
    // -------------------------------------------------------------
    const QUESTIONS = ${JSON.stringify(QUESTIONS)};

    // -------------------------------------------------------------
    // SPEECH SYNTHESIS ACCESSIBILITY
    // -------------------------------------------------------------
    class SpeechManager {
      constructor() {
        this.synth = window.speechSynthesis;
        this.speaking = false;
        this.utterance = null;
      }

      speak(text) {
        if (!this.synth) {
          console.warn("Speech synthesis not supported.");
          return;
        }
        
        this.cancel();
        
        // Expand abbreviations to make it sound natural and clear
        let cleanText = text;
        const expansions = {
          "m/s²": "meters per second squared",
          "m/s2": "meters per second squared",
          "m/s": "meters per second",
          "km/h/s": "kilometers per hour per second",
          "km/h": "kilometers per hour",
          "mph": "miles per hour",
          "s": "seconds",
          "h": "hours",
          "vf": "final velocity",
          "v_f": "final velocity",
          "vo": "initial velocity",
          "v_o": "initial velocity"
        };
        
        for (let key in expansions) {
          const regex = new RegExp(\`\\\\b\${key}\\\\b\`, 'g');
          cleanText = cleanText.replace(regex, expansions[key]);
        }

        this.utterance = new SpeechSynthesisUtterance(cleanText);
        this.utterance.onstart = () => {
          this.speaking = true;
          this.updateSpeakButton();
        };
        this.utterance.onend = () => {
          this.speaking = false;
          this.updateSpeakButton();
        };
        this.utterance.onerror = () => {
          this.speaking = false;
          this.updateSpeakButton();
        };

        this.synth.speak(this.utterance);
      }

      cancel() {
        if (this.synth && this.synth.speaking) {
          this.synth.cancel();
        }
        this.speaking = false;
        this.updateSpeakButton();
      }

      updateSpeakButton() {
        const btn = document.getElementById("btn-tts");
        if (!btn) return;
        if (this.speaking) {
          btn.innerHTML = \`<i data-lucide="square" class="w-5 h-5 text-rose-500"></i>\`;
          btn.classList.add("ring-2", "ring-rose-500/50");
          btn.title = "Stop reading aloud";
        } else {
          btn.innerHTML = \`<i data-lucide="volume-2" class="w-5 h-5"></i>\`;
          btn.classList.remove("ring-2", "ring-rose-500/50");
          btn.title = "Read aloud";
        }
        lucide.createIcons();
      }
    }

    const speech = new SpeechManager();

    // -------------------------------------------------------------
    // DESMOS INTEGRATION
    // -------------------------------------------------------------
    let desmosLoaded = false;
    let desmosCalculator = null;
    let isCurrentQuestionSolved = false;

    function initDesmos() {
      const container = document.getElementById('desmos-calculator-container');
      if (!container) return;

      if (window.Desmos && !desmosCalculator) {
        try {
          desmosCalculator = Desmos.ScientificCalculator(container, {
            fontSize: Desmos.FontSizes.SMALL,
            keypad: true,
            settingsMenu: false
          });
          desmosLoaded = true;

          desmosCalculator.observeEvent('change', () => {
            onDesmosChange();
          });

          onDesmosChange();
        } catch (err) {
          console.error("Desmos init error:", err);
        }
      } else if (!window.Desmos && !desmosLoaded) {
        setTimeout(() => {
          if (window.Desmos && !desmosCalculator) initDesmos();
        }, 400);
      }
    }

    function getDesmosExpressions() {
      if (!desmosCalculator) return [];
      try {
        const calcState = desmosCalculator.getState();
        return calcState?.expressions?.list || [];
      } catch (e) {
        return [];
      }
    }

    function evaluateLatex(latex) {
      if (!latex) return null;
      let s = latex
        .replace(/\\\\frac\\{([^}]+)\\}\\{([^}]+)\\}/g, "($1)/($2)")
        .replace(/\\\\cdot|\\\\times/g, "*")
        .replace(/\\\\div/g, "/")
        .replace(/\\\\left\\(/g, "(")
        .replace(/\\\\right\\)/g, ")")
        .replace(/\\\\sqrt\\{([^}]+)\\}/g, "Math.sqrt($1)")
        .replace(/\\^\\{([^}]+)\\}/g, "**($1)")
        .replace(/\\^([0-9]+)/g, "**$1")
        .replace(/[^0-9+\\-*\\/().Mathsqrt]/g, "");
      try {
        const val = Function('"use strict"; return (' + s + ')')();
        return typeof val === "number" && !isNaN(val) && isFinite(val) ? val : null;
      } catch (e) {
        return null;
      }
    }

    function evaluateExpressionItem(item) {
      if (!item || !item.latex) return null;
      if (desmosCalculator && typeof desmosCalculator.HelperExpression === 'function') {
        try {
          const helper = desmosCalculator.HelperExpression({ latex: item.latex });
          if (typeof helper.numericValue === 'number' && !isNaN(helper.numericValue) && isFinite(helper.numericValue)) {
            return helper.numericValue;
          }
        } catch (e) {}
      }
      return evaluateLatex(item.latex);
    }

    function getDesmosLatestCalculation() {
      const list = getDesmosExpressions();
      for (let i = list.length - 1; i >= 0; i--) {
        const item = list[i];
        if (!item || !item.latex) continue;
        const val = evaluateExpressionItem(item);
        if (val !== null && !isNaN(val) && isFinite(val)) {
          return {
            latex: item.latex,
            value: val
          };
        }
      }
      return null;
    }

    function onDesmosChange() {
      const calc = getDesmosLatestCalculation();
      const statusBadge = document.getElementById('desmos-status-badge');
      const liveFeedback = document.getElementById('desmos-live-feedback');
      const pasteHeaderBtn = document.getElementById('btn-desmos-paste-header');
      const telemetryReqBadge = document.getElementById('telemetry-req-badge');
      const telemetryStatus = document.getElementById('calc-telemetry-status');

      if (calc && typeof calc.value === 'number' && !isNaN(calc.value)) {
        const rounded = Number(calc.value.toFixed(2));
        if (statusBadge) {
          statusBadge.textContent = "RESULT: " + rounded;
          statusBadge.className = "text-[8px] font-bold text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/40 uppercase tracking-wider font-mono";
        }
        if (liveFeedback) {
          liveFeedback.textContent = "Computed: " + rounded;
          liveFeedback.className = "text-[11px] text-emerald-400 font-mono font-bold truncate";
        }
        if (pasteHeaderBtn) pasteHeaderBtn.classList.remove('hidden');
        if (telemetryReqBadge) {
          telemetryReqBadge.textContent = "CALCULATION READY ✓";
          telemetryReqBadge.className = "text-[8px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 uppercase tracking-wider";
        }
        if (telemetryStatus) {
          telemetryStatus.innerHTML = \`Desmos Result: <span class="text-emerald-400 font-bold">\${rounded}</span> (click Paste Desmos to insert)\`;
        }
      } else {
        if (statusBadge) {
          statusBadge.textContent = state && state.currentLevel >= 2 ? "WORK REQUIRED" : "STANDBY";
          statusBadge.className = state && state.currentLevel >= 2 ?
            "text-[8px] font-bold text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/40 uppercase tracking-wider font-mono" :
            "text-[8px] font-bold text-sky-300 bg-sky-950/80 px-2 py-0.5 rounded border border-sky-500/30 uppercase tracking-wider font-mono";
        }
        if (liveFeedback) {
          liveFeedback.textContent = "Ready for calculation...";
          liveFeedback.className = "text-[11px] text-slate-400 font-mono truncate";
        }
        if (pasteHeaderBtn) pasteHeaderBtn.classList.add('hidden');
        if (telemetryReqBadge) {
          telemetryReqBadge.textContent = "DESMOS REQUIRED";
          telemetryReqBadge.className = "text-[8px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 uppercase tracking-wider";
        }
        if (telemetryStatus) {
          telemetryStatus.textContent = "Use the Desmos calculator on the right to compute your answer.";
        }
      }
      if (window.lucide) lucide.createIcons();
    }

    function pasteDesmosResult() {
      const calc = getDesmosLatestCalculation();
      const feedbackBox = document.getElementById('feedback-box');
      if (!calc || typeof calc.value !== 'number' || isNaN(calc.value)) {
        sound.playError();
        if (feedbackBox) {
          feedbackBox.innerText = "No calculated result found in Desmos yet. Enter your calculation in Desmos first!";
          feedbackBox.className = "glass rounded-xl p-3 text-center font-bold text-amber-400 text-xs min-h-[48px] flex items-center justify-center border border-amber-500/30 animate-shake";
        }
        toggleCalculatorModal(true);
        return;
      }

      sound.playBeep();
      const rounded = Number(calc.value.toFixed(2));

      // 1. Populate manual telemetry input
      const manualInput = document.getElementById('manual-user-answer');
      if (manualInput) {
        manualInput.value = rounded;
        manualInput.focus();
      }

      // 2. Populate equation inline slot input if present
      const inlineInput = document.getElementById('equation-inline-input');
      if (inlineInput) {
        inlineInput.value = rounded;
      }

      // 3. Telemetry feedback
      const telemetryStatus = document.getElementById('calc-telemetry-status');
      if (telemetryStatus) {
        telemetryStatus.innerHTML = \`<span class="text-emerald-400 font-bold">Pasted \${rounded} from Desmos ✓</span>\`;
      }

      if (feedbackBox) {
        feedbackBox.innerText = \`Pasted \${rounded} into your answer box. Click Check Answer to verify!\`;
        feedbackBox.className = "glass rounded-xl p-3 text-center font-bold text-sky-300 text-xs min-h-[48px] flex items-center justify-center border border-sky-500/20";
      }
    }

    function syncManualInput(val) {
      const inlineInput = document.getElementById('equation-inline-input');
      if (inlineInput && inlineInput.value !== val) {
        inlineInput.value = val;
      }
    }

    function verifyDesmosWork(q, exactVal) {
      if (!state || state.currentLevel < 2) return true;
      const calc = getDesmosLatestCalculation();
      if (!calc || typeof calc.value !== 'number' || isNaN(calc.value)) {
        return false;
      }

      // 1. Check if latest evaluated result is within tolerance of exact answer
      const delta = Math.abs(calc.value - exactVal);
      if (delta <= TOLERANCE || (exactVal !== 0 && delta / Math.abs(exactVal) <= 0.05)) {
        return true;
      }

      // 2. Check all expressions in Desmos state
      if (desmosCalculator) {
        try {
          const list = getDesmosExpressions();
          for (let item of list) {
            if (!item || !item.latex) continue;
            const evaluated = evaluateExpressionItem(item);
            if (evaluated !== null && !isNaN(evaluated)) {
              if (Math.abs(evaluated - exactVal) <= TOLERANCE || (exactVal !== 0 && Math.abs(evaluated - exactVal) / Math.abs(exactVal) <= 0.05)) {
                return true;
              }
            }
          }
        } catch (e) {}
      }

      return false;
    }

    // -------------------------------------------------------------
    // HELP MODAL FORMULA EXPLANATIONS
    // -------------------------------------------------------------
    let helpVariable = 'vf';

    function selectHelpVariable(vName) {
      sound.playBeep();
      helpVariable = vName;
      
      const vars = ['vf', 'vo', 'a', 't'];
      vars.forEach(v => {
        const btn = document.getElementById(\`btn-help-\${v}\`);
        if (v === vName) {
          btn.className = "py-3 rounded-xl font-bold text-center border-2 border-sky-500 bg-sky-600/10 text-sky-400 transition-all text-base mono glow-neon";
        } else {
          btn.className = "py-3 rounded-xl font-bold text-center border border-white/5 bg-slate-900/60 hover:bg-slate-800 text-slate-400 transition-all text-base mono";
        }
      });

      const equationRender = document.getElementById('help-equation-render');
      const equationDesc = document.getElementById('help-equation-desc');
      
      if (vName === 'vf') {
        equationRender.innerHTML = \`
          <span class="text-emerald-400">v<sub>f</sub></span>
          <span class="font-sans text-slate-500">=</span>
          <span class="text-sky-400">v<sub>o</sub></span>
          <span class="font-sans text-slate-500">+</span>
          <span class="text-amber-400">a</span>
          <span class="font-sans text-slate-500">&middot;</span>
          <span class="text-purple-400">t</span>
        \`;
        equationDesc.innerText = "To find final velocity, start with the initial velocity and add the change in velocity (acceleration multiplied by time).";
      } else if (vName === 'vo') {
        equationRender.innerHTML = \`
          <span class="text-sky-400">v<sub>o</sub></span>
          <span class="font-sans text-slate-500">=</span>
          <span class="text-emerald-400">v<sub>f</sub></span>
          <span class="font-sans text-slate-500">&minus;</span>
          <span class="font-sans text-slate-500">(</span>
          <span class="text-amber-400">a</span>
          <span class="font-sans text-slate-500">&middot;</span>
          <span class="text-purple-400">t</span>
          <span class="font-sans text-slate-500">)</span>
        \`;
        equationDesc.innerText = "To find initial velocity, subtract the velocity gained or lost (a · t) from the final velocity.";
      } else if (vName === 'a') {
        equationRender.innerHTML = \`
          <span class="text-amber-400">a</span>
          <span class="font-sans text-slate-500">=</span>
          <div class="flex flex-col items-center">
            <div class="flex items-center gap-1.5 text-xl sm:text-2xl">
              <span class="text-emerald-400">v<sub>f</sub></span>
              <span class="font-sans text-slate-500">&minus;</span>
              <span class="text-sky-400">v<sub>o</sub></span>
            </div>
            <div class="w-24 sm:w-28 h-0.5 bg-slate-500 my-1 rounded"></div>
            <span class="text-purple-400">t</span>
          </div>
        \`;
        equationDesc.innerText = "To find acceleration, calculate the change in velocity (final minus initial) and divide by the elapsed time.";
      } else if (vName === 't') {
        equationRender.innerHTML = \`
          <span class="text-purple-400">t</span>
          <span class="font-sans text-slate-500">=</span>
          <div class="flex flex-col items-center">
            <div class="flex items-center gap-1.5 text-xl sm:text-2xl">
              <span class="text-emerald-400">v<sub>f</sub></span>
              <span class="font-sans text-slate-500">&minus;</span>
              <span class="text-sky-400">v<sub>o</sub></span>
            </div>
            <div class="w-24 sm:w-28 h-0.5 bg-slate-500 my-1 rounded"></div>
            <span class="text-amber-400">a</span>
          </div>
        \`;
        equationDesc.innerText = "To find the time elapsed, take the total change in velocity (final minus initial) and divide by the acceleration rate.";
      }
    }

    // -------------------------------------------------------------
    // GAME LOOPS & STATE MANAGEMENT
    // -------------------------------------------------------------
    let state = {
      studentId: '',
      displayName: '',
      photoURL: '',
      currentLevel: 1,
      unlockedLevels: [1],
      score: 0,
      answered: 0,
      streak: 0,
      highScore: 0,
      completed: false,
      completedAt: '',
      certificateId: '',
      deck: [],
      currentQuestionIndex: 0
    };

    const MIN_QUESTIONS = 6;
    const REQUIRED_STREAK = 4;
    const TOLERANCE = 0.05;
    const ASSIGNMENT_ID = 'kinematic_velocity_calculator';
    const PHYSICS_LABS_COLLECTION = 'physics_labs';
    const LAB_FIELD = 'kinematic_velocity';

    function updateCloudStatus(status) {
      const el = document.getElementById('hud-cloud-status');
      const text = document.getElementById('hud-cloud-text');
      if (!el || !text) return;
      if (status === 'saving') {
        text.innerText = 'Saving...';
        el.className = 'flex items-center gap-1.5 text-[10px] text-amber-400 bg-amber-950/70 border border-amber-500/30 px-2.5 py-1 rounded-lg transition-all font-mono';
      } else if (status === 'saved') {
        text.innerText = 'Auto-Saved';
        el.className = 'flex items-center gap-1.5 text-[10px] text-emerald-400 bg-emerald-950/70 border border-emerald-500/30 px-2.5 py-1 rounded-lg transition-all font-mono';
      } else if (status === 'preview') {
        text.innerText = 'Preview Mode';
        el.className = 'flex items-center gap-1.5 text-[10px] text-sky-400 bg-sky-950/70 border border-sky-500/30 px-2.5 py-1 rounded-lg transition-all font-mono';
      } else if (status === 'error') {
        text.innerText = 'Sync Offline';
        el.className = 'flex items-center gap-1.5 text-[10px] text-rose-400 bg-rose-950/70 border border-rose-500/30 px-2.5 py-1 rounded-lg transition-all font-mono';
      }
    }

    function updateCertButtonHUD() {
      const btn = document.getElementById('btn-view-cert');
      if (!btn) return;
      if (state.completed) {
        btn.classList.remove('hidden');
      } else {
        btn.classList.add('hidden');
      }
    }

    function startGuestMode() {
      state.studentId = 'teacher_preview';
      state.displayName = 'Teacher Preview';
      state.photoURL = '';
      state.unlockedLevels = [1, 2, 3];
      state.currentLevel = 1;
      state.answered = 0;
      state.streak = 0;
      state.score = 0;
      state.completed = false;
      state.completedAt = '';
      state.certificateId = '';
      hudInitialize();
      updateCloudStatus('preview');
    }

    window.addEventListener('DOMContentLoaded', () => {
      lucide.createIcons();

      // Auto-detect preview mode: local file, localhost, or query parameters (?preview, ?test, ?guest)
      const urlParams = new URLSearchParams(window.location.search);
      const isAutoPreview = window.location.protocol === 'file:' ||
                            window.location.hostname === 'localhost' ||
                            window.location.hostname === '127.0.0.1' ||
                            urlParams.has('preview') ||
                            urlParams.has('test') ||
                            urlParams.has('guest');

      if (isAutoPreview) {
        startGuestMode();
      } else {
        showSection('view-register');
      }

      // Firebase Auth observer
      fbAuth.onAuthStateChanged(async user => {
        if (user) {
          const emailLower = (user.email || '').toLowerCase();
          const isAllowed = emailLower.endsWith('@orangeusd.org') ||
                            emailLower === 'ryan.mudry@gmail.com' ||
                            emailLower === 'ryanmudry@gmail.com';

          if (!isAllowed) {
            document.getElementById('register-error').classList.remove('hidden');
            document.getElementById('register-status').classList.add('hidden');
            await fbAuth.signOut();
            return;
          }

          const prefix = emailLower.split('@')[0];
          state.studentId = prefix;
          state.displayName = user.displayName || prefix;
          state.photoURL = user.photoURL || '';

          await loadProgressFromFirestore(prefix);
          hudInitialize();
        } else {
          // If in preview mode, do not kick back to login screen
          if (state.studentId !== 'teacher_preview') {
            showSection('view-register');
            document.getElementById('register-status').classList.add('hidden');
          }
        }
      });

      document.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', () => sound.playBeep());
      });

      bindDragAndDropEvents();
    });

    async function handleGoogleSignIn() {
      const errEl = document.getElementById('register-error');
      const statusEl = document.getElementById('register-status');
      errEl.classList.add('hidden');
      statusEl.classList.remove('hidden');
      statusEl.innerText = 'Connecting to Google...';
      const provider = new firebase.auth.GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      try {
        await fbAuth.signInWithPopup(provider);
      } catch (e) {
        console.error(e);
        statusEl.classList.add('hidden');
        errEl.classList.remove('hidden');
        errEl.innerText = 'Sign-in failed — please try again';
      }
    }

    async function saveState() {
      if (!state.studentId) return;
      if (state.studentId === 'teacher_preview') {
        updateCloudStatus('preview');
        return;
      }
      updateCloudStatus('saving');
      try {
        // 1. Save to physics_labs for student lab resumption
        await fbDb.collection(PHYSICS_LABS_COLLECTION)
          .doc(state.studentId)
          .set({
            studentId: state.studentId,
            displayName: state.displayName || state.studentId,
            [LAB_FIELD]: {
              currentLevel: state.currentLevel,
              unlockedLevels: state.unlockedLevels,
              answered: state.answered,
              streak: state.streak,
              score: state.score,
              highScore: state.highScore,
              completed: !!state.completed,
              completedAt: state.completedAt || null,
              certificateId: state.certificateId || null
            },
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
          }, { merge: true });

        // 2. Save to standard student_results collection for Gradebook sync
        const pct = state.completed 
          ? 100 
          : (state.currentLevel === 3 ? Math.round((state.score / MIN_QUESTIONS) * 100) : (state.currentLevel === 2 ? 70 : 50));
        
        await fbDb.collection('student_results')
          .doc(ASSIGNMENT_ID)
          .collection('students')
          .doc(state.studentId)
          .set({
            studentId: state.studentId,
            displayName: state.displayName || state.studentId,
            score: Math.round((pct / 100) * 10),
            maxScore: 10,
            percentage: pct,
            completed: !!state.completed,
            completedAt: state.completedAt || new Date().toISOString(),
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
          }, { merge: true });

        updateCloudStatus('saved');
      } catch (e) {
        console.error('Firestore save error', e);
        updateCloudStatus('error');
      }
    }

    async function loadProgressFromFirestore(studentId) {
      try {
        const snap = await fbDb.collection(PHYSICS_LABS_COLLECTION).doc(studentId).get();
        if (snap.exists) {
          const data = snap.data() || {};
          const labData = data[LAB_FIELD] || {};
          state.unlockedLevels = labData.unlockedLevels || [1];
          state.highScore = labData.highScore ?? 0;
          state.completed = !!labData.completed;
          state.completedAt = labData.completedAt || '';
          state.certificateId = labData.certificateId || '';
          
          const savedLevel = labData.currentLevel || 1;
          state.currentLevel = state.unlockedLevels.includes(savedLevel) ? savedLevel : 1;
          state.answered = typeof labData.answered === 'number' ? labData.answered : 0;
          state.streak = typeof labData.streak === 'number' ? labData.streak : 0;
          state.score = typeof labData.score === 'number' ? labData.score : 0;
        } else {
          state.unlockedLevels = [1];
          state.highScore = 0;
          state.currentLevel = 1;
          state.answered = 0;
          state.streak = 0;
          state.score = 0;
          state.completed = false;
          state.completedAt = '';
          state.certificateId = '';
        }
      } catch (e) {
        console.error('Firestore load error', e);
        state.unlockedLevels = [1];
        state.highScore = 0;
        state.currentLevel = 1;
        state.answered = 0;
        state.streak = 0;
        state.score = 0;
        state.completed = false;
        state.completedAt = '';
        state.certificateId = '';
      }
      updateCertButtonHUD();
    }

    function showSection(id) {
      const sections = ['view-register', 'view-workspace'];
      sections.forEach(s => {
        const el = document.getElementById(s);
        if (s === id) {
          el.classList.remove('hidden');
          el.style.opacity = '0';
          setTimeout(() => el.style.opacity = '1', 50);
        } else {
          el.classList.add('hidden');
        }
      });

      const badge = document.getElementById('student-badge');
      if (id === 'view-register') {
        badge.classList.add('hidden');
      } else {
        badge.classList.remove('hidden');
      }
    }

    function logout() {
      if (confirm("Sign out of the lab? Your progress is saved to your account.")) {
        state = {
          studentId: '',
          displayName: '',
          photoURL: '',
          currentLevel: 1,
          unlockedLevels: [1],
          score: 0,
          answered: 0,
          streak: 0,
          highScore: 0,
          completed: false,
          completedAt: '',
          certificateId: '',
          deck: [],
          currentQuestionIndex: 0
        };
        speech.cancel();
        showSection('view-register');
        if (fbAuth.currentUser) {
          fbAuth.signOut();
        }
      }
    }

    function hudInitialize() {
      const displayLabel = state.displayName || state.studentId;
      document.getElementById('badge-id').innerText = displayLabel;
      document.getElementById('hud-student-id').innerText = displayLabel;

      const avatarEl = document.getElementById('badge-avatar');
      if (state.photoURL) {
        avatarEl.src = state.photoURL;
        avatarEl.classList.remove('hidden');
      } else {
        avatarEl.classList.add('hidden');
      }

      updateCertButtonHUD();
      updateLevelButtonsUI();
      
      const targetLevel = state.currentLevel || 1;
      changeLevel(targetLevel, true);
      showSection('view-workspace');
    }

    function updateLevelButtonsUI() {
      for (let lvl = 1; lvl <= 3; lvl++) {
        const btn = document.getElementById(\`btn-level-\${lvl}\`);
        if (state.unlockedLevels.includes(lvl)) {
          btn.disabled = false;
          btn.classList.remove('cursor-not-allowed');
          if (state.currentLevel === lvl) {
            btn.className = "px-3 py-1.5 text-xs rounded-lg font-bold transition-all bg-sky-600 text-white shadow-md glow-neon";
          } else if (lvl > state.currentLevel) {
            btn.className = "px-3 py-1.5 text-xs rounded-lg font-bold transition-all bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40 pulse-amber";
          } else {
            btn.className = "px-3 py-1.5 text-xs rounded-lg font-bold transition-all bg-white text-slate-800 hover:bg-slate-100 border border-white/5";
          }
        } else {
          btn.disabled = true;
          btn.className = "px-3 py-1.5 text-xs rounded-lg font-bold transition-all bg-slate-900 text-slate-500 border border-white/5 cursor-not-allowed";
        }
      }
    }

    function changeLevel(levelNum, preserveProgress = false) {
      if (!state.unlockedLevels.includes(levelNum)) return;
      
      sound.playBeep();
      speech.cancel();
      
      state.currentLevel = levelNum;
      if (!preserveProgress) {
        state.answered = 0;
        state.streak = 0;
        state.score = 0;
      }
      
      updateLevelButtonsUI();
      
      let subset = [];
      if (levelNum === 1) {
        subset = QUESTIONS.slice(0, 20);
      } else if (levelNum === 2) {
        subset = QUESTIONS.slice(20, 40);
      } else if (levelNum === 3) {
        subset = QUESTIONS.slice(40, 50);
      }
      
      state.deck = shuffleArray(subset);
      state.currentQuestionIndex = 0;

      const streakHUD = document.getElementById('hud-streak-container');
      if (levelNum === 3) {
        streakHUD.classList.add('hidden');
      } else {
        streakHUD.classList.remove('hidden');
      }

      if (levelNum >= 2) {
        toggleCalculatorModal(true);
      } else {
        toggleCalculatorModal(false);
      }

      loadQuestion(0);
      saveState();
    }

    function shuffleArray(arr) {
      const copy = [...arr];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    }

    // -------------------------------------------------------------
    // PLAYING QUESTION & SLOTS STATE
    // -------------------------------------------------------------
    let placedState = {
      vf: null, // Final velocity slot
      vo: null, // Initial velocity slot
      a: null,  // Acceleration slot
      t: null   // Time slot
    };

    let selectedDragItem = null;

    function loadQuestion(idx) {
      if (idx >= state.deck.length) {
        state.deck = shuffleArray(state.deck);
        state.currentQuestionIndex = 0;
        idx = 0;
      }

      state.currentQuestionIndex = idx;
      isCurrentQuestionSolved = false;
      
      placedState = { vf: null, vo: null, a: null, t: null };
      selectedDragItem = null;
      document.getElementById('manual-user-answer').value = '';
      document.getElementById('feedback-box').innerText = getLevelInstruction();
      document.getElementById('feedback-box').className = "glass rounded-xl p-3 text-center font-bold text-slate-300 text-xs min-h-[48px] flex items-center justify-center border border-white/5";

      document.getElementById('btn-next-question').classList.add('hidden');
      const checkBtn = document.getElementById('btn-check-answer');
      if (checkBtn) checkBtn.classList.remove('hidden');
      
      const helper = document.getElementById('calc-input-helper');
      helper.classList.add('hidden');

      if (state.currentLevel >= 2) {
        toggleCalculatorModal(true);
        if (desmosCalculator) {
          try {
            desmosCalculator.setBlank();
          } catch(e) {}
        }
        onDesmosChange();
      }

      updateProgressHUD();
      renderQuestionBadges();
      updateEquationSlotsUI();
    }

    function getLevelInstruction() {
      if (state.currentLevel === 1) {
        return "Drag or tap the given values and unknown term from the problem into the equation.";
      } else if (state.currentLevel === 2) {
        return "Place the values, compute in Desmos, paste or enter your result, and check your work.";
      } else {
        return "Mastery round! Calculate each unknown value using Desmos to earn points toward your certificate.";
      }
    }

    function updateProgressHUD() {
      const bar = document.getElementById('progress-bar-fill');
      const answeredHUD = document.getElementById('hud-answered');
      const streakHUD = document.getElementById('hud-streak');

      const total = MIN_QUESTIONS;
      const progressPercent = Math.min((state.answered / total) * 100, 100);
      bar.style.width = \`\${progressPercent}%\`;

      if (state.currentLevel === 3) {
        answeredHUD.innerText = \`\${state.answered} / \${total} Answered · Score: \${state.score} / \${total}\`;
      } else {
        answeredHUD.innerText = \`\${state.answered} / \${total} Answered\`;
        streakHUD.innerText = \`\${state.streak} / \${REQUIRED_STREAK}\`;
      }
    }

    function renderQuestionBadges() {
      const q = state.deck[state.currentQuestionIndex];
      const container = document.getElementById('question-text');
      container.innerHTML = '';

      const getValBadge = (vType) => {
        return q.values.find(v => v.variable === vType);
      };

      q.textParts.forEach((part, i) => {
        if (typeof part === 'string') {
          const span = document.createElement('span');
          span.innerText = part;
          container.appendChild(span);
        } else if (part.isUnknown) {
          const isPlaced = Object.values(placedState).includes('unknown');
          
          if (isPlaced) {
            const span = document.createElement('span');
            span.className = "inline-block mx-1 font-bold text-slate-500 line-through select-none";
            span.innerText = q.unknownText;
            container.appendChild(span);
          } else {
            const badge = document.createElement('div');
            badge.className = "bg-indigo-950/80 text-indigo-300 border border-indigo-500/40 font-bold p-1.5 px-3 rounded-lg inline-block mx-1.5 hover:bg-indigo-900/50 hover:scale-102 transition-all text-sm drag-item ring-1 ring-indigo-500/20";
            badge.innerText = q.unknownText;
            badge.draggable = true;
            
            badge.addEventListener('dragstart', (e) => {
              e.dataTransfer.setData('application/json', JSON.stringify({ type: 'unknown', variable: q.solveFor }));
              badge.classList.add('opacity-40');
            });
            badge.addEventListener('dragend', () => badge.classList.remove('opacity-40'));

            badge.addEventListener('click', (e) => {
              selectBadgeClick(badge, { type: 'unknown', variable: q.solveFor }, q.unknownText);
            });

            container.appendChild(badge);
          }
        } else if (part.variable) {
          const valObj = getValBadge(part.variable);
          if (valObj) {
            const isPlaced = Object.values(placedState).some(p => p && p.id === valObj.id);
            const valText = \`\${valObj.value} \${valObj.unit}\`;

            if (isPlaced) {
              const span = document.createElement('span');
              span.className = "inline-block mx-1 font-bold text-slate-500 line-through select-none";
              span.innerText = valText;
              container.appendChild(span);
            } else {
              const badge = document.createElement('div');
              
              let colorClass = "bg-sky-950/80 text-sky-400 border border-sky-500/30";
              if (part.variable === 'vf') colorClass = "bg-emerald-950/80 text-emerald-400 border border-emerald-500/30";
              if (part.variable === 'vo') colorClass = "bg-sky-950/80 text-sky-400 border border-sky-500/30";
              if (part.variable === 'a') colorClass = "bg-amber-950/80 text-amber-400 border border-amber-500/30";
              if (part.variable === 't') colorClass = "bg-purple-950/80 text-purple-400 border border-purple-500/30";
              
              badge.className = \`\${colorClass} font-bold p-1.5 px-3 rounded-lg inline-block mx-1.5 hover:scale-102 transition-all text-sm drag-item ring-1 ring-white/5\`;
              badge.innerText = valText;
              badge.draggable = true;

              badge.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('application/json', JSON.stringify({ type: 'value', value: valObj }));
                badge.classList.add('opacity-40');
              });
              badge.addEventListener('dragend', () => badge.classList.remove('opacity-40'));

              badge.addEventListener('click', (e) => {
                selectBadgeClick(badge, { type: 'value', value: valObj }, valText);
              });

              container.appendChild(badge);
            }
          }
        }
      });
    }

    function selectBadgeClick(el, payload, text) {
      sound.playBeep();
      document.querySelectorAll('.drag-item').forEach(b => b.classList.remove('glow-neon', 'ring-2', 'ring-sky-400'));
      
      if (selectedDragItem && selectedDragItem.text === text) {
        selectedDragItem = null;
        document.getElementById('selection-helper').innerText = '';
      } else {
        selectedDragItem = { payload, text };
        el.classList.add('glow-neon', 'ring-2', 'ring-sky-400');
        document.getElementById('selection-helper').innerText = \`Selected \${text}. Click the target slot in the equation below to place it.\`;
      }
    }

    function handleSlotClick(slotEl) {
      sound.playBeep();
      const slotName = slotEl.getAttribute('data-slot');

      if (selectedDragItem) {
        placePayloadInSlot(selectedDragItem.payload, slotName);
        selectedDragItem = null;
        document.getElementById('selection-helper').innerText = '';
      } else {
        if (placedState[slotName]) {
          clearSlot(slotName);
        }
      }
    }

    function placePayloadInSlot(payload, slotName) {
      if (payload.type === 'value') {
        for (let s in placedState) {
          if (placedState[s] && placedState[s].id === payload.value.id) {
            placedState[s] = null;
          }
        }
        placedState[slotName] = payload.value;
      } else if (payload.type === 'unknown') {
        for (let s in placedState) {
          if (placedState[s] === 'unknown') {
            placedState[s] = null;
          }
        }
        placedState[slotName] = 'unknown';
      }

      updateEquationSlotsUI();
      renderQuestionBadges();
      validateLevel2InputHelperVisibility();
    }

    function clearSlot(slotName) {
      placedState[slotName] = null;
      updateEquationSlotsUI();
      renderQuestionBadges();
      validateLevel2InputHelperVisibility();
    }

    function validateLevel2InputHelperVisibility() {
      const helper = document.getElementById('calc-input-helper');
      const isLvl2 = state.currentLevel >= 2;
      const unknownSlot = findUnknownSlotName();
      
      if (isLvl2 && unknownSlot) {
        helper.classList.remove('hidden');
        if (window.lucide) lucide.createIcons();
        onDesmosChange();
      } else {
        helper.classList.add('hidden');
      }
    }

    function findUnknownSlotName() {
      for (let s in placedState) {
        if (placedState[s] === 'unknown') {
          return s;
        }
      }
      return null;
    }

    function getUnitForVariable(varName) {
      if (varName === 'vf' || varName === 'vo') return 'm/s';
      if (varName === 'a') return 'm/s²';
      if (varName === 't') return 's';
      return '';
    }

    function updateEquationSlotsUI() {
      const q = state.deck[state.currentQuestionIndex];

      const renderSlot = (slotName) => {
        const slotEl = document.querySelector(\`[data-slot="\${slotName}"]\`);
        const item = placedState[slotName];
        
        let displayLabel = slotName;
        let subLabel = 'value';
        if (slotName === 'vf') { displayLabel = 'v<sub>f</sub>'; subLabel = 'final vel'; }
        else if (slotName === 'vo') { displayLabel = 'v<sub>o</sub>'; subLabel = 'initial vel'; }
        else if (slotName === 'a') { displayLabel = 'a'; subLabel = 'accel'; }
        else if (slotName === 't') { displayLabel = 't'; subLabel = 'time'; }

        if (item === 'unknown') {
          let color = "bg-indigo-950/80 border-indigo-500 text-indigo-300";
          
          if (state.currentLevel >= 2 && slotName === q.solveFor) {
            slotEl.innerHTML = \`
              <span class="text-[8px] sm:text-[9px] text-slate-400 block select-none uppercase tracking-wider mb-0.5">\${displayLabel} (solve)</span>
              <div onclick="event.stopPropagation();" class="w-full px-1 sm:px-2">
                <input 
                  type="number" 
                  step="0.01" 
                  id="equation-inline-input" 
                  placeholder="?" 
                  value="\${document.getElementById('manual-user-answer').value || ''}"
                  oninput="syncInlineInputs(this.value)"
                  class="w-full bg-slate-950/90 border border-indigo-500/40 text-center font-bold text-lg sm:text-xl py-0.5 sm:py-1 rounded-lg text-indigo-300 focus:outline-none focus:border-indigo-400 mono"
                >
              </div>
            \`;
            slotEl.className = "drag-target equation-slot bg-slate-900 border-2 border-slate-700 rounded-xl flex flex-col items-center justify-center transition-all scale-102";
          } else {
            slotEl.innerHTML = \`
              <span class="text-[8px] sm:text-[9px] text-slate-400 block select-none uppercase tracking-wider">\${displayLabel}</span>
              <span class="text-xs font-bold text-center px-1 truncate max-w-full">\${q.unknownText}</span>
            \`;
            slotEl.className = \`drag-target equation-slot \${color} border-2 rounded-xl flex flex-col items-center justify-center transition-all scale-102\`;
          }
        } else if (item) {
          let color = "bg-sky-950/90 border-sky-500 text-sky-400";
          if (item.variable === 'vf') color = "bg-emerald-950/90 border-emerald-500 text-emerald-400";
          if (item.variable === 'vo') color = "bg-sky-950/90 border-sky-500 text-sky-400";
          if (item.variable === 'a') color = "bg-amber-950/90 border-amber-500 text-amber-400";
          if (item.variable === 't') color = "bg-purple-950/90 border-purple-500 text-purple-400";
          
          slotEl.innerHTML = \`
            <span class="text-[8px] sm:text-[9px] text-slate-400 block select-none uppercase tracking-wider">\${displayLabel}</span>
            <span class="text-sm sm:text-base font-black mono mt-0.5">\${item.value}</span>
            <span class="text-[9px] text-slate-400 mono">\${item.unit}</span>
          \`;
          slotEl.className = \`drag-target equation-slot \${color} border-2 rounded-xl flex flex-col items-center justify-center transition-all scale-102\`;
        } else {
          slotEl.innerHTML = \`
            <span class="text-slate-500 text-xl sm:text-3xl font-mono select-none">\${displayLabel}</span>
            <span class="text-[8px] sm:text-[9px] text-slate-600 font-sans tracking-wider uppercase font-semibold select-none mt-0.5">\${subLabel}</span>
          \`;
          slotEl.className = "drag-target equation-slot bg-slate-950/80 rounded-xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center text-slate-500 select-none cursor-pointer transition-all";
        }
      };

      renderSlot('vf');
      renderSlot('vo');
      renderSlot('a');
      renderSlot('t');
    }

    function syncInlineInputs(val) {
      document.getElementById('manual-user-answer').value = val;
    }

    function bindDragAndDropEvents() {
      const dragSlots = document.querySelectorAll('.drag-target');
      
      dragSlots.forEach(slot => {
        slot.addEventListener('dragover', (e) => {
          e.preventDefault();
          slot.classList.add('drag-over');
        });
        slot.addEventListener('dragleave', () => {
          slot.classList.remove('drag-over');
        });
        slot.addEventListener('drop', (e) => {
          e.preventDefault();
          slot.classList.remove('drag-over');
          try {
            const payload = JSON.parse(e.dataTransfer.getData('application/json'));
            placePayloadInSlot(payload, slot.getAttribute('data-slot'));
          } catch (err) {
            console.error("Failed to drop payload", err);
          }
        });
      });
    }

    function resetWorkspace() {
      if (isCurrentQuestionSolved) return;
      sound.playBeep();
      placedState = { vf: null, vo: null, a: null, t: null };
      selectedDragItem = null;
      document.getElementById('manual-user-answer').value = '';
      document.getElementById('feedback-box').innerText = getLevelInstruction();
      document.getElementById('feedback-box').className = "glass rounded-xl p-3 text-center font-bold text-slate-300 text-xs min-h-[48px] flex items-center justify-center border border-white/5";

      validateLevel2InputHelperVisibility();
      renderQuestionBadges();
      updateEquationSlotsUI();
    }

    // -------------------------------------------------------------
    // ALGEBRAIC EQUATION VALIDATION CHECK
    // -------------------------------------------------------------
    function checkCurrentAnswer() {
      if (isCurrentQuestionSolved) return;
      const q = state.deck[state.currentQuestionIndex];
      const feedbackBox = document.getElementById('feedback-box');
 
      const isCorrectSlotPlacement = () => {
        // 1. Verify unknown is placed in correct slot
        const unknownSlot = findUnknownSlotName();
        if (unknownSlot !== q.solveFor) {
          feedbackBox.innerText = "The unknown term seems to be in the wrong place. Check which variable you are solving for!";
          feedbackBox.className = "glass rounded-xl p-3 text-center font-bold text-rose-400 text-xs min-h-[48px] flex items-center justify-center border border-rose-500/20 animate-shake";
          sound.playError();
          state.streak = 0;
          updateProgressHUD();
          return false;
        }
 
        // 2. Verify all other values are placed in their matching variable slots
        for (let s in placedState) {
          const item = placedState[s];
          if (item && item !== 'unknown') {
            if (item.variable !== s) {
              feedbackBox.innerText = "One of the given values is in the wrong variable slot. Double check vf, vo, a, and t!";
              feedbackBox.className = "glass rounded-xl p-3 text-center font-bold text-rose-400 text-xs min-h-[48px] flex items-center justify-center border border-rose-500/20 animate-shake";
              sound.playError();
              state.streak = 0;
              updateProgressHUD();
              return false;
            }
          }
        }
 
        // 3. Verify all 4 required terms are placed
        const totalPlaced = Object.values(placedState).filter(Boolean).length;
        if (totalPlaced !== 4) {
          feedbackBox.innerText = "Make sure all 3 given values and the unknown term are placed into the formula slots.";
          feedbackBox.className = "glass rounded-xl p-3 text-center font-bold text-rose-400 text-xs min-h-[48px] flex items-center justify-center border border-rose-500/20 animate-shake";
          sound.playError();
          state.streak = 0;
          updateProgressHUD();
          return false;
        }
 
        return true;
      };
 
      if (!isCorrectSlotPlacement()) return;
 
      // Calculate exact mathematical answer based on formula rearrangement
      let exactVal = 0;
      const getValObj = (vType) => placedState[vType];
 
      const vfVal = getValObj('vf') && getValObj('vf') !== 'unknown' ? getValObj('vf').value : null;
      const voVal = getValObj('vo') && getValObj('vo') !== 'unknown' ? getValObj('vo').value : null;
      const aVal = getValObj('a') && getValObj('a') !== 'unknown' ? getValObj('a').value : null;
      const tVal = getValObj('t') && getValObj('t') !== 'unknown' ? getValObj('t').value : null;
 
      if (q.solveFor === 'vf') {
        exactVal = voVal + (aVal * tVal);
      } else if (q.solveFor === 'vo') {
        exactVal = vfVal - (aVal * tVal);
      } else if (q.solveFor === 'a') {
        exactVal = (vfVal - voVal) / tVal;
      } else if (q.solveFor === 't') {
        exactVal = (vfVal - voVal) / aVal;
      }
 
      if (state.currentLevel === 1) {
        // Level 1: Auto-calculates math and displays it
        isCurrentQuestionSolved = true;
        sound.playSuccess();
        confetti({ particleCount: 40, spread: 50 });
        
        const unknownSlotEl = document.querySelector(\`[data-slot="\${q.solveFor}"]\`);
        const unit = getUnitForVariable(q.solveFor);
        let displayVar = q.solveFor;
        if (q.solveFor === 'vf') displayVar = 'v<sub>f</sub>';
        if (q.solveFor === 'vo') displayVar = 'v<sub>o</sub>';
        
        unknownSlotEl.innerHTML = \`
          <span class="text-[8px] sm:text-[9px] text-slate-400 block uppercase tracking-wider">\${displayVar}</span>
          <span class="text-sm sm:text-base font-extrabold text-emerald-400 mono">≈ \${exactVal.toFixed(2)}</span>
          <span class="text-[9px] text-slate-400 mono">\${unit}</span>
        \`;
        unknownSlotEl.className = "drag-target equation-slot bg-emerald-950/20 border-2 border-emerald-500 rounded-xl flex flex-col items-center justify-center transition-all scale-105";
 
        feedbackBox.innerText = "Correct! Formula arranged perfectly!";
        feedbackBox.className = "glass rounded-xl p-3 text-center font-bold text-emerald-400 text-xs min-h-[48px] flex items-center justify-center border border-emerald-500/20";
        
        incrementStateStats(true);
      } else {
        // Level 2 & 3: Check manual student calculation input
        const rawInput = document.getElementById('manual-user-answer').value;
        const userInput = parseFloat(rawInput);

        if (isNaN(userInput)) {
          feedbackBox.innerText = "Please enter or paste a valid numerical answer.";
          feedbackBox.className = "glass rounded-xl p-3 text-center font-bold text-rose-400 text-xs min-h-[48px] flex items-center justify-center border border-rose-500/20 animate-shake";
          sound.playError();
          return;
        }

        // STRICT DESMOS REQUIREMENT FOR LEVEL 2 & 3
        if (state.currentLevel >= 2) {
          const hasDesmosWork = verifyDesmosWork(q, exactVal);
          if (!hasDesmosWork) {
            feedbackBox.innerText = "⚠️ Desmos calculation required: please calculate your answer in the Desmos calculator!";
            feedbackBox.className = "glass rounded-xl p-3 text-center font-bold text-amber-400 text-xs min-h-[48px] flex items-center justify-center border border-amber-500/30 animate-shake";
            sound.playError();
            toggleCalculatorModal(true);
            const desmosCard = document.getElementById('desmos-card-wrapper');
            if (desmosCard) {
              desmosCard.classList.add('ring-2', 'ring-amber-400');
              setTimeout(() => desmosCard.classList.remove('ring-2', 'ring-amber-400'), 1500);
            }
            return;
          }
        }

        const delta = Math.abs(userInput - exactVal);
        if (delta <= TOLERANCE || (exactVal !== 0 && delta / Math.abs(exactVal) <= 0.05)) {
          isCurrentQuestionSolved = true;
          sound.playSuccess();
          confetti({ particleCount: 50, spread: 60 });
          
          feedbackBox.innerText = state.currentLevel === 3 ? "Correct! You earned a point." : "Correct! Calculation verified in Desmos!";
          feedbackBox.className = "glass rounded-xl p-3 text-center font-bold text-emerald-400 text-xs min-h-[48px] flex items-center justify-center border border-emerald-500/20";
          
          const inlineInput = document.getElementById('equation-inline-input');
          if (inlineInput) {
            inlineInput.disabled = true;
            inlineInput.classList.remove('border-indigo-500/40', 'text-indigo-300');
            inlineInput.classList.add('border-emerald-500', 'text-emerald-400', 'bg-emerald-950/20');
          }
 
          incrementStateStats(true);
        } else {
          sound.playError();
          feedbackBox.innerText = \`Not quite. Check your calculation. Expected value is near \${exactVal.toFixed(2)} (tolerance \${TOLERANCE}).\`;
          feedbackBox.className = "glass rounded-xl p-3 text-center font-bold text-rose-400 text-xs min-h-[48px] flex items-center justify-center border border-rose-500/20 animate-shake";
          
          incrementStateStats(false);
        }
      }
    }

    function incrementStateStats(isCorrect) {
      if (isCorrect) {
        state.answered++;
        if (state.currentLevel === 3) {
          state.score++;
        } else {
          state.streak++;
        }
        
        document.getElementById('btn-next-question').classList.remove('hidden');
        const checkBtn = document.getElementById('btn-check-answer');
        if (checkBtn) checkBtn.classList.add('hidden');
        
        evaluateLevelUnlocks();
      } else {
        state.streak = 0;
      }
      updateProgressHUD();
      saveState();
    }

    function evaluateLevelUnlocks() {
      if (state.currentLevel === 1) {
        if (state.answered >= MIN_QUESTIONS && state.streak >= REQUIRED_STREAK) {
          if (!state.unlockedLevels.includes(2)) {
            state.unlockedLevels.push(2);
            saveState();
            setTimeout(() => {
              triggerLevelUnlockModal(2);
              updateLevelButtonsUI();
            }, 800);
          }
        }
      } else if (state.currentLevel === 2) {
        if (state.answered >= MIN_QUESTIONS && state.streak >= REQUIRED_STREAK) {
          if (!state.unlockedLevels.includes(3)) {
            state.unlockedLevels.push(3);
            saveState();
            setTimeout(() => {
              triggerLevelUnlockModal(3);
              updateLevelButtonsUI();
            }, 800);
          }
        }
      } else if (state.currentLevel === 3) {
        if (state.answered >= MIN_QUESTIONS) {
          if (state.score > state.highScore) {
            state.highScore = state.score;
          }
          state.completed = true;
          state.completedAt = new Date().toISOString();

          const dateStr = new Date().toLocaleDateString();
          const dataStr = \`\${state.studentId}-3-\${state.score}-\${dateStr}\`;
          let check = 0;
          for (let i = 0; i < dataStr.length; i++) {
            check += dataStr.charCodeAt(i) * (i + 1);
          }
          state.certificateId = \`MUD-VELOCITY-\${state.studentId}-3-\${state.score}-\${check.toString(16).toUpperCase()}\`;

          updateCertButtonHUD();
          saveState();

          setTimeout(() => {
            triggerCompletionCertificate();
          }, 800);
        }
      }
    }

    function nextQuestion() {
      state.currentQuestionIndex++;
      loadQuestion(state.currentQuestionIndex);
    }

    let nextUnlockedLevel = 2;

    function triggerLevelUnlockModal(levelNum) {
      nextUnlockedLevel = levelNum;
      document.getElementById('unlock-level-num').innerText = levelNum;
      
      const titleEl = document.getElementById('unlock-level-title');
      const descEl = document.getElementById('unlock-level-description');
      
      if (levelNum === 2) {
        titleEl.innerText = "LEVEL 2 IS NOW ACCESSIBLE";
        descEl.innerText = "Formulate equations and manually calculate numerical solutions using the embedded Desmos scientific calculator sidebar.";
      } else if (levelNum === 3) {
        titleEl.innerText = "LEVEL 3 IS NOW ACCESSIBLE";
        descEl.innerText = "Final Kinematic Mastery Challenge! Solve 6 randomized word problems with Desmos to earn your official Certificate of Kinematic Mastery.";
      }
      
      sound.playSuccess();
      confetti({ particleCount: 60, spread: 80, origin: { y: 0.6 } });
      
      const modal = document.getElementById('modal-level-unlocked');
      modal.classList.remove('hidden');
      setTimeout(() => {
        modal.querySelector('.transform').classList.remove('scale-95');
        modal.querySelector('.transform').classList.add('scale-100');
      }, 50);
      
      lucide.createIcons();
    }

    function startUnlockedLevel() {
      closeUnlockModal();
      changeLevel(nextUnlockedLevel);
    }

    function closeUnlockModal() {
      const modal = document.getElementById('modal-level-unlocked');
      modal.querySelector('.transform').classList.remove('scale-100');
      modal.querySelector('.transform').classList.add('scale-95');
      setTimeout(() => {
        modal.classList.add('hidden');
      }, 150);
    }

    // -------------------------------------------------------------
    // ACCESSIBILITY & AUDIO READ ALOUD
    // -------------------------------------------------------------
    function readQuestionAloud() {
      sound.playBeep();
      if (speech.speaking) {
        speech.cancel();
      } else {
        const q = state.deck[state.currentQuestionIndex];
        const textPartsCleaned = q.textParts.map(part => {
          if (typeof part === 'string') return part;
          if (part.isUnknown) return q.unknownText;
          if (part.variable) {
            const valObj = q.values.find(v => v.variable === part.variable);
            return valObj ? \`\${valObj.value} \${valObj.unit}\` : '';
          }
          return '';
        });
        
        const textToSpeak = textPartsCleaned.join('');
        speech.speak(textToSpeak);
      }
    }

    // -------------------------------------------------------------
    // MODALS TRIGGERS
    // -------------------------------------------------------------
    function toggleHelpModal(open) {
      sound.playBeep();
      const el = document.getElementById('modal-help');
      if (open) {
        el.classList.remove('hidden');
        selectHelpVariable('vf');
      } else {
        el.classList.add('hidden');
      }
    }

    function toggleCalculatorModal(open) {
      sound.playBeep();
      const el = document.getElementById('modal-calculator');
      const workspaceEl = document.getElementById('view-workspace');
      if (open) {
        workspaceEl.classList.remove('max-w-4xl');
        workspaceEl.classList.add('max-w-[1280px]');
        el.classList.remove('hidden');
        if (!desmosLoaded || !desmosCalculator) {
          initDesmos();
        } else {
          onDesmosChange();
        }
        if (window.lucide) lucide.createIcons();
      } else {
        if (state && state.currentLevel >= 2) {
          const feedbackBox = document.getElementById('feedback-box');
          if (feedbackBox) {
            feedbackBox.innerText = \`Notice: Desmos calculator is required for Level \${state.currentLevel}. Reopen anytime with the Calculator button.\`;
          }
        }
        workspaceEl.classList.remove('max-w-[1280px]');
        workspaceEl.classList.add('max-w-4xl');
        el.classList.add('hidden');
      }
    }

    // -------------------------------------------------------------
    // COMPLETION CERTIFICATE & VERIFICATION
    // -------------------------------------------------------------
    function triggerCompletionCertificate() {
      const modal = document.getElementById('modal-completion');
      if (!modal) return;

      const displayLabel = state.displayName || state.studentId;
      document.getElementById('cert-student-name').innerText = displayLabel;
      document.getElementById('cert-student-id').innerText = state.studentId;
      document.getElementById('cert-score').innerText = \`\${state.score} / \${MIN_QUESTIONS}\`;

      const dateStr = state.completedAt 
        ? new Date(state.completedAt).toLocaleDateString() 
        : new Date().toLocaleDateString();
      document.getElementById('cert-date').innerText = dateStr;

      if (!state.certificateId) {
        const dataStr = \`\${state.studentId}-3-\${state.score}-\${dateStr}\`;
        let check = 0;
        for (let i = 0; i < dataStr.length; i++) {
          check += dataStr.charCodeAt(i) * (i + 1);
        }
        state.certificateId = \`MUD-VELOCITY-\${state.studentId}-3-\${state.score}-\${check.toString(16).toUpperCase()}\`;
      }
      document.getElementById('cert-token').innerText = state.certificateId;

      modal.classList.remove('hidden');
      sound.playSuccess();
      confetti({ particleCount: 80, spread: 100, origin: { y: 0.5 } });
      if (window.lucide) lucide.createIcons();
    }

    function openCompletionCertificateModal() {
      sound.playBeep();
      triggerCompletionCertificate();
    }

    function closeCompletionModal(restartPractice = false) {
      sound.playBeep();
      document.getElementById('modal-completion').classList.add('hidden');
      if (restartPractice) {
        changeLevel(3);
      }
    }
  </script>
</body>
</html>
`;

const distPath = path.join(__dirname, 'dist', 'index.html');
fs.writeFileSync(distPath, htmlContent);
console.log('Successfully generated:', distPath);

// Also generate kinematic_velocity_calculator/index.html (convenience redirect/wrapper)
const rootIndexPath = path.join(__dirname, 'index.html');
const redirectHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Redirecting to Kinematic Velocity Calculator...</title>
</head>
<body>
  <script>
    const search = window.location.search || '';
    const hash = window.location.hash || '';
    window.location.replace("dist/index.html" + search + hash);
  </script>
  <p>Redirecting to <a href="dist/index.html">Kinematic Velocity Calculator</a>...</p>
</body>
</html>`;
fs.writeFileSync(rootIndexPath, redirectHtml);
console.log('Successfully generated:', rootIndexPath);
