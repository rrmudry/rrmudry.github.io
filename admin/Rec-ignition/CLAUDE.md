# Rec-ignition

A Chrome web page that watches student progress in Firestore (class webapps) and prints positive recognition labels on a Brother QL-710W for students who stand out, either against the class or against their own history.

## Current state
- Single file: `rec-ignition.html` (v0.3). Plain HTML + JS module, Firebase JS SDK 10.x loaded from gstatic.
- Works with built-in sample data (`?demo`, localhost only). Live mode is matched to the real schema (`student_results/{assignmentId}/students/{studentId}`) and tested against fake Firebase modules in headless Chrome, **not yet against the real project**. It needs the collection-group rule and indexes in `firestore.rules` / `firestore.indexes.json` deployed.
- Scores are out of 10 (`defaultMaxScore` in Settings). Internally scores are percentages, so thresholds are in percentage points (15 = 1.5 out of 10); the screen shows them as `9/10`.
- Tested in a browser with sample data (detection, manual print, auto-print queue, hourly cap, school-hours block) with `window.print` stubbed. **Not yet printed on the real printer.**
- Preview: `.claude/launch.json` serves the folder on port 8765.

## Setup decisions
- Teacher signs in with Google. Access is decided by the Firestore rules, not the page: after sign-in the page tries a one-document collection-group read, which only admins may do. No email list lives in the page.
- Student names and activity names come from student-written documents, so they are always inserted as text (`esc`).
- The tool queries the `students` collection group, keeps only docs under `student_results` (skips `practice_results`), and reads four save-time fields (`timestamp`, `updated_at`, `updatedAt`, `submittedAt`) because the apps don't agree on one.
- Live mode polls every 60 s for docs saved since the last check, instead of a live listener. Docs carry the full `studioState`, and the apps save while students work, so this keeps reads and downloads down.
- Printer: Brother QL-710W over USB, with a **29mm (1.1") continuous roll** (DK-2210). Labels are laid out as a 90mm × 29mm strip.
- Printing goes through Chrome's print dialog to the normal Brother driver. **Do not use WebUSB/Zadig**: the teacher also uses P-touch Editor, and Zadig would break it.
- Auto-print uses a separate Chrome profile launched with `--kiosk-printing` (shortcut: `chrome.exe --user-data-dir="C:\RecIgnitionChrome" --kiosk-printing <path to html>`). That profile remembers the QL as its printer, so the teacher's normal Chrome keeps the classroom printer.
- Auto-print safeguards: nothing prints for records that already exist when the page opens, max 8 labels/hour, 10s gap, school hours 7–16, and no repeat printing of the same achievement (tracked in localStorage).

## One label per student per day
The list shows one recognition per student, and auto-print skips a student who already got a label today. When several triggers fire at once, `labelPriority` in Settings picks the winner (default: personal best, big improvement, persistence, class standout, streak). The teacher can still print by hand.

## Recognition triggers (thresholds in Settings)
Each app keeps **one document per student per assignment and overwrites it**, so history is one record per assignment and the doc only knows its latest save time. "Finished" means `isCompleted` or a non-empty `quiz_history`; apps that save neither count as finished.
1. Class standout: ≥1.5 SD above classmates who **finished** the same activity
2. Personal best: latest finished activity is a new high, ≥15 points above the student's own average, with ≥4 earlier finished activities
3. Streak: 5 school days in a row. The tool remembers the days it saw each student save (`recig-days` in localStorage), so streaks build up from when it starts running
4. Big improvement: last 2 finished activities average ≥20 points above the 3 before, **or** a Mastery Check retake ≥20 points above the first try (`quiz_history`)
5. Persistence: ≥3 Mastery Check attempts ending at ≥80% (`quiz_history`)

## To do next
- Scoring is 6 points for completing all preparation steps plus 4 for a mastery check. A score under 10 doesn't mean the assignment is unfinished.
- **New trigger: speed of progress.** Reward students who got started and made good progress, even if they aren't done. Idea: a points-per-time slope compared with classmates on the same assignment, triggered once a student reaches about 60% (6/10, all prep done).
- Answered: the apps store only the current score and a last-save time (plus `parts_progress`, `minutes` and `quiz_history`), not per-step timestamps. A speed trigger would have to track changes itself while the tool is open, or use `minutes` against `score`.
- Deploy `firestore.rules` and `firestore.indexes.json`, then try live mode signed in as the teacher. The collection-group indexes on the three extra time fields take a few minutes to build.
- Firestore quota: each poll costs at least 4 reads (one per time field) plus one per doc saved since the last poll.

## Label wording
Always very positive. The format is "Way to go, [first name]!" plus one upbeat line and the date.
