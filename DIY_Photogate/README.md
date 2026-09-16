# Seeed Studio XIAO ESP32-C3 Dual Photogate System

A high-precision physics timing system utilizing a **Seeed Studio XIAO ESP32-C3**, two visible laser diodes, and two **TEPT4400** ambient/laser phototransistors connected directly to a browser web dashboard via the **Web Serial API**.

---

## 1. Hardware Architecture & Pinout

### Board: Seeed Studio XIAO ESP32-C3
- **Gate 1 (A)**: Connected to Pin **`D0`** (GPIO 2)
- **Gate 2 (B)**: Connected to Pin **`D1`** (GPIO 3)
- **3.3V**: Power rail for lasers and phototransistors
- **GND**: Common ground

### TEPT4400 Phototransistor Wiring
The **TEPT4400** is an NPN phototransistor.

#### Recommended Wiring (Emitter-Follower / Active-HIGH when laser is hitting sensor):
1. **Collector (Long lead / flat side)**: Connect to **3.3V**.
2. **Emitter (Short lead)**: Connect to XIAO Pin (**D0** or **D1**).
3. **Pull-Down Resistor (10k&Omega; to 47k&Omega;)**: Connect between the Emitter pin and **GND**.
   - *Laser ON*: Transistor conducts &rarr; Pin reads **HIGH**.
   - *Cart/Flag blocks beam*: Transistor turns off &rarr; Resistor pulls pin to **LOW** (Triggers `BLOCK` event).

*(Note: If you wire it in Common-Emitter mode with pull-up resistors instead, simply toggle the **"Invert Logic"** checkbox in the WebApp or send `INVERT_ON` over serial).*

---

## 2. Flashing the Firmware

The firmware is located at [`firmware/xiao_esp32c3_photogate.ino`](file:///c:/Users/rmudry/Photogate/firmware/xiao_esp32c3_photogate.ino).

### Using Arduino IDE:
1. Install **Arduino IDE** (version 2.0+ recommended).
2. Add ESP32 board URL in **Preferences &rarr; Additional Boards Manager URLs**:
   ```
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
3. In **Tools &rarr; Board &rarr; esp32**, select **"XIAO_ESP32C3"**.
4. Important board settings in the **Tools** menu:
   - **USB CDC On Boot**: `"Enabled"`
   - **CPU Frequency**: `"160MHz (WiFi)"`
   - **Upload Speed**: `921600`
5. Select your COM Port and click **Upload**.

---

## 3. Launching the WebApp

Open [`index.html`](file:///c:/Users/rmudry/Photogate/index.html) in any Chromium-based desktop browser (**Google Chrome**, **Microsoft Edge**, **Opera**, or **Brave**).

### Features:
- **No Backend / Server Required**: Uses the standard **Web Serial API** natively from the browser tab over USB.
- **One-Click Connect**: Click **"Connect ESP32"**, select the XIAO ESP32-C3 port, and start collecting timing data immediately.
- **Physics Calculation Modes**:
  1. **Dual Gate Average Velocity**: $v = \frac{\Delta x}{\Delta t}$
  2. **Incline Acceleration from Rest**: $a = \frac{2\Delta x}{t^2}$
  3. **Two-Flag Acceleration**: Computes $v_1, v_2$ and $a = \frac{v_2^2 - v_1^2}{2\Delta x}$
  4. **Single Gate Flag Speed**: $v = \frac{\text{width}}{\Delta t}$
  5. **Pendulum Period**: Cycle tracking.
- **Live Statistics**: Auto-computes Mean, Standard Deviation ($\sigma$), Min, and Max.
- **Exporting**: One-click **Export to CSV** or **Copy Table** to paste directly into Google Sheets or Excel.
- **Simulation Mode**: Click **"Simulate Pass"** to test UI animations and physics math even when the hardware isn't plugged in.
