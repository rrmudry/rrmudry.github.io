# Google Classroom Gradebook Sync Dashboard

A secure local web portal and backend sync tool to manage coursework, fetch student grades from Firestore, and synchronize/return grades to Google Classroom.

---

## 🔒 Backup & Credentials Location

Because credentials and tokens must never be checked into git, they are backed up securely in your Google Drive:

* **Backup Folder Name**: `Mudry Gradebook Sync - SECURE BACKUP`
* **Contents**:
  * `client_secret_591530758858-ffgavs9fnhj7bsms67ca20cko5rj9804.apps.googleusercontent.com.json` (Google Client Secret Credentials)
  * `env.txt` (Backup of active `.env` configuration file containing the `GOOGLE_REFRESH_TOKEN` and `ADMIN_PASSWORD`)

---

## 🚀 Setup & Recovery on a New Machine

If you pull this repository onto a different computer:

1. **Get the Credentials**: Download the backup files from Google Drive.
2. **Restore files**: Place both files in the `sync-classroom` directory.
3. **Rename the environment file**: Rename `env.txt` to `.env`.
4. **Install Dependencies**:
   ```bash
   cd sync-classroom
   npm install
   ```
5. **Start the Portal**:
   ```bash
   npm start
   ```

---

## 🛠️ CLI Utilities & Commands

If you ever need to re-authenticate or run operations manually:

### 1. Perform Authentication Flow
Runs a local server to authorize your teacher Google account and logs a new Refresh Token to the console:
```bash
npm run auth
```

### 2. Launch the Secure Dashboard Portal (Default)
Launches the secure Express API server and serves the glassmorphic frontend at **`http://localhost:3000`**:
```bash
npm start
```

### 3. Run Sync Demo Script
Runs the console-based sync demo template:
```bash
npm run demo
```
