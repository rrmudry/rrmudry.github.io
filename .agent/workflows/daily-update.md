---
description: Perform daily lesson updates and deploy to GitHub
---
# Daily Update Workflow

Follow these steps each day to update your classroom site.

## Option A: Chat Automation (Easiest)
Simply type this command in the chat box:
> **/daily-update**

I will then ask you for the new lesson details and handle everything else (file updates, local preview, and GitHub sync) for you.

## Option B: Terminal Commands
If you prefer to run things yourself in the terminal:

### 1. Start the Local Server
// turbo
Run this command to preview your changes:
```powershell
npm run dev
```
Open `http://localhost:8080` in your browser.

### 2. Update Daily Lesson Data
Open [lessons-data.js](file:///c:/AntiG_Coding_Projects/rrmudry_github_io/rrmudry.github.io/assets/lessons-data.js) and add your new lesson object at the top.

### 3. Deploy Changes
// turbo
```powershell
npm run deploy
```
This single command stages your changes, commits them, and pushes them to GitHub.
