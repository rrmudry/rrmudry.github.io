# Wiki Evolution Log

Append-only log tracking pattern changes across sessions.

---

## 2026-08-29 — Initial Seed (WikiSkill Architecture)

**Motivation**: Applied [WikiSkill](https://arxiv.org/html/2608.27454) three-layer architecture (Raw → Wiki → Skills) to the existing agent customization setup.

**Changes**:
- Created `wiki/index.md` catalog
- Created `wiki/logs.md` (this file)
- Created 6 initial pattern pages by analyzing the existing codebase:
  - `dashboard-layout.md` — from 6 unit dashboards (unit1–unit7, no unit3)
  - `firebase-auth-gotchas.md` — from workflow docs + webapp code
  - `ngss-integration.md` — from `assets/ngss-helper.js` + dashboard usage
  - `mobile-responsive.md` — from `assets/theme.css` + dashboard + game CSS
  - `phaser-game-structure.md` — from `skydiving-game/` and other game dirs
  - `bell-ringer-config.md` — from `Bell-Ringer/README.md` + Firestore schema

**Sources analyzed**:
- `assets/ngss-helper.js` (252 lines)
- `assets/partials.js` (79 lines)
- `assets/theme.css` (518 lines)
- `unit1-dashboard.html` through `unit7-dashboard.html` (6 files)
- `skydiving-game/` directory (7 files)
- `Bell-Ringer/README.md` (98 lines)
- `.agent/workflows/create-student-webapp.md`
- `.agent/workflows/create-secure-webapp.md`

---

## 2026-08-30 — Unit 2: 5-Week Kinematics & Newton's Laws Architecture

**Motivation**: Created the comprehensive 5-week (25 instructional days) Unit 2 curriculum following Option A (Kinematics First, Dynamics Second) to prevent the Aristotelian force=speed misconception.

**Changes**:
- Created `Unit_2/` directory
- Created `Unit_2/outline.md`: Full 5-week pedagogical blueprint, weekly learning goals, DOK levels, and materials checklist
- Created `Unit_2/Fantasy_Map_Quest_Project.md`: Printable student partner project guide for distance vs displacement
- Created `Unit_2/lesson.json`: Standard JSON array containing all 25 daily lesson objects with explicit NGSS tagging, WICOR strategies, and daily bell-ringer prompts (featuring Day 1 Fantasy Map Quest)
- Created `Unit_2/unit2_lessons.json`: JavaScript export (`const unit2Lessons = [...]`) matching `unit1_lessons.json` pattern
- Updated `unit2-dashboard.html` to load `Unit_2/unit2_lessons.json` directly with fallback to `lessonsData`
- Updated `Bell-Ringer/teacher.html` to add Unit 2 to the unit select dropdown and calendar loader
- Synchronized `assets/lessons-data.js` with the 25-day Unit 2 sequence
- Paced the Fantasy Map Quest across a 3-day arc (Days 1–3) to account for 45-minute periods (~30 min active work time), seamlessly integrating terrain travel-time speed calculations and the Homecoming Paradox.
- Linked official classroom resources (`Distance and Displacement with Fantasy Maps.pptx` and `Fantasy Map Measurements.docx`) directly across `outline.md`, `lesson.json`, `unit2_lessons.json`, `lessons-data.js`, `Fantasy_Map_Quest_Project.md`, and `unit2-dashboard.html`.


