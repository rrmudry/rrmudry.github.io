// Main Application Orchestration for Projectile Target Range
// High-scaffolding, low-anxiety 2-step calculation engine and target practice.

(function () {
  let sim = null;
  let auth = null;
  let userProfile = null;

  // App State
  let state = {
    currentTrack: 'conceptual',
    currentMissionIndex: 0,
    completedMissions: {}, // { 'c1': true, 'c2': true }
    step1Done: false,
    step2Done: false,
    step3Done: false,
    missionFinished: false
  };

  function init() {
    const canvasEl = document.getElementById('targetCanvas');
    sim = new TargetCanvas(canvasEl, pos => {
      updateBucketReadout(pos);
    });

    auth = new AuthManager(profile => {
      userProfile = profile;
      if (profile.cloudProgress && profile.cloudProgress.workbench_state) {
        state = Object.assign(state, profile.cloudProgress.workbench_state);
      } else if (profile.defaultTrack) {
        state.currentTrack = profile.defaultTrack;
      }

      setupTrackSelector();
      setupHeaderControls();
      loadMission(state.currentMissionIndex);
    });

    window.addEventListener('resize', () => {
      if (sim) sim.resize();
    });
  }

  function setupHeaderControls() {
    // Theme toggle
    const btnTheme = document.getElementById('btnTheme');
    if (btnTheme) {
      btnTheme.addEventListener('click', () => {
        const isDark = document.documentElement.classList.toggle('theme-dark');
        try { localStorage.setItem('ptr_theme', isDark ? 'dark' : 'light'); } catch (e) { /* ignore */ }
        btnTheme.textContent = isDark ? '☀️ Light' : '🌙 Dark';
        if (sim) sim.updateTheme();
        window.soundFx.playClick();
      });

      if (localStorage.getItem('ptr_theme') === 'dark') {
        document.documentElement.classList.add('theme-dark');
        btnTheme.textContent = '☀️ Light';
        if (sim) sim.updateTheme();
      }
    }

    // Projector Mode toggle
    const btnProjector = document.getElementById('btnProjector');
    if (btnProjector) {
      btnProjector.addEventListener('click', () => {
        const isProj = document.documentElement.classList.toggle('projector');
        btnProjector.classList.toggle('btn-active', isProj);
        btnProjector.textContent = isProj ? '🖥️ Projector: ON' : '🖥️ Projector';
        if (sim) {
          sim.updateTheme();
          sim.resize();
        }
        window.soundFx.playClick();
      });
    }

    // Audio toggle
    const btnSound = document.getElementById('btnSound');
    if (btnSound) {
      btnSound.addEventListener('click', () => {
        const on = window.soundFx.toggleSound();
        btnSound.textContent = on ? '🔊 Sound: ON' : '🔇 Mute';
      });
    }

    // Strobe checkbox
    const chkStrobe = document.getElementById('chkStrobe');
    if (chkStrobe) {
      chkStrobe.addEventListener('change', e => {
        if (sim) sim.showStrobe = e.target.checked;
      });
    }

    // Bucket Nudge buttons
    const btnNudgeLeft = document.getElementById('btnNudgeLeft');
    const btnNudgeRight = document.getElementById('btnNudgeRight');
    if (btnNudgeLeft && btnNudgeRight) {
      btnNudgeLeft.addEventListener('click', () => {
        if (sim) sim.setBucketPos(sim.bucketX - 0.5);
        window.soundFx.playClick();
      });
      btnNudgeRight.addEventListener('click', () => {
        if (sim) sim.setBucketPos(sim.bucketX + 0.5);
        window.soundFx.playClick();
      });
    }

    // Launch button
    const btnLaunch = document.getElementById('btnLaunch');
    if (btnLaunch) {
      btnLaunch.addEventListener('click', () => handleLaunch());
    }

    // Teacher Model / Reveal Button
    const btnTeacherReveal = document.getElementById('btnTeacherReveal');
    if (btnTeacherReveal) {
      btnTeacherReveal.addEventListener('click', () => handleTeacherReveal());
    }
  }

  function setupTrackSelector() {
    const trackSelect = document.getElementById('trackSelect');
    if (!trackSelect) return;

    trackSelect.value = state.currentTrack;
    trackSelect.addEventListener('change', e => {
      state.currentTrack = e.target.value;
      state.currentMissionIndex = 0;
      loadMission(0);
      window.soundFx.playClick();
    });

    renderMissionStrip();
  }

  function renderMissionStrip() {
    const strip = document.getElementById('missionStrip');
    if (!strip) return;

    const track = TRACKS_DATA[state.currentTrack];
    strip.innerHTML = '';

    track.missions.forEach((m, idx) => {
      const isDone = !!state.completedMissions[m.id];
      const isCurrent = idx === state.currentMissionIndex;

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `mission-pill ${isCurrent ? 'active' : ''} ${isDone ? 'done' : ''}`;
      btn.innerHTML = `<span>Trial ${idx + 1}</span> ${isDone ? '✓' : ''}`;
      btn.addEventListener('click', () => {
        loadMission(idx);
        window.soundFx.playClick();
      });
      strip.appendChild(btn);
    });

    updateScoreBadge();
  }

  function updateScoreBadge() {
    const scoreBadge = document.getElementById('scoreBadge');
    if (!scoreBadge) return;
    const completedCount = Object.keys(state.completedMissions || {}).length;
    const score = Math.min(10, completedCount * 2);
    scoreBadge.textContent = `${score} / 10 pts`;
  }

  function getCurrentMission() {
    const track = TRACKS_DATA[state.currentTrack];
    return track.missions[state.currentMissionIndex];
  }

  function loadMission(index) {
    state.currentMissionIndex = index;
    const m = getCurrentMission();

    state.step1Done = false;
    state.step2Done = false;
    state.step3Done = false;
    state.missionFinished = false;

    // Set simulator
    sim.setMission(m);

    // Update Header Text & Description
    document.getElementById('missionTitle').textContent = m.title;
    document.getElementById('missionDesc').textContent = m.description;

    // Reset feedback
    const fb = document.getElementById('stepFeedback');
    fb.textContent = '';
    fb.className = 'feedback-box';

    // Render Scaffolding
    renderScaffolding(m);
    renderMissionStrip();
    updateBucketReadout(sim.bucketX);

    // Disable launch button until calculation is verified
    document.getElementById('btnLaunch').disabled = true;
    document.getElementById('btnLaunch').classList.remove('pulse-btn');
  }

  function renderScaffolding(m) {
    const isRev = m.isReverse;
    const isHonors = !!m.isHonorsImpact;

    // Vertical Box
    document.getElementById('valDy').textContent = `${m.height.toFixed(1)} m`;
    document.getElementById('inTime').value = '';
    document.getElementById('inTime').disabled = false;
    document.getElementById('step1Container').classList.remove('step-complete');

    // Horizontal Box
    if (isRev) {
      document.getElementById('horizLabelGiven').textContent = 'Target Range (Δx):';
      document.getElementById('valHorizGiven').textContent = `${m.lockedDx.toFixed(1)} m`;
      document.getElementById('horizLabelPrompt').textContent = 'Calculate Required Speed (vx):';
      document.getElementById('horizFormula').textContent = 'vx = Δx ÷ t';
      document.getElementById('horizUnit').textContent = 'm/s';
    } else {
      document.getElementById('horizLabelGiven').textContent = 'Launch Speed (vx):';
      document.getElementById('valHorizGiven').textContent = `${m.vx.toFixed(1)} m/s`;
      document.getElementById('horizLabelPrompt').textContent = 'Calculate Landing Range (Δx):';
      document.getElementById('horizFormula').textContent = 'Δx = vx · t';
      document.getElementById('horizUnit').textContent = 'meters';
    }

    const inStep2 = document.getElementById('inStep2');
    inStep2.value = '';
    inStep2.disabled = true; // Lock Step 2 until Step 1 passes
    document.getElementById('step2Container').classList.add('step-locked');
    document.getElementById('step2Container').classList.remove('step-complete');

    // Step 3 (Honors Impact) Box
    const honorsBox = document.getElementById('honorsBox');
    if (honorsBox) {
      honorsBox.hidden = !isHonors;
      if (isHonors) {
        document.getElementById('inVimpact').value = '';
        document.getElementById('inVimpact').disabled = true;
        honorsBox.classList.add('step-locked');
        honorsBox.classList.remove('step-complete');
      }
    }

    // Reverse Speed Dial Controls
    const reverseControls = document.getElementById('reverseDialContainer');
    if (reverseControls) {
      reverseControls.hidden = !isRev;
      if (isRev) {
        const dialRange = document.getElementById('dialSpeedInput');
        dialRange.value = 0;
        dialRange.disabled = true;
        document.getElementById('dialSpeedReadout').textContent = '0.0 m/s';
        dialRange.oninput = () => {
          const val = parseFloat(dialRange.value);
          document.getElementById('dialSpeedReadout').textContent = `${val.toFixed(1)} m/s`;
          sim.setDialSpeed(val);
        };
      }
    }

    // Step 1 Check Button
    document.getElementById('btnCheckStep1').onclick = () => checkStep1(m);
    document.getElementById('inTime').onkeydown = e => {
      if (e.key === 'Enter') checkStep1(m);
    };

    // Step 2 Check Button
    document.getElementById('btnCheckStep2').onclick = () => checkStep2(m);
    inStep2.onkeydown = e => {
      if (e.key === 'Enter') checkStep2(m);
    };

    // Step 3 (Honors) Check Button
    const btnCheckStep3 = document.getElementById('btnCheckStep3');
    if (btnCheckStep3) {
      btnCheckStep3.onclick = () => checkStep3(m);
      document.getElementById('inVimpact').onkeydown = e => {
        if (e.key === 'Enter') checkStep3(m);
      };
    }
  }

  function showFeedback(msg, type = 'info') {
    const fb = document.getElementById('stepFeedback');
    fb.textContent = msg;
    fb.className = `feedback-box fb-${type}`;
  }

  function checkStep1(m) {
    const val = parseFloat(document.getElementById('inTime').value.trim());
    if (isNaN(val) || val <= 0) {
      showFeedback('Please enter a positive number for time (seconds).', 'warn');
      window.soundFx.playErrorBuzzer();
      return;
    }

    const expected = m.expectedT;
    const isCorrect = Math.abs(val - expected) <= 0.08;

    if (isCorrect) {
      state.step1Done = true;
      showFeedback(`✓ Correct! Hang time t = ${expected.toFixed(1)} s. Step 2 is now unlocked!`, 'good');
      window.soundFx.playSuccessChime();

      document.getElementById('inTime').disabled = true;
      document.getElementById('step1Container').classList.add('step-complete');

      // Unlock Step 2
      const inStep2 = document.getElementById('inStep2');
      inStep2.disabled = false;
      document.getElementById('step2Container').classList.remove('step-locked');
      inStep2.focus();
    } else {
      // Diagnostic hints without reset!
      window.soundFx.playErrorBuzzer();
      let hint = m.step1Hint;
      if (Math.abs(val - (m.height / 5)) < 0.1) {
        hint = `Almost! ${m.height} ÷ 5 = ${(m.height / 5)}. That is t², not t! Don't forget to take the square root (√).`;
      } else if (Math.abs(val - (m.height / 10)) < 0.1) {
        hint = `You divided by 10. Remember: Δy = 5 · t², so divide by 5 first, then take the square root!`;
      }
      showFeedback(`Not quite: ${hint}`, 'warn');
    }
  }

  function checkStep2(m) {
    const inStep2 = document.getElementById('inStep2');
    const val = parseFloat(inStep2.value.trim());
    if (isNaN(val) || val <= 0) {
      showFeedback('Please enter a valid positive number.', 'warn');
      window.soundFx.playErrorBuzzer();
      return;
    }

    const isRev = m.isReverse;
    const expected = isRev ? m.expectedVx : m.expectedDx;
    const isCorrect = Math.abs(val - expected) <= 0.15;

    if (isCorrect) {
      state.step2Done = true;
      window.soundFx.playSuccessChime();
      inStep2.disabled = true;
      document.getElementById('step2Container').classList.add('step-complete');

      if (m.isHonorsImpact) {
        // Unlock Honors step
        showFeedback(`✓ Correct! Predicted range = ${expected.toFixed(1)} m. Now calculate impact speed in Step 3!`, 'good');
        const honorsBox = document.getElementById('honorsBox');
        honorsBox.classList.remove('step-locked');
        document.getElementById('inVimpact').disabled = false;
        document.getElementById('inVimpact').focus();
      } else if (isRev) {
        // Unlock reverse dial
        showFeedback(`✓ Excellent! Set the launcher dial to ${expected.toFixed(1)} m/s, then click LAUNCH!`, 'good');
        const dialRange = document.getElementById('dialSpeedInput');
        dialRange.disabled = false;
        unlockLaunch();
      } else {
        // Standard forward mode: unlock bucket placement & launch
        showFeedback(`✓ Excellent! Landing distance is ${expected.toFixed(1)} m. Drag the target bucket to ${expected.toFixed(1)} m and click LAUNCH!`, 'good');
        unlockLaunch();
      }
    } else {
      window.soundFx.playErrorBuzzer();
      showFeedback(`Not quite: ${m.step2Hint}`, 'warn');
    }
  }

  function checkStep3(m) {
    const inV = document.getElementById('inVimpact');
    const val = parseFloat(inV.value.trim());
    if (isNaN(val) || val <= 0) {
      showFeedback('Please enter a valid positive number for impact speed.', 'warn');
      window.soundFx.playErrorBuzzer();
      return;
    }

    const expected = m.expectedVimpact;
    const isCorrect = Math.abs(val - expected) <= 0.35;

    if (isCorrect) {
      state.step3Done = true;
      window.soundFx.playSuccessChime();
      inV.disabled = true;
      document.getElementById('honorsBox').classList.add('step-complete');
      showFeedback(`✓ Outstanding! Total impact speed v = ${expected.toFixed(1)} m/s. Now drag the bucket to ${m.expectedDx.toFixed(1)} m and fire!`, 'good');
      unlockLaunch();
    } else {
      window.soundFx.playErrorBuzzer();
      showFeedback(`Not quite: ${m.step3Hint}`, 'warn');
    }
  }

  function unlockLaunch() {
    const btnLaunch = document.getElementById('btnLaunch');
    btnLaunch.disabled = false;
    btnLaunch.classList.add('pulse-btn');
  }

  function updateBucketReadout(pos) {
    const readout = document.getElementById('bucketPosReadout');
    if (readout) {
      readout.textContent = `${pos.toFixed(1)} m`;
    }
  }

  function handleLaunch() {
    const m = getCurrentMission();
    const btnLaunch = document.getElementById('btnLaunch');
    btnLaunch.disabled = true;
    btnLaunch.classList.remove('pulse-btn');

    showFeedback('🚀 Projectile in flight… watch the trajectory!', 'info');

    sim.launch(res => {
      if (res.isHit) {
        showFeedback(`🎯 BULLSEYE! Direct hit inside the bucket! (+2 points)`, 'good');
        state.completedMissions[m.id] = true;
        auth.queueSave(state);
        renderMissionStrip();

        // Reveal Next Mission button
        if (state.currentMissionIndex < TRACKS_DATA[state.currentTrack].missions.length - 1) {
          setTimeout(() => {
            if (confirm('🎉 Bullseye! Move to the next mission?')) {
              loadMission(state.currentMissionIndex + 1);
            }
          }, 1200);
        } else {
          showFeedback('🏆 ALL 5 MISSIONS COMPLETE! Full 10/10 Score logged to Google Classroom.', 'good');
        }
      } else {
        const shortOrLong = res.diff > 0 ? 'past' : 'short of';
        showFeedback(`💥 Missed by ${Math.abs(res.diff).toFixed(1)} m (${shortOrLong} bucket). Nudge the bucket and try again!`, 'warn');
        btnLaunch.disabled = false;
      }
    });
  }

  function handleTeacherReveal() {
    const m = getCurrentMission();
    document.getElementById('inTime').value = m.expectedT.toFixed(1);
    if (m.isReverse) {
      document.getElementById('inStep2').value = m.expectedVx.toFixed(1);
      const dialRange = document.getElementById('dialSpeedInput');
      if (dialRange) {
        dialRange.value = m.expectedVx;
        dialRange.disabled = false;
        document.getElementById('dialSpeedReadout').textContent = `${m.expectedVx.toFixed(1)} m/s`;
        sim.setDialSpeed(m.expectedVx);
      }
    } else {
      document.getElementById('inStep2').value = m.expectedDx.toFixed(1);
      sim.setBucketPos(m.expectedDx);
    }

    if (m.isHonorsImpact) {
      document.getElementById('inVimpact').value = m.expectedVimpact.toFixed(1);
    }

    unlockLaunch();
    showFeedback('👁️ Teacher modeling mode: Solution populated. Click Launch to demonstrate.', 'info');
  }

  document.addEventListener('DOMContentLoaded', init);
})();
