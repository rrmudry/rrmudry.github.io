#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

#define RELAY 18
#define RELAY_ON LOW   // Changed to LOW for Active-LOW relay
#define RELAY_OFF HIGH // Changed to HIGH for Active-LOW relay

// Nordic UART Service UUIDs
#define SERVICE_UUID           "6E400001-B5A3-F393-E0A9-E50E24DCCA9E"
#define CHARACTERISTIC_UUID_RX "6E400002-B5A3-F393-E0A9-E50E24DCCA9E"
#define CHARACTERISTIC_UUID_TX "6E400003-B5A3-F393-E0A9-E50E24DCCA9E"

BLEServer *pServer = NULL;
BLECharacteristic *pTxCharacteristic = NULL;
bool deviceConnected = false;
bool oldDeviceConnected = false;

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

// Send status to connected BLE client
void sendBleStatus() {
  if (!deviceConnected) return;

  String json = "{";
  json += "\"time\":\"" + getFormattedTime() + "\",";
  json += "\"synced\":" + String(timeSynced ? "true" : "false") + ",";
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

  uint16_t peerMtu = pServer->getPeerMTU(pServer->getConnId());
  Serial.print("Sending BLE Status, JSON length: ");
  Serial.print(json.length());
  Serial.print(", negotiated MTU: ");
  Serial.println(peerMtu);

  pTxCharacteristic->setValue((uint8_t*)json.c_str(), json.length());
  pTxCharacteristic->notify();
}

class MyServerCallbacks: public BLEServerCallbacks {
    void onConnect(BLEServer* pServer) {
      deviceConnected = true;
      Serial.println("BLE Client Connected");
    };

    void onDisconnect(BLEServer* pServer) {
      deviceConnected = false;
      Serial.println("BLE Client Disconnected");
    }
};

class MyCallbacks: public BLECharacteristicCallbacks {
    void onWrite(BLECharacteristic *pCharacteristic) {
      String cmd = pCharacteristic->getValue();

      if (cmd.length() > 0) {
        Serial.print("Received Command: ");
        Serial.println(cmd);

        if (cmd.startsWith("feed ")) {
          int dur = cmd.substring(5).toInt() * 1000;
          if (dur > 0) feedFish(dur);
          sendBleStatus();
        } 
        else if (cmd.startsWith("sync ")) {
          // Format: sync hh:mm:ss
          int h = cmd.substring(5, 7).toInt();
          int m = cmd.substring(8, 10).toInt();
          int s = cmd.substring(11, 13).toInt();
          syncTime(h, m, s);
          sendBleStatus();
        }
        else if (cmd.startsWith("add ")) {
          // Format: add hh:mm dur
          if (scheduleCount < MAX_SCHEDULES) {
            int h = cmd.substring(4, 6).toInt();
            int m = cmd.substring(7, 9).toInt();
            int dur = cmd.substring(10).toInt() * 1000;
            schedules[scheduleCount].hour = h;
            schedules[scheduleCount].minute = m;
            schedules[scheduleCount].duration = dur;
            schedules[scheduleCount].active = true;
            schedules[scheduleCount].lastTriggerDay = -1;
            scheduleCount++;
          }
          sendBleStatus();
        }
        else if (cmd.startsWith("delete ")) {
          int idx = cmd.substring(7).toInt();
          if (idx >= 0 && idx < scheduleCount) {
            for (int i = idx; i < scheduleCount - 1; i++) {
              schedules[i] = schedules[i + 1];
            }
            scheduleCount--;
          }
          sendBleStatus();
        }
        else if (cmd == "status") {
          sendBleStatus();
        }
      }
    }
};

void setup() {
  pinMode(RELAY, OUTPUT);
  digitalWrite(RELAY, RELAY_OFF);

  Serial.begin(115200);

  // Initialize BLE
  BLEDevice::init("Fish_Feeder_2");
  BLEDevice::setMTU(517); // Set local MTU preference to support larger notification packets
  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new MyServerCallbacks());

  // Create Service
  BLEService *pService = pServer->createService(SERVICE_UUID);

  // Create TX Characteristic (Notify)
  pTxCharacteristic = pService->createCharacteristic(
                      CHARACTERISTIC_UUID_TX,
                      BLECharacteristic::PROPERTY_NOTIFY
                    );
  pTxCharacteristic->addDescriptor(new BLE2902());

  // Create RX Characteristic (Write)
  BLECharacteristic *pRxCharacteristic = pService->createCharacteristic(
                                         CHARACTERISTIC_UUID_RX,
                                         BLECharacteristic::PROPERTY_WRITE
                                       );
  pRxCharacteristic->setCallbacks(new MyCallbacks());

  // Start Service
  pService->start();

  // Start Advertising
  BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  pAdvertising->setScanResponse(true);
  pAdvertising->setMinPreferred(0x06);  // helps with iOS connection issues
  pAdvertising->setMinPreferred(0x12);
  BLEDevice::startAdvertising();
  Serial.println("BLE Advertising Started (Name: Fish_Feeder_2)");

  // Pre-populate schedules
  schedules[0] = {8, 0, 3000, true, -1};
  schedules[1] = {18, 0, 5000, true, -1};
  scheduleCount = 2;
}

void loop() {
  checkSchedules();
  checkFailSafe();

  // disconnecting
  if (!deviceConnected && oldDeviceConnected) {
      delay(500); // give the bluetooth stack the chance to get things ready
      pServer->startAdvertising(); // restart advertising
      Serial.println("Restart advertising");
      oldDeviceConnected = deviceConnected;
  }
  // connecting
  if (deviceConnected && !oldDeviceConnected) {
      oldDeviceConnected = deviceConnected;
      Serial.println("BLE Connection established in loop");
  }
}