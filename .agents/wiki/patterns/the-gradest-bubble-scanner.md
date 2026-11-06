# The Gradest: Bubble Sheet Generator & Webcam Scanner Architecture

## 1. Overview & Dual-Repository Deployment
- **Repository Structure**:
  - `The_Gradest` is maintained as an independent repository deployed to GitHub Pages at `https://rrmudry.github.io/The_Gradest/`.
  - A local clone also resides at `admin/The_Gradest/` inside `rrmudry.github.io` (ignored in `.gitignore` to prevent nested git conflicts).
  - Whenever modifying scanner, generator, or UI code, ensure changes are committed and pushed to `The_Gradest` origin `main`.

## 2. Webcam Scanner & OMR Pipeline
- **Sub-Second Client-Side Recognition**:
  - Native WebRTC stream (`scanner-video`) mapped to internal 450x594 Canvas (`250:330` aspect ratio matching 4-up Letter cards).
  - Dynamic Percentile Thresholding (samples 1,000 pixels; scales between 2nd and 96th brightness percentiles).
  - BFS blob extraction with Solidity filtering ($\ge 0.58$) and outer-ring margin isolation to reject interior QR codes and non-fiducial clutter.
  - Projective homography corrects pitch, yaw, and paper tilt.
  - Percentile sub-sampling averages the darkest 45% of pixels inside inner bubble radius to isolate graphite/ink from smudges.

## 3. Manual Grade Entry for Non-Bubbled Sheets
- **The Problem**:
  - In a real classroom, students occasionally turn in work on paper without bubbling the answer sheet (e.g. absent makeups, torn sheets, or writing answers directly without bubbling).
  - Requiring teachers to leave the webcam scanner to record these grades disrupts grading momentum.
- **The Solution: Integrated Manual Entry Modal**:
  - Accessible directly on the Webcam Scanner tab via:
    1. Primary button: `btn-manual-entry-scan` beside camera controls.
    2. Header action: `btn-quick-manual-output` in Scanner Output panel.
    3. Empty-state button: `btn-scanner-empty-manual` on `#scanner-placeholder`.
    4. Grades Directory button: `btn-grades-manual-entry`.
  - **Features**:
    - **Roster Dropdown with Graded Status**: Auto-populates from both local assignment roster and global Firestore roster. Displays student name, ID, and graded status (e.g. `✓ Graded: 92/100 (92%)` vs `[Not yet graded]`), plus an ungraded student counter.
    - **Instant ID Keystroke Lookup**: Typing a 3–10 digit Student ID auto-fills the student's name and alerts if the student already has a recorded score.
    - **Score & Denominator Display**: Inputs validate between 0 and `maxScore`, with denominator e.g. `/ 100`.
    - **Live Percentage Calculation**: Updates color-coded percentage badges in real time (Emerald $\ge 80\%$, Amber $60-79\%$, Rose $< 60\%$).
    - **Quick Score Presets**: Fast-tap percentage chips (`100%`, `90%`, `80%`, `70%`, `50%`, `0% Missing`).
    - **Batching Workflow ("Save & Add Another")**: Lets the teacher record multiple unbubbled sheets in sequence without dismissing the modal.
    - **Dual Persistence & Sync**: Saves to `state.grades` with status `"Manually Entered"`, updates Session Log in the scanner sidebar, updates Grades Directory and Stats, and syncs immediately to local storage and Cloud Firestore (`gradest_assignments`).

## 4. Embedding Integrated OMR Bubble Cards Directly into Printable Worksheets
- **Eliminating Stapled Bubble Sheets**:
  - Any 2-page printable worksheet can embed a native `The_Gradest` OMR Bubble Card directly into the top-right corner of Page 1 (`width: 2.28in; height: 3.01in;`, preserving the exact `250:330` aspect ratio) alongside the header and experimental setup card.
- **Strict Homography & Coordinate Invariants (`viewBox="0 0 250 330"`)**:
  - **4 Asymmetric Fiducial Anchors**:
    - Top-Left Square: `<rect x="7" y="7" width="16" height="16" fill="#000000"/>` (center `15, 15`)
    - Top-Right Square: `<rect x="227" y="7" width="16" height="16" fill="#000000"/>` (center `235, 15`)
    - Bottom-Left Circle: `<circle cx="15" cy="315" r="7.0" fill="#000000"/>` (center `15, 315`)
    - Bottom-Right Circle: `<circle cx="235" cy="315" r="7.0" fill="#000000"/>` (center `235, 315`)
  - **Student ID Grid (6 columns, 10 rows)**: `x = 25 + col * 14` (`col = 0..5`), `y = 115 + row * 14` (`row = 0..9`), bubble radius `r="4.5"`.
  - **Score Grid (`D` columns, 10 rows)**: `x = 135 + col * 14` (`D = 1` for Max Score `<= 9`, `D = 2` for `10..99`, `D = 3` for `100+`), `y = 115 + row * 14`, bubble radius `r="4.5"`.
  - **Embedded QR Code Isolation**: Place the static SVG `<path>` QR code at `(172, 248)` with module size `1.75` (`50.75 × 50.75` pt) so it leaves a generous white margin around the Bottom-Right fiducial circle at `(235, 315)` (satisfying `isIsolatedMarginFiducial()`).
