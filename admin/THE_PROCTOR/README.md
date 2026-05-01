# THE_PROCTOR // Secure Integrity Node
## Documentation for Students, Parents, and Administration

THE_PROCTOR is a high-security, AI-assisted examination environment designed to maintain academic integrity while prioritizing user privacy and data security. Unlike traditional proctoring software, THE_PROCTOR leverages "Edge AI" to process all monitoring locally on the student's device.

---

### 1. How It Works
THE_PROCTOR uses the student's webcam and browser environment to monitor for prohibited behaviors during an assessment. The system focuses on three primary areas:
- **Object Detection**: Identifying unauthorized devices (e.g., cell phones, tablets) in the frame using the COCO-SSD model.
- **Behavioral Analysis (BlazeFace)**: Using ultra-fast face tracking to detect gaze patterns and head orientation.
- **Interface Hardening**: Preventing tab-switching, unauthorized copy/pasting, and right-click menu access.

### 2. Technical Profile: BlazeFace AI
THE_PROCTOR utilizes **BlazeFace**, a lightweight and high-performance face detector developed by Google Research. 

#### **How It Works**
BlazeFace identifies 6 key facial landmarks (eyes, ears, nose, and mouth) in every frame of the video feed. Our system uses these points to calculate a **Pitch Ratio**:
- By comparing the vertical distance between the eyes and nose versus the nose and mouth, the AI can mathematically determine if a student is looking down at a hidden device or notes.
- This calculation is performed **20+ times per second**, allowing for precise detection of head-tilt patterns that fall outside the calibrated "forward-facing" baseline.

#### **Privacy Impact**
Because BlazeFace is designed for mobile and web performance, it allows all facial analysis to occur **entirely within the browser's memory**. At no point are facial "fingerprints" created, nor is the raw biometric data ever stored or transmitted. The system only reports the resulting "Gaze Ratio" number, ensuring student anonymity is maintained.

### 2. Privacy Policy & Philosophy
**We prioritize "Privacy by Design."** Our core philosophy is that monitoring should never involve surveillance or recording.

#### **Personal Privacy**
- **No Video Recording**: The application **never** records video or takes photographs.
- **Local AI Processing**: All video analysis is performed in real-time within the student's browser using TensorFlow.js. The video feed remains on the student's local hardware and is never transmitted over the internet.
- **Camera Visibility**: Students can see exactly what the AI sees via a local preview window, ensuring full transparency of the monitoring process.

#### **Data Privacy**
- **What is Collected?**: The only data sent to the secure database is **behavioral metadata** (e.g., "Student ID 123456 switched tabs at 10:15 AM"). 
- **Score Data**: Standard academic data (test scores and student identity) are stored securely and are only accessible by the course instructor.

### 3. Data Security
THE_PROCTOR utilizes industry-standard security protocols:
- **Encryption**: All communication between the client node and the teacher dashboard is encrypted via SSL/TLS.
- **Secure Backend**: Data is stored in a hardened Supabase instance with strict Row-Level Security (RLS) policies to prevent unauthorized access.
- **Ephemeral Sessions**: Proctoring state is active only during the duration of the assessment. Once the test is submitted, all AI processes and camera access are immediately terminated.

### 4. Information for Stakeholders

#### **For Students**
THE_PROCTOR is designed to be a "silent assistant" that ensures a level playing field for all test-takers. It does not store your image, listen to your audio, or track your behavior outside of the active testing window.

#### **For Parents**
We understand concerns regarding student privacy. THE_PROCTOR was built specifically to avoid the privacy pitfalls of third-party proctoring services. By keeping all "eyes" local to the machine and only reporting "events" rather than "images," therefore protecting their privacy and the integrity of the assessment.

#### **For Administration**
THE_PROCTOR provides a scalable, cost-effective solution for academic integrity that complies with modern data protection standards. It eliminates the need for invasive system-level software installations, running entirely within a standard, modern web browser.

---

**System Status**: `STABLE // INTEGRITY_NODE_ACTIVE`  
**Developer**: Room 930  
**Version**: 2.0.1 (Template)
