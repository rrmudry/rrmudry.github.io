---
description: Perform daily lesson updates and deploy to GitHub
---
# Daily Update Workflow

Follow these steps each day to update your classroom site.

## Option A: Chat Automation (Easiest)
Simply type this command in the chat box:
> **/daily-update**

I will then handle the following:
1. **Sync**: Perform a `git fetch` and `reset` to ensure I have your latest work from GitHub.
2. **Setup & NGSS Tagging**: Update the lesson data in `assets/lessons-data.js` and ensure every new lesson includes an explicit `standards: ["HS-PS..."]` array for automatic interactive NGSS popovers.
3. **Verify**: Run a local server or syntax check to preview changes.
4. **Deploy**: Push everything back up to GitHub.

## Option B: Terminal Commands
If you prefer to run things yourself in the terminal:

### 1. Start the Local Server
Run this command to preview your changes:
```bash
npm run dev
```
Open `http://localhost:8080` in your browser.

### 2. Update Daily Lesson Data
Open [assets/lessons-data.js](file:///home/ryan/My_Antigravity_Projects/rrmudry.github.io/assets/lessons-data.js) and add your new lesson object at the top, including its targeted `standards: ["HS-PS..."]` array.

### 3. Deploy Changes
```bash
git add . && git commit -m "update: daily lesson update with NGSS alignment" && git push origin main
```
This command stages your changes, commits them, and pushes them to GitHub.
