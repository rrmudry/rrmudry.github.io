Summary: 
System built around an ESP32 DevKit V1 (Type-C) controlling a 5 V relay module, which switches power to a motorized pepper grinder used as the feeder mechanism.
The ESP32 runs in Wi-Fi Access Point mode (insert SSID + password in code), creating its own network. A web server runs on port 80. When a phone connects to the ESP32 and visits 192.168.4.1, the ESP32 serves an HTML page with a way to manually activate the relay, change the time it stays on for, and a scheduled time for feeding.
5V pin on the ESP, by default, is set to "active LOW," but change HIGH and LOW in code accordingly.

Hardware used

- ESP32 DevKit V1 (Wi-Fi microcontroller, runs the web server)

- 5V relay module (electronic switch)

- Electric pepper grinder (motor + food container, battery-powered)

- Jumper wires

Pins used

- D18 → Relay IN (GPIO18 in code)

- VIN → Relay VCC (5V supply)

- GND → Relay GND

- Relay COM/NC → In series with grinder power line