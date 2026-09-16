/*
 * Seeed Studio XIAO ESP32-C3 Dual Laser Photogate System
 * 
 * Hardware Pinout:
 *   - Photogate 1: Pin D0 (GPIO 2 / ADC1_CH2)
 *   - Photogate 2: Pin D1 (GPIO 3 / ADC1_CH3)
 *   - Sensors: TEPT4400 Phototransistors + Visible Laser Diodes
 * 
 * Timing Precision: Microsecond hardware timestamps via micros() in IRAM ISR
 * Communication: USB Serial CDC at 115200 baud (JSON Event Stream)
 * 
 * In Arduino IDE Tools Menu:
 *   - Board: "XIAO_ESP32C3" (from esp32 by Espressif)
 *   - USB CDC On Boot: "Enabled"
 *   - CPU Frequency: "160MHz (WiFi)"
 */

#include <Arduino.h>

// Pin Definitions for Seeed Studio XIAO ESP32-C3
#ifndef D0
#define D0 2
#endif
#ifndef D1
#define D1 3
#endif

const uint8_t PIN_GATE1 = D0; // Gate A
const uint8_t PIN_GATE2 = D1; // Gate B

// Debounce lockout threshold in microseconds (default 200us to ignore optical flicker)
const uint32_t DEBOUNCE_US = 200;

// Configuration:
// Set to true if beam intact = HIGH, beam blocked = LOW (Pull-down / Emitter-Follower)
// Set to false if beam intact = LOW, beam blocked = HIGH (Pull-up / Collector-to-pin)
volatile bool invertLogic = false;

// Ring buffer for ISR events to keep ISRs lightning fast (< 1 microsecond execution)
struct GateEvent {
  uint8_t gate;       // 1 or 2
  bool blocked;       // true = beam interrupted, false = beam restored
  uint32_t timestamp; // micros() timestamp
};

const uint8_t QUEUE_SIZE = 64;
volatile GateEvent eventQueue[QUEUE_SIZE];
volatile uint8_t queueHead = 0;
volatile uint8_t queueTail = 0;

// Last state tracking for debouncing
volatile uint32_t lastGate1Us = 0;
volatile uint32_t lastGate2Us = 0;
volatile int lastGate1State = -1;
volatile int lastGate2State = -1;

// ISR for Gate 1 (Pin D0)
void IRAM_ATTR isrGate1() {
  uint32_t now = micros();
  int rawState = digitalRead(PIN_GATE1);
  if (rawState == lastGate1State) return;
  if ((now - lastGate1Us) < DEBOUNCE_US) return;

  lastGate1Us = now;
  lastGate1State = rawState;

  bool isBlocked = invertLogic ? (rawState == HIGH) : (rawState == LOW);

  uint8_t nextHead = (queueHead + 1) % QUEUE_SIZE;
  if (nextHead != queueTail) { // Check if queue is not full
    eventQueue[queueHead].gate = 1;
    eventQueue[queueHead].blocked = isBlocked;
    eventQueue[queueHead].timestamp = now;
    queueHead = nextHead;
  }
}

// ISR for Gate 2 (Pin D1)
void IRAM_ATTR isrGate2() {
  uint32_t now = micros();
  int rawState = digitalRead(PIN_GATE2);
  if (rawState == lastGate2State) return;
  if ((now - lastGate2Us) < DEBOUNCE_US) return;

  lastGate2Us = now;
  lastGate2State = rawState;

  bool isBlocked = invertLogic ? (rawState == HIGH) : (rawState == LOW);

  uint8_t nextHead = (queueHead + 1) % QUEUE_SIZE;
  if (nextHead != queueTail) {
    eventQueue[queueHead].gate = 2;
    eventQueue[queueHead].blocked = isBlocked;
    eventQueue[queueHead].timestamp = now;
    queueHead = nextHead;
  }
}

void setup() {
  // Start USB CDC Serial
  Serial.begin(115200);
  
  // Wait up to 3 seconds for USB serial monitor to attach
  uint32_t startWait = millis();
  while (!Serial && (millis() - startWait < 3000)) {
    delay(10);
  }
  
  // Configure photogate pins
  pinMode(PIN_GATE1, INPUT);
  pinMode(PIN_GATE2, INPUT);

  // Initialize previous states
  lastGate1State = digitalRead(PIN_GATE1);
  lastGate2State = digitalRead(PIN_GATE2);

  // Attach hardware interrupts on any state transition
  attachInterrupt(digitalPinToInterrupt(PIN_GATE1), isrGate1, CHANGE);
  attachInterrupt(digitalPinToInterrupt(PIN_GATE2), isrGate2, CHANGE);

  delay(200);

  // Emit system startup banner
  Serial.println();
  Serial.println("{\"type\":\"ready\",\"board\":\"XIAO_ESP32-C3\",\"version\":\"1.0.0\",\"gate1_pin\":\"D0\",\"gate2_pin\":\"D1\"}");
  
  // Emit initial gate states
  bool g1Blocked = invertLogic ? (lastGate1State == HIGH) : (lastGate1State == LOW);
  bool g2Blocked = invertLogic ? (lastGate2State == HIGH) : (lastGate2State == LOW);
  
  Serial.printf("{\"type\":\"status\",\"g1\":%s,\"g2\":%s,\"raw1\":%d,\"raw2\":%d,\"us\":%lu}\n", 
                g1Blocked ? "\"BLOCKED\"" : "\"CLEAR\"", 
                g2Blocked ? "\"BLOCKED\"" : "\"CLEAR\"", 
                lastGate1State, lastGate2State,
                micros());
  Serial.flush();
}

// Process incoming serial commands from the WebApp
void handleSerialCommands() {
  if (Serial.available() > 0) {
    String cmd = Serial.readStringUntil('\n');
    cmd.trim();
    if (cmd.length() == 0) return;

    if (cmd.equalsIgnoreCase("PING")) {
      Serial.printf("{\"type\":\"pong\",\"us\":%lu}\n", micros());
      Serial.flush();
    } 
    else if (cmd.equalsIgnoreCase("STATUS")) {
      int r1 = digitalRead(PIN_GATE1);
      int r2 = digitalRead(PIN_GATE2);
      bool g1B = invertLogic ? (r1 == HIGH) : (r1 == LOW);
      bool g2B = invertLogic ? (r2 == HIGH) : (r2 == LOW);
      Serial.printf("{\"type\":\"status\",\"g1\":%s,\"g2\":%s,\"raw1\":%d,\"raw2\":%d,\"us\":%lu}\n",
                    g1B ? "\"BLOCKED\"" : "\"CLEAR\"",
                    g2B ? "\"BLOCKED\"" : "\"CLEAR\"",
                    r1, r2, micros());
      Serial.flush();
    } 
    else if (cmd.equalsIgnoreCase("INVERT_ON")) {
      invertLogic = true;
      Serial.println("{\"type\":\"config\",\"invertLogic\":true}");
      Serial.flush();
    } 
    else if (cmd.equalsIgnoreCase("INVERT_OFF")) {
      invertLogic = false;
      Serial.println("{\"type\":\"config\",\"invertLogic\":false}");
      Serial.flush();
    }
  }
}

void loop() {
  // Service serial commands
  handleSerialCommands();

  // Dequeue events recorded by ISRs
  while (queueTail != queueHead) {
    uint8_t gate = eventQueue[queueTail].gate;
    bool blocked = eventQueue[queueTail].blocked;
    uint32_t ts = eventQueue[queueTail].timestamp;
    queueTail = (queueTail + 1) % QUEUE_SIZE;

    // Send formatted JSON event over serial
    // Format: {"type":"event","gate":1,"state":"BLOCK","us":12345678}
    Serial.printf("{\"type\":\"event\",\"gate\":%d,\"state\":\"%s\",\"us\":%lu}\n",
                  gate,
                  blocked ? "BLOCK" : "RESTORE",
                  ts);
  }

  // Yield to RTOS idle task
  delay(1);
}
