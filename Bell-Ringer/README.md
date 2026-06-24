# Physics Bell-Ringer & Auto-Grader Portal

A responsive, automated classroom bell-ringer system designed to eliminate the "wait and copy" student strategy, require zero manual grading from the teacher, and provide real-time classroom analytics.

## How It Works

1. **Teacher Setup**: The teacher launches a 4-minute countdown from the Teacher Panel, configuring a prompt linked to a Weekly Phenomenon Anchor (graph, diagram, or data table).
2. **Student Submission**: Students log in via their school Google accounts and write free-response explanations. The system automatically locks input inputs when the countdown reaches `0:00`.
3. **AI Gatekeeper**: As submissions arrive in Firestore, a backend Firebase Extension running Gemini Flash evaluates the responses for a "good-faith scientific effort" and saves the score (`1` or `0`) instantly.
4. **Live Dashboard**: A projected classroom grid shows student tiles that dynamically update:
   - **Gray (Pending)**: Not submitted or awaiting AI verification.
   - **Green (Flashes)**: Verified good-faith attempt (student is approved to move to collaborative lab tables).
   - **Red (Revision)**: Low effort, gibberish, or explicit opt-out detected (student can revise and resubmit before the lockout timer hits `0:00`).

---

## Folder Structure

* **`index.html` (Student Portal)**: The student workspace with Google Auth integration, live countdown clock, submission text area, and real-time grading feedback.
* **`dashboard.html` (Classroom Dashboard)**: A high-contrast grid projected in the room. Shows live student submission states filtered by class period and a giant digital timer. Restricted to the teacher's email.
* **`teacher.html` (Teacher Control Panel)**: Administrative control room for starting timers, configuring prompts/explanations, reviewing student submissions, and executing manual grade overrides. Restricted to the teacher's email.

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
