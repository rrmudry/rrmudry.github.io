# Rec-ignition

A Chrome web page that watches student progress in Firestore (class webapps) and prints positive recognition labels on a Brother QL-710W for students who stand out, either against the class or against their own history.

## Current state
- Single file: `rec-ignition.html` (v0.2). Plain HTML + JS module, Firebase JS SDK 10.x loaded from gstatic.
- Works with built-in sample data. Live Firestore mode is written but **not yet matched to the real schema**. Field names in Settings are placeholders.
- Scores are out of 10 (`defaultMaxScore` in Settings). Internally scores are percentages, so thresholds are in percentage points (15 = 1.5 out of 10); the screen shows them as `9/10`.
- Tested in a browser with sample data (detection, manual print, auto-print queue, hourly cap, school-hours block) with `window.print` stubbed. **Not yet printed on the real printer**, and live mode is untested.
- Preview: `.claude/launch.json` serves the folder on port 8765.

## Setup decisions
- Teacher signs in with Google (`@orangeusd.org` only, enforced in the code).
- All class webapps share one Firestore layout. The tool queries a collection group (`progress` by default) for the last 30 days.
- Printer: Brother QL-710W over USB, with a **29mm (1.1") continuous roll** (DK-2210). Labels are laid out as a 90mm × 29mm strip.
- Printing goes through Chrome's print dialog to the normal Brother driver. **Do not use WebUSB/Zadig**: the teacher also uses P-touch Editor, and Zadig would break it.
- Auto-print uses a separate Chrome profile launched with `--kiosk-printing` (shortcut: `chrome.exe --user-data-dir="C:\RecIgnitionChrome" --kiosk-printing <path to html>`). That profile remembers the QL as its printer, so the teacher's normal Chrome keeps the classroom printer.
- Auto-print safeguards: nothing prints for records that already exist when the page opens, max 8 labels/hour, 10s gap, school hours 7–16, and no repeat printing of the same achievement (tracked in localStorage).

## One label per student per day
The list shows one recognition per student, and auto-print skips a student who already got a label today. When several triggers fire at once, `labelPriority` in Settings picks the winner (default: personal best, big improvement, persistence, class standout, streak). The teacher can still print by hand.

## Recognition triggers (thresholds in Settings)
1. Class standout: ≥1.5 SD above the class on the same activity
2. Personal best: new high, ≥15 points above the student's own average
3. Streak: 5 school days in a row (weekends don't break it)
4. Big improvement: last 3 scores average ≥20 points above the previous 5
5. Persistence: ≥4 attempts ending in ≥80%

## To do next
- Scoring is 6 points for completing all preparation steps plus 4 for a mastery check. A score under 10 doesn't mean the assignment is unfinished.
- **New trigger: speed of progress.** Reward students who got started and made good progress, even if they aren't done. Idea: a points-per-time slope compared with classmates on the same assignment, triggered once a student reaches about 60% (6/10, all prep done).
- Unknown: does Firestore store each step with its own timestamp, or only the current score and last-updated time? If only the current score, the tool has to track changes itself while it's open.
- Waiting on the teacher for: a sample progress document with the collection path, and the Firebase web config.
- Firestore quota: each live update costs 1 read. Check that the apps don't save constantly (for example, on every keystroke).

## Label wording
Always very positive. The format is "Way to go, [first name]!" plus one upbeat line and the date.
