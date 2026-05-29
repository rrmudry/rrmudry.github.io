#include <WiFi.h>
#include <WebServer.h>

#define RELAY 18
#define RELAY_ON HIGH  // Change to LOW if using an Active-LOW relay
#define RELAY_OFF LOW  // Change to HIGH if using an Active-LOW relay

WebServer server(80);

const char* ssid = "Fish_Grinder"; // write SSID and password
const char* password = "kevin123";

// Timekeeping variables
unsigned long baseSecondsSinceMidnight = 0;
unsigned long baseMillis = 0;
bool timeSynced = false;

// Fail-Safe configuration
const unsigned long FAILSAFE_STARTUP_DELAY = 6 * 3600 * 1000UL; // 6 hours safety startup delay
const unsigned long FAILSAFE_INTERVAL = 12 * 3600 * 1000UL;     // 12 hours subsequent feeds
unsigned long lastFailSafeFeedMillis = 0;
bool firstFailSafeFeedDone = false;

// Schedule struct
struct FeedingSchedule {
  int hour;
  int minute;
  int duration; // in milliseconds
  bool active;
  int lastTriggerDay;
};

const int MAX_SCHEDULES = 8;
FeedingSchedule schedules[MAX_SCHEDULES];
int scheduleCount = 0;

unsigned long dayCounter = 0;
unsigned long prevSecondsSinceMidnight = 0;

void feedFish(int duration) {
  digitalWrite(RELAY, RELAY_ON);
  delay(duration);
  digitalWrite(RELAY, RELAY_OFF);
}

unsigned long getLocalSecondsSinceMidnight() {
  if (!timeSynced) return 0;
  unsigned long elapsed = (millis() - baseMillis) / 1000;
  return (baseSecondsSinceMidnight + elapsed) % 86400; // 24 hours * 3600 = 86400
}

String getFormattedTime() {
  if (!timeSynced) return "Not Synced";
  unsigned long secs = getLocalSecondsSinceMidnight();
  int h = secs / 3600;
  int m = (secs % 3600) / 60;
  int s = secs % 60;
  char buf[9];
  sprintf(buf, "%02d:%02d:%02d", h, m, s);
  return String(buf);
}

void syncTime(int h, int m, int s) {
  baseSecondsSinceMidnight = h * 3600 + m * 60 + s;
  baseMillis = millis();
  timeSynced = true;
  prevSecondsSinceMidnight = baseSecondsSinceMidnight;
}

void checkSchedules() {
  if (!timeSynced) return;
  
  unsigned long currentSecs = getLocalSecondsSinceMidnight();
  // Detect day wrap-around
  if (currentSecs < prevSecondsSinceMidnight) {
    dayCounter++;
  }
  prevSecondsSinceMidnight = currentSecs;

  int curHour = currentSecs / 3600;
  int curMin = (currentSecs % 3600) / 60;

  for (int i = 0; i < scheduleCount; i++) {
    if (schedules[i].active) {
      if (schedules[i].hour == curHour && schedules[i].minute == curMin) {
        if (schedules[i].lastTriggerDay != dayCounter) {
          feedFish(schedules[i].duration);
          schedules[i].lastTriggerDay = dayCounter;
        }
      }
    }
  }
}

void checkFailSafe() {
  if (timeSynced) return;

  unsigned long elapsed = millis() - lastFailSafeFeedMillis;
  unsigned long targetDelay = firstFailSafeFeedDone ? FAILSAFE_INTERVAL : FAILSAFE_STARTUP_DELAY;

  if (elapsed >= targetDelay) {
    feedFish(3000); // 3 seconds default fallback feed
    lastFailSafeFeedMillis = millis();
    firstFailSafeFeedDone = true;
  }
}

void handleRoot() {
  String page = R"rawliteral(
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Fish Grinder Dashboard</title>
    <style>
      :root {
        --primary: #3b82f6;
        --primary-glow: rgba(59, 130, 246, 0.3);
        --accent: #10b981;
        --danger: #ef4444;
        --warning: #f59e0b;
        --bg-gradient: linear-gradient(135deg, #0b0f19 0%, #111827 100%);
        --panel-bg: rgba(17, 24, 39, 0.7);
        --border: rgba(255, 255, 255, 0.08);
      }
      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      }
      body {
        background: var(--bg-gradient);
        color: #f3f4f6;
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 20px;
        overflow-x: hidden;
      }
      .container {
        width: 100%;
        max-width: 500px;
        display: flex;
        flex-direction: column;
        gap: 20px;
      }
      header {
        text-align: center;
        margin-bottom: 10px;
      }
      h1 {
        font-size: 1.8rem;
        font-weight: 800;
        background: linear-gradient(to right, #60a5fa, #34d399);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        letter-spacing: -0.05em;
        margin-bottom: 5px;
      }
      .time-sync-status {
        font-size: 0.8rem;
        color: #9ca3af;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
      }
      .status-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background-color: var(--danger);
      }
      .status-dot.synced {
        background-color: var(--accent);
        box-shadow: 0 0 8px var(--accent);
      }
      .glass-panel {
        background: var(--panel-bg);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border: 1px solid var(--border);
        border-radius: 20px;
        padding: 20px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
      }
      .clock-display {
        font-family: monospace;
        font-size: 2.5rem;
        font-weight: bold;
        text-align: center;
        color: #fff;
        text-shadow: 0 0 10px rgba(255, 255, 255, 0.2);
        letter-spacing: 0.05em;
      }
      .panel-title {
        font-size: 1rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        margin-bottom: 15px;
        color: #9ca3af;
        border-bottom: 1px solid var(--border);
        padding-bottom: 8px;
      }
      .btn {
        width: 100%;
        padding: 12px;
        border: none;
        border-radius: 12px;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        font-size: 0.95rem;
      }
      .btn-primary {
        background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
        color: white;
        box-shadow: 0 4px 15px var(--primary-glow);
      }
      .btn-primary:active {
        transform: scale(0.98);
      }
      .btn-danger {
        background: rgba(239, 68, 68, 0.2);
        color: #f87171;
        border: 1px solid rgba(239, 68, 68, 0.4);
      }
      .btn-danger:hover {
        background: var(--danger);
        color: white;
      }
      .form-group {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-bottom: 15px;
      }
      label {
        font-size: 0.8rem;
        font-weight: bold;
        color: #9ca3af;
        text-transform: uppercase;
      }
      input, select {
        width: 100%;
        padding: 12px;
        background: rgba(0, 0, 0, 0.3);
        border: 1px solid var(--border);
        border-radius: 12px;
        color: white;
        font-size: 1rem;
        outline: none;
      }
      input:focus, select:focus {
        border-color: var(--primary);
      }
      .schedule-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
        max-height: 250px;
        overflow-y: auto;
      }
      .schedule-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: rgba(255, 255, 255, 0.03);
        padding: 12px 15px;
        border-radius: 12px;
        border: 1px solid var(--border);
      }
      .schedule-info {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .schedule-time {
        font-size: 1.1rem;
        font-weight: bold;
        color: #fff;
      }
      .schedule-meta {
        font-size: 0.75rem;
        color: #9ca3af;
      }
      .empty-schedules {
        text-align: center;
        color: #6b7280;
        font-size: 0.85rem;
        padding: 20px 0;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <header>
        <h1>Smart Fish Feeder</h1>
        <div class="time-sync-status">
          <div id="sync-dot" class="status-dot"></div>
          <span id="sync-text">Synchronizing...</span>
        </div>
      </header>

      <!-- Fail-Safe Active Warning Alert -->
      <div class="glass-panel" id="failsafe-alert" style="display:none; border-color: rgba(245, 158, 11, 0.4); background: rgba(245, 158, 11, 0.05); animate-in fade-in duration-300;">
        <div class="panel-title" style="color: #fbbf24; border-color: rgba(245, 158, 11, 0.15);">⚠️ Backup Fail-Safe Active</div>
        <p style="font-size: 0.85rem; color: #fef08a; line-height: 1.4; margin-bottom: 12px;">
          The system rebooted and has not connected to a device. A fallback feed is scheduled to protect the fish. Connecting now will instantly restore your normal schedule.
        </p>
        <div style="font-size: 0.95rem; font-family: monospace; font-weight: bold; color: #fff; text-align: center; background: rgba(0,0,0,0.3); padding: 10px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.05);" id="failsafe-timer">
          Next backup feed in: --:--:--
        </div>
      </div>

      <!-- Live Clock Panel -->
      <div class="glass-panel">
        <div class="panel-title">Current Time</div>
        <div id="clock" class="clock-display">--:--:--</div>
      </div>

      <!-- Manual Feed Panel -->
      <div class="glass-panel">
        <div class="panel-title">Manual Override</div>
        <div class="form-group">
          <label for="manual-duration">Food Amount (seconds)</label>
          <input type="number" id="manual-duration" value="3" min="1" max="20">
        </div>
        <button class="btn btn-primary" onclick="feedNow()">Feed Now</button>
      </div>

      <!-- Schedule Manager Panel -->
      <div class="glass-panel">
        <div class="panel-title">Feeding Schedule</div>
        <div class="schedule-list" id="schedule-container">
          <div class="empty-schedules">Loading schedules...</div>
        </div>
      </div>

      <!-- Add Schedule Panel -->
      <div class="glass-panel">
        <div class="panel-title">Add Scheduled Feed</div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
          <div class="form-group">
            <label for="sched-time">Time</label>
            <input type="time" id="sched-time" value="08:00">
          </div>
          <div class="form-group">
            <label for="sched-duration">Amount (secs)</label>
            <input type="number" id="sched-duration" value="3" min="1" max="20">
          </div>
        </div>
        <button class="btn btn-primary" style="margin-top: 10px;" onclick="addSchedule()">Add Schedule</button>
      </div>
    </div>

    <script>
      let isSynced = false;

      function updateClockAndStatus() {
        fetch('/status')
          .then(res => res.json())
          .then(data => {
            document.getElementById('clock').innerText = data.time;
            isSynced = data.synced;
            
            const dot = document.getElementById('sync-dot');
            const text = document.getElementById('sync-text');
            if (isSynced) {
              dot.classList.add('synced');
              text.innerText = "Time Synced with Device";
            } else {
              dot.classList.remove('synced');
              text.innerText = "Time Out of Sync (Syncing...)";
              autoSyncTime();
            }

            // Render Fail-Safe Banner
            const fsAlert = document.getElementById('failsafe-alert');
            if (data.failsafe) {
              fsAlert.style.display = 'block';
              const sTotal = data.next_failsafe;
              const h = Math.floor(sTotal / 3600).toString().padStart(2, '0');
              const m = Math.floor((sTotal % 3600) / 60).toString().padStart(2, '0');
              const s = (sTotal % 60).toString().padStart(2, '0');
              document.getElementById('failsafe-timer').innerText = `Next backup feed in: ${h}:${m}:${s}`;
            } else {
              fsAlert.style.display = 'none';
            }

            // Render schedules
            const container = document.getElementById('schedule-container');
            if (data.schedules.length === 0) {
              container.innerHTML = '<div class="empty-schedules">No feedings scheduled.</div>';
            } else {
              let html = '';
              data.schedules.forEach(item => {
                html += `
                  <div class="schedule-item">
                    <div class="schedule-info">
                      <span class="schedule-time">${item.time}</span>
                      <span class="schedule-meta">Duration: ${item.duration}s (${item.duration <= 3 ? 'Light' : item.duration <= 5 ? 'Medium' : 'Heavy'} Feed)</span>
                    </div>
                    <button class="btn btn-danger" style="width: auto; padding: 6px 12px; border-radius: 8px; font-size: 0.8rem;" onclick="deleteSchedule(${item.id})">Delete</button>
                  </div>
                `;
              });
              container.innerHTML = html;
            }
          })
          .catch(err => console.error("Error fetching status:", err));
      }

      function autoSyncTime() {
        const now = new Date();
        const h = now.getHours();
        const m = now.getMinutes();
        const s = now.getSeconds();
        fetch(`/sync_time?h=${h}&m=${m}&s=${s}`)
          .then(() => {
            console.log(`Synchronized time to: ${h}:${m}:${s}`);
            updateClockAndStatus();
          });
      }

      function feedNow() {
        const dur = document.getElementById('manual-duration').value;
        fetch(`/feed?duration=${dur}`);
      }

      function addSchedule() {
        const timeVal = document.getElementById('sched-time').value;
        if (!timeVal) return;
        const [h, m] = timeVal.split(':').map(Number);
        const dur = document.getElementById('sched-duration').value;
        
        fetch(`/add_schedule?h=${h}&m=${m}&duration=${dur}`)
          .then(() => {
            updateClockAndStatus();
          });
      }

      function deleteSchedule(id) {
        fetch(`/delete_schedule?id=${id}`)
          .then(() => {
            updateClockAndStatus();
          });
      }

      // Initial run
      autoSyncTime();
      setInterval(updateClockAndStatus, 1000);
    </script>
  </body>
  </html>
  )rawliteral";
  server.send(200, "text/html", page);
}

void handleStatus() {
  String json = "{";
  json += "\"time\":\"" + getFormattedTime() + "\",";
  json += "\"synced\":" + String(timeSynced ? "true" : "false") + ",";
  
  // Fail-Safe parameters
  json += "\"failsafe\":" + String(!timeSynced ? "true" : "false") + ",";
  unsigned long nextFailsafeSecs = 0;
  if (!timeSynced) {
    unsigned long elapsed = millis() - lastFailSafeFeedMillis;
    unsigned long targetDelay = firstFailSafeFeedDone ? FAILSAFE_INTERVAL : FAILSAFE_STARTUP_DELAY;
    if (targetDelay > elapsed) {
      nextFailsafeSecs = (targetDelay - elapsed) / 1000;
    }
  }
  json += "\"next_failsafe\":" + String(nextFailsafeSecs) + ",";
  
  json += "\"schedules\":[";
  for (int i = 0; i < scheduleCount; i++) {
    if (i > 0) json += ",";
    json += "{";
    json += "\"id\":" + String(i) + ",";
    char timeBuf[6];
    sprintf(timeBuf, "%02d:%02d", schedules[i].hour, schedules[i].minute);
    json += "\"time\":\"" + String(timeBuf) + "\",";
    json += "\"duration\":" + String(schedules[i].duration / 1000) + ",";
    json += "\"active\":" + String(schedules[i].active ? "true" : "false");
    json += "}";
  }
  json += "]}";
  server.send(200, "application/json", json);
}

void handleFeed() {
  int duration = 3000;
  if (server.hasArg("duration")) {
    duration = server.arg("duration").toInt() * 1000;
  }
  feedFish(duration);
  server.send(200, "text/plain", "Fed!");
}

void handleSyncTime() {
  if (server.hasArg("h") && server.hasArg("m") && server.hasArg("s")) {
    int h = server.arg("h").toInt();
    int m = server.arg("m").toInt();
    int s = server.arg("s").toInt();
    syncTime(h, m, s);
    server.send(200, "text/plain", "Time Synced");
  } else {
    server.send(400, "text/plain", "Missing time arguments");
  }
}

void handleAddSchedule() {
  if (scheduleCount >= MAX_SCHEDULES) {
    server.send(400, "text/plain", "Schedule Limit Reached");
    return;
  }
  if (server.hasArg("h") && server.hasArg("m") && server.hasArg("duration")) {
    int h = server.arg("h").toInt();
    int m = server.arg("m").toInt();
    int dur = server.arg("duration").toInt() * 1000;
    
    schedules[scheduleCount].hour = h;
    schedules[scheduleCount].minute = m;
    schedules[scheduleCount].duration = dur;
    schedules[scheduleCount].active = true;
    schedules[scheduleCount].lastTriggerDay = -1;
    scheduleCount++;
    
    server.send(200, "text/plain", "Added");
  } else {
    server.send(400, "text/plain", "Missing arguments");
  }
}

void handleDeleteSchedule() {
  if (server.hasArg("id")) {
    int idx = server.arg("id").toInt();
    if (idx >= 0 && idx < scheduleCount) {
      for (int i = idx; i < scheduleCount - 1; i++) {
        schedules[i] = schedules[i + 1];
      }
      scheduleCount--;
      server.send(200, "text/plain", "Deleted");
    } else {
      server.send(400, "text/plain", "Invalid ID");
    }
  } else {
    server.send(400, "text/plain", "Missing ID");
  }
}

void setup() {
  pinMode(RELAY, OUTPUT);
  digitalWrite(RELAY, RELAY_OFF);

  Serial.begin(115200);

  WiFi.softAP(ssid, password);

  Serial.println("Access Point Started");
  Serial.println(WiFi.softAPIP());

  server.on("/", handleRoot);
  server.on("/status", handleStatus);
  server.on("/feed", handleFeed);
  server.on("/sync_time", handleSyncTime);
  server.on("/add_schedule", handleAddSchedule);
  server.on("/delete_schedule", handleDeleteSchedule);

  server.begin();

  // Populate some default schedules for convenience
  schedules[0] = {8, 0, 3000, true, -1};
  schedules[1] = {18, 0, 5000, true, -1};
  scheduleCount = 2;
}

void loop() {
  server.handleClient();
  checkSchedules();
  checkFailSafe();
}