# THE_PROCTOR // Development Roadmap & Feature Requests

Use this document to track planned updates, logic changes, and aesthetic refinements for the proctoring ecosystem.

---

## 🚀 Current Priorities
- [ ] **Scoring Logic Hardening**: Refine the transition from percentage-based to high-fidelity point-based assessment.
- [ ] **System Stability**: Ensure "Establish Connection" sequence and login event listeners are robust.

---

## 🛠️ Planned Features & Changes

### 1. Aesthetic & UI/UX
- **Status Indicators**: Improve the "System Health" and "Sync Status" visibility for students.

### 2. Proctoring Logic
- **AI Sensitivity Toggling**: Allow the teacher to adjust the gaze/phone detection thresholds remotely.

### 3. Backend & Syncing
- **Differential Syncing**: Optimize the merging of `integrityLogs` to handle "Teacher Reset" commands more cleanly.
- **Heartbeat Reliability**: Ensure the 30-second heartbeat captures session duration accurately.

### 4. Technical Debt / Bug Fixes
- [ ] Verify `handleLogin` sequence for first-time vs. returning students.
- [ ] Audit timer logic to prevent "clock-drift" on low-power student laptops.

---

## 📝 User Notes & New Requests
*Add your specific change requests below:*

- [x] I want to control student access, in real time, to the tests from the dashboard.  This should be by class period and by student.
- [x] I want to add the ability to silence certain types of alerts.
- [x] I want to add the ability to reset a student's score from the dashboard.

---

**System Status**: `STABLE // DEVELOPMENT_MODE_ACTIVE`  
**Location**: `admin/THE_PROCTOR/`
