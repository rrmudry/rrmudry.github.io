/**
 * Photogate Telemetry Lab - Client Application
 * Uses the Web Serial API to communicate directly with the Seeed Studio XIAO ESP32-C3.
 */

// Application State
const state = {
  port: null,
  reader: null,
  writer: null,
  connected: false,
  readLoopActive: false,
  
  // Gate Status
  gate1: {
    state: 'CLEAR',
    blockStartUs: 0,
    lastBlockedDurationUs: 0,
    lastBlockTimeStr: '--:--:--'
  },
  gate2: {
    state: 'CLEAR',
    blockStartUs: 0,
    lastBlockedDurationUs: 0,
    lastBlockTimeStr: '--:--:--'
  },

  // Transit tracking between gates
  transit: {
    t1BlockUs: null,
    t2BlockUs: null
  },

  // Runs Data Storage
  runs: [],
  eventCount: 0,

  // Audio synthesize context
  audioCtx: null
};

// DOM References
const elements = {
  connectBtn: document.getElementById('connectBtn'),
  connectBtnText: document.getElementById('connectBtnText'),
  baudRateSelect: document.getElementById('baudRateSelect'),
  connectionStatusPill: document.getElementById('connectionStatusPill'),
  connectionStatusText: document.getElementById('connectionStatusText'),
  simModeBtn: document.getElementById('simModeBtn'),
  
  // HUD Cards
  gateCard1: document.getElementById('gateCard1'),
  gateCard2: document.getElementById('gateCard2'),
  gateStateTag1: document.getElementById('gateStateTag1'),
  gateStateTag2: document.getElementById('gateStateTag2'),
  gateTimeReadout1: document.getElementById('gateTimeReadout1'),
  gateTimeReadout2: document.getElementById('gateTimeReadout2'),
  gateBlockedDuration1: document.getElementById('gateBlockedDuration1'),
  gateBlockedDuration2: document.getElementById('gateBlockedDuration2'),
  transitPuck: document.getElementById('transitPuck'),
  trackDistanceBadge: document.getElementById('trackDistanceBadge'),
  trackTransitBadge: document.getElementById('trackTransitBadge'),

  // Config Inputs
  invertLogicCheckbox: document.getElementById('invertLogicCheckbox'),
  audioChimeCheckbox: document.getElementById('audioChimeCheckbox'),
  experimentModeSelect: document.getElementById('experimentModeSelect'),
  gateDistanceInput: document.getElementById('gateDistanceInput'),
  flagWidthInput: document.getElementById('flagWidthInput'),

  // Metric HUD
  hudVelocity: document.getElementById('hudVelocity'),
  hudVelocitySecondary: document.getElementById('hudVelocitySecondary'),
  hudTransitTime: document.getElementById('hudTransitTime'),
  hudTransitTimeUs: document.getElementById('hudTransitTimeUs'),
  hudAcceleration: document.getElementById('hudAcceleration'),
  hudAccelerationSecondary: document.getElementById('hudAccelerationSecondary'),

  // Statistics
  statCount: document.getElementById('statCount'),
  statMean: document.getElementById('statMean'),
  statStdDev: document.getElementById('statStdDev'),
  statMinMax: document.getElementById('statMinMax'),

  // Table
  runsTableBody: document.getElementById('runsTableBody'),
  exportCsvBtn: document.getElementById('exportCsvBtn'),
  copyClipboardBtn: document.getElementById('copyClipboardBtn'),
  clearDataBtn: document.getElementById('clearDataBtn'),

  // Terminal & Diagnostics
  terminalCounter: document.getElementById('terminalCounter'),
  terminalOutput: document.getElementById('terminalOutput'),
  pingEspBtn: document.getElementById('pingEspBtn'),
  queryStatusBtn: document.getElementById('queryStatusBtn'),
  clearTerminalBtn: document.getElementById('clearTerminalBtn')
};

/* ================= AUDIO CHIME SYNTHESIS ================= */
function playTone(freq = 880, duration = 0.08) {
  if (!elements.audioChimeCheckbox.checked) return;
  try {
    if (!state.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) state.audioCtx = new AudioContext();
    }
    if (state.audioCtx && state.audioCtx.state === 'suspended') {
      state.audioCtx.resume();
    }
    if (!state.audioCtx) return;

    const osc = state.audioCtx.createOscillator();
    const gain = state.audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, state.audioCtx.currentTime);
    gain.gain.setValueAtTime(0.12, state.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, state.audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(state.audioCtx.destination);
    osc.start();
    osc.stop(state.audioCtx.currentTime + duration);
  } catch (e) {
    console.warn('Audio play failed:', e);
  }
}

/* ================= SERIAL COMMUNICATION ================= */
async function toggleSerialConnection() {
  if (state.connected) {
    await disconnectSerial();
  } else {
    await connectSerial();
  }
}

async function connectSerial() {
  if (!('serial' in navigator)) {
    alert('Web Serial API is not supported in this browser. Please use Google Chrome, Microsoft Edge, or another Chromium-based browser on Windows/Mac/Linux.');
    return;
  }

  try {
    const port = await navigator.serial.requestPort();
    const baudRate = parseInt(elements.baudRateSelect.value, 10);
    
    await port.open({ baudRate: baudRate });
    // ESP32-C3 USB CDC requires DTR & RTS to be active to transmit/receive serial data
    try {
      await port.setSignals({ dataTerminalReady: true, requestToSend: true });
    } catch (sigErr) {
      console.warn('Could not set DTR/RTS signals:', sigErr);
    }

    state.port = port;
    state.connected = true;

    updateConnectionUI(true);
    appendTerminal(`[SYSTEM] Connected to USB Serial @ ${baudRate} baud (DTR/RTS active).`);

    // Start background reading loop
    readSerialStream();
  } catch (err) {
    console.error('Serial connection error:', err);
    appendTerminal(`[ERROR] Connection failed: ${err.message}`);
    updateConnectionUI(false);
  }
}

async function disconnectSerial() {
  state.readLoopActive = false;
  if (state.reader) {
    try {
      await state.reader.cancel();
    } catch (e) { /* ignore */ }
  }
  if (state.port) {
    try {
      await state.port.close();
    } catch (e) { /* ignore */ }
  }
  state.port = null;
  state.reader = null;
  state.connected = false;
  updateConnectionUI(false);
  appendTerminal('[SYSTEM] Disconnected from USB Serial.');
}

function updateConnectionUI(connected) {
  if (connected) {
    elements.connectionStatusPill.classList.add('connected');
    elements.connectionStatusText.textContent = 'ESP32-C3 Online';
    elements.connectBtn.classList.add('connected');
    elements.connectBtnText.textContent = 'Disconnect';
    elements.baudRateSelect.disabled = true;
  } else {
    elements.connectionStatusPill.classList.remove('connected');
    elements.connectionStatusText.textContent = 'Disconnected';
    elements.connectBtn.classList.remove('connected');
    elements.connectBtnText.textContent = 'Connect ESP32';
    elements.baudRateSelect.disabled = false;
  }
}

async function sendSerialCommand(cmd) {
  if (!state.connected || !state.port || !state.port.writable) {
    appendTerminal(`[WARN] Not connected. Cannot send: ${cmd}`);
    return;
  }

  try {
    const encoder = new TextEncoder();
    const writer = state.port.writable.getWriter();
    await writer.write(encoder.encode(cmd + '\n'));
    writer.releaseLock();
    appendTerminal(`[TX] ${cmd}`);
  } catch (err) {
    console.error('Error sending serial command:', err);
    appendTerminal(`[ERROR] TX failed: ${err.message}`);
  }
}

async function readSerialStream() {
  state.readLoopActive = true;
  const textDecoder = new TextDecoderStream();
  const readableStreamClosed = state.port.readable.pipeTo(textDecoder.writable);
  const reader = textDecoder.readable.getReader();
  state.reader = reader;

  let lineBuffer = '';

  try {
    while (state.readLoopActive) {
      const { value, done } = await reader.read();
      if (done) break;
      if (value) {
        lineBuffer += value;
        const lines = lineBuffer.split('\n');
        lineBuffer = lines.pop(); // Keep partial line in buffer

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed) {
            handleSerialLine(trimmed);
          }
        }
      }
    }
  } catch (err) {
    if (state.connected) {
      console.warn('Read stream error:', err);
      appendTerminal(`[WARN] Stream interrupted: ${err.message}`);
    }
  } finally {
    reader.releaseLock();
  }
}

/* ================= EVENT PROTOCOL & DISPATCH ================= */
function handleSerialLine(rawLine) {
  appendTerminal(rawLine);
  state.eventCount++;
  elements.terminalCounter.textContent = `${state.eventCount} events`;

  // Parse JSON message
  if (rawLine.startsWith('{') && rawLine.endsWith('}')) {
    try {
      const packet = JSON.parse(rawLine);
      processTelemetryPacket(packet);
    } catch (e) {
      console.warn('JSON parse error:', e, rawLine);
    }
  }
}

function processTelemetryPacket(packet) {
  if (packet.type === 'event') {
    const gateNum = packet.gate;
    const isBlock = packet.state === 'BLOCK';
    const us = packet.us;
    
    handleGateStateTransition(gateNum, isBlock, us);
  } else if (packet.type === 'status') {
    if (packet.g1) updateGateVisual(1, packet.g1 === 'BLOCKED');
    if (packet.g2) updateGateVisual(2, packet.g2 === 'BLOCKED');
  } else if (packet.type === 'ready') {
    appendTerminal(`[INIT] ${packet.board} ready (D0: Gate 1, D1: Gate 2)`);
  }
}

function handleGateStateTransition(gateNum, isBlocked, timestampUs) {
  const gateObj = gateNum === 1 ? state.gate1 : state.gate2;
  const nowTimeStr = new Date().toLocaleTimeString();

  updateGateVisual(gateNum, isBlocked);

  if (isBlocked) {
    // Laser Beam Blocked (Cart/Flag entered)
    playTone(gateNum === 1 ? 750 : 920, 0.06);
    gateObj.state = 'BLOCK';
    gateObj.blockStartUs = timestampUs;
    gateObj.lastBlockTimeStr = nowTimeStr;

    if (gateNum === 1) {
      state.transit.t1BlockUs = timestampUs;
      elements.gateTimeReadout1.textContent = `${nowTimeStr} (${timestampUs} \u03BCs)`;
    } else if (gateNum === 2) {
      state.transit.t2BlockUs = timestampUs;
      elements.gateTimeReadout2.textContent = `${nowTimeStr} (${timestampUs} \u03BCs)`;

      // Animate track puck
      triggerTransitPuck();

      // Check if this completes a 1 -> 2 transit run
      if (state.transit.t1BlockUs !== null) {
        completeRunCalculation();
      }
    }
  } else {
    // Laser Beam Restored (Cart/Flag exited)
    playTone(gateNum === 1 ? 580 : 640, 0.04);
    gateObj.state = 'CLEAR';
    
    if (gateObj.blockStartUs > 0) {
      let deltaUs = timestampUs - gateObj.blockStartUs;
      if (deltaUs < 0) deltaUs += 4294967296; // Handle 32-bit micros() rollover
      gateObj.lastBlockedDurationUs = deltaUs;
      const secVal = (deltaUs / 1000000).toFixed(4);

      if (gateNum === 1) {
        elements.gateBlockedDuration1.textContent = `${secVal} s (${(deltaUs / 1000).toFixed(2)} ms)`;
        // If in single-gate mode, calculate immediately
        if (elements.experimentModeSelect.value === 'single_gate_flag') {
          completeSingleGateCalculation(deltaUs);
        }
      } else {
        elements.gateBlockedDuration2.textContent = `${secVal} s (${(deltaUs / 1000).toFixed(2)} ms)`;
      }
    }
  }
}

function updateGateVisual(gateNum, isBlocked) {
  const card = gateNum === 1 ? elements.gateCard1 : elements.gateCard2;
  const tag = gateNum === 1 ? elements.gateStateTag1 : elements.gateStateTag2;

  if (isBlocked) {
    card.classList.add('blocked');
    tag.textContent = 'BLOCKED';
  } else {
    card.classList.remove('blocked');
    tag.textContent = 'CLEAR';
  }
}

function triggerTransitPuck() {
  elements.transitPuck.classList.remove('traveling');
  void elements.transitPuck.offsetWidth; // Trigger DOM reflow
  elements.transitPuck.classList.add('traveling');
}

/* ================= PHYSICS CALCULATIONS ================= */
function completeRunCalculation() {
  const t1Us = state.transit.t1BlockUs;
  const t2Us = state.transit.t2BlockUs;

  let transitUs = t2Us - t1Us;
  if (transitUs < 0) transitUs += 4294967296; // 32-bit wrap safeguard

  const transitSec = transitUs / 1000000;
  const transitMs = transitUs / 1000;

  // Physical geometry
  const distCm = parseFloat(elements.gateDistanceInput.value) || 10.0;
  const distM = distCm / 100;
  const flagCm = parseFloat(elements.flagWidthInput.value) || 2.5;
  const flagM = flagCm / 100;

  const mode = elements.experimentModeSelect.value;
  let velocityMps = 0;
  let accelMps2 = 0;

  const g1DurationUs = state.gate1.lastBlockedDurationUs;
  const g2DurationUs = state.gate2.lastBlockedDurationUs;

  if (mode === 'dual_gate_speed') {
    // v = delta_x / delta_t
    velocityMps = transitSec > 0 ? (distM / transitSec) : 0;
    accelMps2 = 0; // Not applicable or uniform velocity assumed
  } else if (mode === 'incline_acceleration') {
    // Started from rest at Gate 1: d = 0.5 * a * t^2 => a = 2d / t^2
    velocityMps = transitSec > 0 ? (distM / transitSec) : 0; // average v
    accelMps2 = transitSec > 0 ? (2 * distM) / (transitSec * transitSec) : 0;
  } else if (mode === 'flag_both_acceleration') {
    // v1 = flag / dt1, v2 = flag / dt2
    const v1 = g1DurationUs > 0 ? (flagM / (g1DurationUs / 1000000)) : 0;
    const v2 = g2DurationUs > 0 ? (flagM / (g2DurationUs / 1000000)) : 0;
    velocityMps = (v1 + v2) / 2;
    // a = (v2^2 - v1^2) / (2 * dist)
    accelMps2 = distM > 0 ? ((v2 * v2) - (v1 * v1)) / (2 * distM) : 0;
  } else if (mode === 'pendulum_period') {
    // Time from Gate 1 to Gate 2 or back
    velocityMps = distM / transitSec;
    accelMps2 = 0;
  }

  // Update HUD
  elements.hudVelocity.textContent = velocityMps.toFixed(3);
  elements.hudVelocitySecondary.textContent = `${(velocityMps * 100).toFixed(1)} cm/s`;
  elements.hudTransitTime.textContent = transitSec.toFixed(4);
  elements.hudTransitTimeUs.textContent = `${transitUs.toLocaleString()} \u03BCs`;
  elements.hudAcceleration.textContent = accelMps2.toFixed(3);
  elements.trackTransitBadge.textContent = `\u0394t: ${transitMs.toFixed(1)} ms`;

  // Record Run
  const runRecord = {
    id: state.runs.length + 1,
    time: new Date().toLocaleTimeString(),
    g1DtMs: (g1DurationUs / 1000).toFixed(2),
    g2DtMs: (g2DurationUs / 1000).toFixed(2),
    transitMs: transitMs.toFixed(2),
    transitSec: transitSec,
    velocity: velocityMps,
    acceleration: accelMps2
  };

  state.runs.unshift(runRecord);
  renderRunsTable();
  updateStatistics();

  // Reset transit tracker for next run
  state.transit.t1BlockUs = null;
  state.transit.t2BlockUs = null;
}

function completeSingleGateCalculation(durationUs) {
  const flagCm = parseFloat(elements.flagWidthInput.value) || 2.5;
  const flagM = flagCm / 100;
  const durationSec = durationUs / 1000000;
  const velocityMps = durationSec > 0 ? (flagM / durationSec) : 0;

  elements.hudVelocity.textContent = velocityMps.toFixed(3);
  elements.hudVelocitySecondary.textContent = `${(velocityMps * 100).toFixed(1)} cm/s`;
  elements.hudTransitTime.textContent = durationSec.toFixed(4);
  elements.hudTransitTimeUs.textContent = `${durationUs.toLocaleString()} \u03BCs`;
  elements.hudAcceleration.textContent = '0.000';

  const runRecord = {
    id: state.runs.length + 1,
    time: new Date().toLocaleTimeString(),
    g1DtMs: (durationUs / 1000).toFixed(2),
    g2DtMs: '--',
    transitMs: (durationUs / 1000).toFixed(2),
    transitSec: durationSec,
    velocity: velocityMps,
    acceleration: 0
  };

  state.runs.unshift(runRecord);
  renderRunsTable();
  updateStatistics();
}

/* ================= TABLE & STATISTICS ================= */
function renderRunsTable() {
  if (state.runs.length === 0) {
    elements.runsTableBody.innerHTML = `
      <tr class="empty-state-row">
        <td colspan="8">No timing runs recorded yet. Connect your ESP32-C3 or click "Simulate Pass" to test.</td>
      </tr>`;
    return;
  }

  elements.runsTableBody.innerHTML = state.runs.map(run => `
    <tr>
      <td>${run.id}</td>
      <td>${run.time}</td>
      <td>${run.g1DtMs}</td>
      <td>${run.g2DtMs}</td>
      <td>${run.transitMs}</td>
      <td>${run.velocity.toFixed(3)}</td>
      <td>${run.acceleration.toFixed(3)}</td>
      <td>
        <button class="btn btn-xs btn-outline" onclick="deleteRun(${run.id})">&times;</button>
      </td>
    </tr>
  `).join('');
}

window.deleteRun = function(runId) {
  state.runs = state.runs.filter(r => r.id !== runId);
  renderRunsTable();
  updateStatistics();
};

function updateStatistics() {
  const count = state.runs.length;
  elements.statCount.textContent = count;

  if (count === 0) {
    elements.statMean.textContent = '-- m/s';
    elements.statStdDev.textContent = '-- m/s';
    elements.statMinMax.textContent = '-- / --';
    return;
  }

  const velocities = state.runs.map(r => r.velocity);
  const sum = velocities.reduce((a, b) => a + b, 0);
  const mean = sum / count;

  // Sample Standard Deviation
  let variance = 0;
  if (count > 1) {
    variance = velocities.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / (count - 1);
  }
  const stdDev = Math.sqrt(variance);

  const min = Math.min(...velocities);
  const max = Math.max(...velocities);

  elements.statMean.textContent = `${mean.toFixed(3)} m/s`;
  elements.statStdDev.textContent = `${stdDev.toFixed(3)} m/s`;
  elements.statMinMax.textContent = `${min.toFixed(2)} / ${max.toFixed(2)}`;
}

/* ================= CSV EXPORT & CLIPBOARD ================= */
function exportCSV() {
  if (state.runs.length === 0) {
    alert('No data to export.');
    return;
  }

  const headers = ['Run', 'Timestamp', 'Gate 1 Delta t (ms)', 'Gate 2 Delta t (ms)', 'Transit Delta t (ms)', 'Velocity (m/s)', 'Acceleration (m/s2)'];
  const csvRows = [
    headers.join(','),
    ...state.runs.map(r => [
      r.id,
      `"${r.time}"`,
      r.g1DtMs,
      r.g2DtMs,
      r.transitMs,
      r.velocity.toFixed(4),
      r.acceleration.toFixed(4)
    ].join(','))
  ];

  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `photogate_data_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function copyTableToClipboard() {
  if (state.runs.length === 0) {
    alert('No data to copy.');
    return;
  }

  const headers = ['Run\tTimestamp\tGate 1 (ms)\tGate 2 (ms)\tTransit (ms)\tVelocity (m/s)\tAccel (m/s2)'];
  const rows = state.runs.map(r => 
    `${r.id}\t${r.time}\t${r.g1DtMs}\t${r.g2DtMs}\t${r.transitMs}\t${r.velocity.toFixed(4)}\t${r.acceleration.toFixed(4)}`
  );
  const text = [headers, ...rows].join('\n');

  navigator.clipboard.writeText(text).then(() => {
    alert('Table copied to clipboard! You can paste directly into Google Sheets or Excel.');
  }).catch(err => {
    console.error('Clipboard copy failed:', err);
  });
}

function clearAllData() {
  if (confirm('Clear all recorded timing data?')) {
    state.runs = [];
    renderRunsTable();
    updateStatistics();
    elements.hudVelocity.textContent = '0.000';
    elements.hudVelocitySecondary.textContent = '0.00 cm/s';
    elements.hudTransitTime.textContent = '0.0000';
    elements.hudTransitTimeUs.textContent = '0 \u03BCs';
    elements.hudAcceleration.textContent = '0.000';
  }
}

/* ================= HARDWARE SIMULATION / MOCK RUN ================= */
function runSimulationPass() {
  const baseUs = Math.floor(performance.now() * 1000);
  const flagDurationUs = Math.floor(18000 + Math.random() * 4000); // ~20 ms flag pass
  const transitTimeUs = Math.floor(75000 + Math.random() * 15000); // ~80 ms transit

  appendTerminal('[SIM] Simulating cart passing through Gate 1 & 2...');

  // Step 1: Gate 1 Blocks
  handleSerialLine(`{"type":"event","gate":1,"state":"BLOCK","us":${baseUs}}`);

  // Step 2: Gate 1 Restores
  setTimeout(() => {
    handleSerialLine(`{"type":"event","gate":1,"state":"RESTORE","us":${baseUs + flagDurationUs}}`);
  }, 20);

  // Step 3: Gate 2 Blocks
  setTimeout(() => {
    handleSerialLine(`{"type":"event","gate":2,"state":"BLOCK","us":${baseUs + transitTimeUs}}`);
  }, 80);

  // Step 4: Gate 2 Restores
  setTimeout(() => {
    handleSerialLine(`{"type":"event","gate":2,"state":"RESTORE","us":${baseUs + transitTimeUs + flagDurationUs}}`);
  }, 100);
}

/* ================= TERMINAL OUTPUT HELPER ================= */
function appendTerminal(msg) {
  const line = `[${new Date().toLocaleTimeString()}] ${msg}\n`;
  elements.terminalOutput.textContent += line;
  elements.terminalOutput.scrollTop = elements.terminalOutput.scrollHeight;
}

/* ================= EVENT LISTENERS ================= */
elements.connectBtn.addEventListener('click', toggleSerialConnection);
elements.simModeBtn.addEventListener('click', runSimulationPass);

elements.exportCsvBtn.addEventListener('click', exportCSV);
elements.copyClipboardBtn.addEventListener('click', copyTableToClipboard);
elements.clearDataBtn.addEventListener('click', clearAllData);

elements.clearTerminalBtn.addEventListener('click', () => {
  elements.terminalOutput.textContent = '';
});

elements.pingEspBtn.addEventListener('click', () => sendSerialCommand('PING'));
elements.queryStatusBtn.addEventListener('click', () => sendSerialCommand('STATUS'));

elements.invertLogicCheckbox.addEventListener('change', (e) => {
  const cmd = e.target.checked ? 'INVERT_ON' : 'INVERT_OFF';
  sendSerialCommand(cmd);
});

elements.gateDistanceInput.addEventListener('input', (e) => {
  elements.trackDistanceBadge.textContent = `Dist: ${parseFloat(e.target.value || 0).toFixed(1)} cm`;
});

// Initial Setup
elements.trackDistanceBadge.textContent = `Dist: ${parseFloat(elements.gateDistanceInput.value).toFixed(1)} cm`;
