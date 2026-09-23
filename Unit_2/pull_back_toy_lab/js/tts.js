/**
 * Pull-Back Toy Motion Lab - Web Speech API Text-to-Speech Engine
 * Accessible read-aloud functionality for student lab instructions
 */
class LabTTS {
  constructor() {
    this.synth = ('speechSynthesis' in window) ? window.speechSynthesis : null;
    this.currentUtterance = null;
    this.activeBtn = null;
    this.voices = [];

    // Pre-curated spoken transcripts with natural phonetic pronunciations for lab terminology
    this.transcripts = {
      1: "Stage 1: Interval Tape Markings. Mark 6 Distance Intervals on Track. Place masking tape marks on a smooth, level floor or lab table at exactly: 0.0 centimeters Start Line, 20.0 centimeters, 40.0 centimeters, 60.0 centimeters, 80.0 centimeters, and 100.0 centimeters Finish Line. Checklist: Tape marks and meter stick are aligned straight at all 6 intervals.",
      2: "Stage 2: Critical Camera Angle and Framing. Camera Angle: Frame Track and Stopwatch in One Shot. Step back and angle your recording device elevated or overhead so that both the full 1.0-meter track and the propped-up stopwatch screen are visible simultaneously in the exact same video frame! Set camera to Slow-Motion, 120 or 240 frames per second. Single-shot view: Read the stopwatch the exact video frame the front bumper crosses each line! Checklist: Camera is framed so both the 1.0 meter track and the stopwatch appear clearly in the same shot.",
      3: "Stage 3: Critical Technique. Prop Up Stopwatch and Start Running Before Release. Place your second device propped against a pencil case, water bottle, or stand facing the camera right beside the track. Click Fullscreen Timer for massive, high-visibility digits. Why start before release? It is impossible to release a car and tap Start at the exact same millisecond. Starting the clock several seconds ahead ensures the timer is already ticking smoothly in your camera shot, giving you an exact, zeroable Start Time t-zero when the car first moves! Checklist: Stopwatch is propped in the camera shot, set to fullscreen, and running before release.",
      4: "Stage 4: Release Execution. Pull Back 2 to 3 Clicks and Smooth Release. Pull back 2 to 3 clicks maximum. Do not push down hard on the axles. Hold front bumper motionless at x equals 0.0 centimeters, v-zero equals 0, and release cleanly without pushing. Record until car crosses past 100 centimeters. Checklist: Car released cleanly from rest and traveled straight past 100 centimeters.",
      5: "Stage 5: Video Analysis and Zeroing. Record Start Time t-zero and Zero All Times. Scrub video frame-by-frame. Note the exact stopwatch reading when the car first leaves 0.0 centimeters and enter it as Start Time t-zero. As each marker is crossed, enter the raw times. The table automatically subtracts t-zero so all times are zeroed starting at 0.00 seconds! Checklist: Ready to scrub video and enter raw times into Step 2 table below."
    };

    if (this.synth) {
      this.loadVoices();
      if (typeof window.speechSynthesis.onvoiceschanged !== 'undefined') {
        window.speechSynthesis.onvoiceschanged = () => this.loadVoices();
      }
    }
  }

  loadVoices() {
    if (!this.synth) return;
    this.voices = this.synth.getVoices();
  }

  getBestVoice() {
    if (!this.voices || !this.voices.length) this.loadVoices();
    if (!this.voices || !this.voices.length) return null;
    
    // Prioritize natural sounding English voices
    return this.voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Alex')))
      || this.voices.find(v => v.lang.startsWith('en'))
      || this.voices[0];
  }

  speak(text, btnElement = null) {
    if (!this.synth) {
      alert("Text-to-Speech is not supported in this browser.");
      return;
    }

    // Toggle: if already speaking from this button, stop
    if (this.synth.speaking && this.activeBtn === btnElement) {
      this.stop();
      return;
    }

    // Stop any existing speech
    this.stop();

    if (!text) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95; // Clear, measured classroom pacing
    utterance.pitch = 1.0;
    
    const voice = this.getBestVoice();
    if (voice) utterance.voice = voice;

    this.currentUtterance = utterance;
    this.activeBtn = btnElement;

    if (btnElement) {
      btnElement.classList.add('playing');
      const label = btnElement.querySelector('.tts-label');
      if (label) label.textContent = 'Stop';
      const icon = btnElement.querySelector('.tts-icon');
      if (icon) icon.textContent = '⏹️';
    }

    utterance.onend = () => {
      this.cleanup();
    };

    utterance.onerror = (e) => {
      console.warn("TTS error:", e);
      this.cleanup();
    };

    this.synth.speak(utterance);
  }

  speakStage(stageNum, btnElement = null) {
    const text = this.transcripts[stageNum];
    if (text) {
      this.speak(text, btnElement);
    }
  }

  stop() {
    if (this.synth) {
      this.synth.cancel();
    }
    this.cleanup();
  }

  cleanup() {
    if (this.activeBtn) {
      this.activeBtn.classList.remove('playing');
      const label = this.activeBtn.querySelector('.tts-label');
      if (label) label.textContent = 'Listen';
      const icon = this.activeBtn.querySelector('.tts-icon');
      if (icon) icon.textContent = '🔊';
      this.activeBtn = null;
    }
    this.currentUtterance = null;
  }

  initUI() {
    // Stage Header TTS buttons
    const stageBtns = document.querySelectorAll('.btn-tts-stage');
    stageBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const stage = parseInt(btn.dataset.stage, 10);
        if (stage) {
          this.speakStage(stage, btn);
        }
      });
    });

    // Checklist Item mini TTS buttons
    const miniBtns = document.querySelectorAll('.btn-tts-mini');
    miniBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation(); // Crucial: avoid checking/unchecking parent <label>
        const text = btn.dataset.ttsText || btn.parentElement.innerText;
        if (text) {
          this.speak(text.trim(), btn);
        }
      });
    });
  }
}

// Global instance
window.labTTS = new LabTTS();

document.addEventListener('DOMContentLoaded', () => {
  window.labTTS.initUI();
});
