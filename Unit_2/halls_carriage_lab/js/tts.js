/**
 * Modified Atwood Hall's Carriage Lab - Web Speech API Text-to-Speech Engine
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
      1: "Stage 1: Track Tape Markings and Table Edge Setup. Mark Start and Finish lines on the lab table. Place masking tape at 0.0 centimeters for the Start Line, and 100.0 centimeters, or 1.0 meter, for the Finish Line. Ensure the string lays directly over the smooth, rounded edge of the table. We are not using pulleys in this setup. Make sure the hanging mass has clear vertical drop without touching the floor before crossing the finish mark. Checklist: Tape marks are aligned at 0 and 100 centimeters, and string lays smoothly over the table edge.",
      2: "Stage 2: Critical Camera Angle and Single-Shot Framing. Step back and angle your smartphone camera so that both the full 1.0-meter track and the propped-up stopwatch screen are visible simultaneously in the exact same video frame! Set your camera to Slow-Motion mode, at 120 or 240 frames per second. Frame the shot so you can clearly see the carriage front bumper cross the tape marks and read the timer numbers. Checklist: Camera is framed so both the full track and the running stopwatch appear clearly in one video frame.",
      3: "Stage 3: Critical Timing Technique. Prop Up Stopwatch and Start Running Before Release. Place a second device with the stopwatch propped right next to the track facing the camera. Tap Fullscreen Timer for massive high-contrast digits. Start the stopwatch several seconds before releasing the carriage! It is impossible to release a cart and tap start at the exact same millisecond. Starting the clock ahead of time ensures the timer is already ticking smoothly in your video, giving you an exact, zeroable Start Time t-zero when the carriage first moves. Checklist: Stopwatch is propped in the video frame, set to fullscreen, and running before release.",
      4: "Stage 4: 5 Carriage Mass Configurations and Smooth Release. Attach the string to the front of the blue Hall's carriage and hang your constant pulling mass over the edge. Measure and record 5 different cart mass configurations by varying the mass of the carriage on an electronic balance. Hold the cart motionless at 0.0 centimeters, v-zero equals 0, and release smoothly without pushing. Record until the cart crosses past 100 centimeters. Checklist: Tested 5 mass configurations with constant hanging mass and released smoothly from rest.",
      5: "Stage 5: Video Analysis and Time Zeroing. Scrub your slow-motion video frame by frame. Note the exact stopwatch reading when the cart first begins to move from 0.0 centimeters and enter it as Start Time t-zero. Then find the exact time when the front bumper crosses the 100 centimeter finish mark. The lab table automatically subtracts t-zero so elapsed times start cleanly at zero seconds! Checklist: Ready to scrub video and enter raw start and finish times into the Step 2 data table below."
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
    
    return this.voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Alex')))
      || this.voices.find(v => v.lang.startsWith('en'))
      || this.voices[0];
  }

  speak(text, btnElement = null) {
    if (!this.synth) {
      alert("Text-to-Speech is not supported in this browser.");
      return;
    }

    if (this.synth.speaking && this.activeBtn === btnElement) {
      this.stop();
      return;
    }

    this.stop();
    if (!text) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
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

    const miniBtns = document.querySelectorAll('.btn-tts-mini');
    miniBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const text = btn.dataset.ttsText || btn.parentElement.innerText;
        if (text) {
          this.speak(text.trim(), btn);
        }
      });
    });
  }
}

window.labTTS = new LabTTS();

document.addEventListener('DOMContentLoaded', () => {
  window.labTTS.initUI();
});
