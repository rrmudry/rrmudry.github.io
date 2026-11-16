# Rec-IGNITION

**Recognition that ignites.** A single web page that watches student progress in the class webapps and prints a small, very positive recognition label for students who stand out, either against the class or against their own history.

The name is the point: said aloud it is "recognition", but the spelling pulls out "ignition". The label is the spark. It is also one letter away from "re-ignition", for the student who has cooled off and needs rekindling.

## Why it exists

Students who are doing well, improving, or simply not giving up often go unnoticed in the moment. This tool notices for the teacher and puts a physical label in the student's hand while the work is still fresh. Recognition is always positive, and it rewards effort and growth as much as high scores, so it reaches more than the top of the class.

## Status

Version 0.3. Works with built-in sample data. Live mode is matched to the real class data but hasn't been run against it yet.

| Area | State |
| --- | --- |
| Detection, list, label layout | Working, tested in a browser with sample data |
| Manual print and auto-print queue | Tested with the print call intercepted; **not yet printed on the real printer** |
| Live Firestore mode | Matched to the real schema and tested with stand-in data; **needs the Firestore rule and indexes deployed** |
| Speed-of-progress trigger | Not built yet (see [To do](#to-do)) |

## How it works

Everything is in one file, [rec-ignition.html](rec-ignition.html): plain HTML and a JavaScript module, with the Firebase JS SDK 10.x loaded from gstatic. There is no build step and no server of its own.

1. The teacher opens the page and chooses **Sample data** or **Live Firestore**.
2. The teacher signs in with Google. The page then tries a one-document read of class results; the Firestore rules only allow that for the teacher, so the rules decide who gets in.
3. The page reads the last 30 days of results from `student_results/{assignment}/students/{student}`, then checks every 60 seconds for anything saved since. The class apps don't all use the same save-time field, so it reads `timestamp`, `updated_at`, `updatedAt` and `submittedAt`.
4. It looks for recognitions (below) and shows one card per student with a preview of the label.
5. The teacher prints a label by hand, or turns on **Auto-print new stand-outs**.

### Scores

Scores are out of 10: 6 points for completing all preparation steps plus 4 for the mastery check. A score under 10 does not mean the assignment is unfinished. Inside the code, scores are held as percentages, so thresholds are in percentage points (15 means 1.5 out of 10). The screen shows them on the real scale, such as `9/10`.

### Recognition triggers

All thresholds can be changed in Settings.

Each class app keeps one record per student per assignment and updates it as they work. "Finished" means the app marked it complete or the Mastery Check has been taken.

| Trigger | Rule |
| --- | --- |
| Class standout | At least 1.5 standard deviations above classmates who finished the same activity |
| Personal best | The latest finished activity is a new high, at least 15 percentage points above the student's own average (needs 4 earlier ones) |
| Streak | Work on 5 school days in a row (weekends don't break it). The tool remembers the days it sees each student working, so streaks build up from when it starts running |
| Big improvement | The last 2 finished activities average at least 20 points above the 3 before them, or a Mastery Check retake is at least 20 points above the first try |
| Persistence | At least 3 Mastery Check attempts, ending at 80% or better |

### One label per student per day

One piece of work can fire several triggers at once. The list shows only one recognition per student, and auto-print skips a student who already got a label today. When several fire together, `labelPriority` in Settings picks the winner. The default order is personal best, big improvement, persistence, class standout, streak. Printing by hand is not limited.

### Label wording

Always very positive. The format is "Way to go, [first name]!" plus one upbeat line and the date.

## Printing

- **Printer:** Brother QL-710W over USB with a 29mm (1.1") continuous roll (DK-2210). Labels are laid out as a 90mm × 29mm strip.
- **Method:** Chrome's print dialog to the normal Brother driver.
- **Do not switch to WebUSB or Zadig.** The teacher also uses P-touch Editor, and Zadig would replace the driver and break it.

### Auto-print

Auto-print needs Chrome to print without showing the dialog. Use a separate Chrome profile so the teacher's normal Chrome keeps the classroom printer:

```
chrome.exe --user-data-dir="C:\RecIgnitionChrome" --kiosk-printing <path to rec-ignition.html>
```

Set the QL-710W as the printer once in that profile; it remembers it.

Safeguards, so a data glitch can't empty the roll:

- Nothing prints for records that already exist when the page opens.
- At most 8 labels per hour, with a 10 second gap between labels.
- Only during school hours, 7:00 to 16:00.
- The same achievement never prints twice (tracked in the browser's localStorage).
- One label per student per day.

## Settings

The **Settings** panel at the bottom of the page holds a block of JSON, saved in that browser only:

- `firebase`: the Firebase web config (`apiKey`, `authDomain`, `projectId`)
- `progressCollection`, `resultsRoot` and `fields`: where results live and what the fields are called
- `pollSeconds`: how often live mode checks for new work (60)
- `defaultMaxScore`: 10
- `thresholds`, `labelPriority`, `autoPrint`: the rules described above

The Firebase web config is not a secret, but anyone can read it once it is in a repository. Student data is protected by the Firestore security rules: listing results, including the collection-group read this tool uses, is admin only. Changing Settings in the browser can't get around that. Student names are shown as plain text, never as HTML.

## Running it

Open `rec-ignition.html` in Chrome. Sample data works straight away, and **Simulate new activity** adds a record so the auto-print path can be tried without real data.

For development, `.claude/launch.json` serves the folder on port 8765:

```bash
python3 -m http.server 8765 --bind 127.0.0.1
```

Then open `http://localhost:8765/rec-ignition.html`.

## To do

1. **Deploy the Firestore rule and indexes** (`firestore.rules`, `firestore.indexes.json`), then try live mode signed in as the teacher.
2. **New trigger: speed of progress.** Reward students who got started and made good progress, even if they aren't done. The idea is a points-per-time slope compared with classmates on the same assignment, triggered once a student reaches about 60% (6/10, all preparation done).
3. **Open question for that trigger:** does Firestore store each step with its own timestamp, or only the current score and a last-updated time? If only the current score, the page has to track changes itself while it is open.
4. **Firestore quota.** Each check costs at least 4 reads, plus one for each record saved since the last check.
5. **Real print test** on the QL-710W, then set up the auto-print Chrome profile.

## Files

| File | Purpose |
| --- | --- |
| `rec-ignition.html` | The whole tool |
| `README.md` | This document |
| `CLAUDE.md` | Working notes for Claude Code: decisions, current state, next steps. Keep it with the project when the folder moves. |
| `.claude/launch.json` | Local preview server setup |
