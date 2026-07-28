# Physics Bell-Ringer & Auto-Grader Portal

A responsive, automated classroom bell-ringer system designed to eliminate the "wait and copy" student strategy, require zero manual grading from the teacher, and provide real-time classroom analytics.

## How It Works

1. **Teacher Setup**: The teacher selects a **Target Class Period** (`Period 0` through `Period 6` or `All Periods`) and configures an activity (Free Response Explanation, Connections Grid Game, or Concept Chat AI Mentor). Clicking **⚡ Launch Timer** starts the countdown across connected devices.
2. **Period Access Gate & Student Submission**: Students log in via their school Google accounts. The portal verifies their enrolled `class_period` against the central Firestore `roster`. 
   - **Matching Period**: The student gains instant access to the active prompt, countdown clock, and submission workspace. Inputs automatically lock when the timer reaches `0:00`.
   - **Non-Matching Period**: The student sees a waiting screen informing them which period's activity is currently active.
3. **AI Gatekeeper**: As submissions arrive in Firestore, a backend Firebase Extension running Gemini Flash evaluates responses for a "good-faith scientific effort" and saves the score (`1` or `0`) instantly.
4. **Live Dashboard**: A projected classroom grid shows student tiles that dynamically update and automatically syncs to the active period launched by the teacher:
   - **Gray (Pending)**: Not submitted or awaiting AI verification.
   - **Green (Flashes)**: Verified good-faith attempt (student is approved to move to collaborative lab tables).
   - **Red (Revision)**: Low effort, gibberish, or explicit opt-out detected (student can revise and resubmit before lockout).

---

## Folder Structure

* **`index.html` (Student Portal)**: The student workspace with Google Auth integration, automatic `roster` period lookup, live countdown clock, activity panels (Free Response / Connections / AI Chat), and real-time grading feedback.
* **`dashboard.html` (Classroom Dashboard)**: A high-contrast grid projected in the room. Shows live student submission states filtered by class period (`Period 0-6`) and a giant digital timer. Auto-syncs to the live period launched by the teacher.
* **`teacher.html` (Teacher Control Panel)**: Administrative control room featuring a solid auth shield overlay, lesson calendar auto-loader, **Target Class Period** selector (`Period 0-6` / `All Periods`), activity configuration, live student submission feed, and manual grade overrides. Restricted to authorized teacher accounts.

---

## Data Model & Firestore Collections

* **`system_config/bellringer_timer`**: Active session control document.
  - `isActive`: boolean
  - `targetPeriod`: string (`"all"`, `"0"`, `"1"`, `"2"`, `"3"`, `"4"`, `"5"`, `"6"`)
  - `activityType`: string (`"free_response"`, `"connections"`, `"concept_chat"`)
  - `promptQuestion`: string
  - `timerExpiresAt`: timestamp
* **`roster`**: Central student roster collection.
  - Document ID: `student_id` (e.g., student email handle)
  - `class_period`: integer/string (`0` through `6`)
  - `first_name`, `last_name`: strings
* **`bellringers`**: Live student submissions collection evaluated by Firebase Gemini extension.

---

## Installation & Setup

### 1. Firebase Gemini Extension
Install the **"Multimodal Tasks with the Gemini API"** extension in your Firebase Console. Configure it with the following parameters:

* **Firestore Collection Path**: `bellringers`
* **Model**: `gemini-3.5-flash` (or `gemini-flash-latest`, or a Lite model like `gemini-2.5-flash-lite` if experiencing free-tier quota limits)
* **Prompt**:
  ```text
  You are a physics teaching assistant grading for good-faith effort. Review the student's answer: {{studentResponse}} to the prompt: {{promptQuestion}}. Output exactly a '1' if they made an honest, good-faith attempt using scientific context/English words (even if the physics logic is wrong). Output a '0' if it is gibberish, letters mashed together, explicit opt-outs like 'idk', or completely unrelated text. Return ONLY the digit 1 or 0.
  ```
* **Response Field**: `effortScore`
* **API Key**: Input your Gemini API key (stored securely in Google Cloud Secret Manager).

### 2. Firestore Security Rules
Ensure your `firestore.rules` file contains the following rules to secure the submissions and configurations:

```javascript
// System Config (Required for student timer sync)
match /system_config/{configDoc} {
  allow read: if true;
}

// Roster Collection
match /roster/{studentId} {
  allow read: if request.auth != null;
}

// Bellringers Collection
match /bellringers/{docId} {
  allow read: if request.auth != null && 
                 isAuthorizedEmail(request.auth.token.email) &&
                 (resource.data.studentId == request.auth.token.email.lower().split('@')[0] || isAdmin());
  allow create, update: if request.auth != null &&
                           isAuthorizedEmail(request.auth.token.email) &&
                           request.resource.data.studentId == request.auth.token.email.lower().split('@')[0];
}
```

---

## How to Run & Deploy

### Local Development
To run the server locally for testing:
```bash
npm run dev
```
Open `http://localhost:8080/Bell-Ringer/` in your browser.

### Deploying to GitHub Pages
To build and publish changes directly to your live GitHub Pages site:
```bash
npm run deploy
```
