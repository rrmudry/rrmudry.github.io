# Project Instructions: Physics Class Website

This file contains the core technical and design rules for maintaining and developing the `rrmudry.github.io` project. Any AI agent working on this repo should follow these instructions to ensure consistency across devices and sessions.

## 🌌 Core Design System: "Cosmic Adventure"
- **Primary Theme**: Dark, space-inspired with neon accents.
- **Aesthetics**: High visual impact, glassmorphism (frosted glass), micro-animations, and vibrant gradients.
- **Color Palette**:
    - Background: Deep blues/blacks (#0f172a, #020617)
    - Accents: Neon Blue, Amber/Gold, Cyber-Pink.
- **Fonts**: Use modern typography (e.g., 'Nunito', 'Segoe UI', 'Inter').

## 🛠️ Technical Constraints
- **Stack**: Vanilla HTML, Vanilla JavaScript, Vanilla CSS. Use TailwindCSS only if explicitly requested.
- **Time Handling**: Always use the **local system time** for date comparisons (lessons, countdowns). Never use UTC or hardcoded time zones unless requested.
- **Responsive Design**: All pages MUST be mobile-friendly.

## 🚀 Git Hygiene & Workspace Sync
- **Sync-First Policy**: Before starting any new task, run `git fetch origin` and `git status`. If the local environment is behind, perform a `git reset --hard origin/main` (with user permission if local work exists).
- **Deployment**: Always verify changes locally before pushing to the `main` branch for GitHub Pages.
- **Daily Updates**: Use the standardized workflow in `.agent/workflows/daily-update.md`.

## 📁 Key Project Components
- **[index.html](file:///index.html)**: Main landing page with current activities.
- **[lessons.html](file:///lessons.html)**: Archives of all physics content.
- **[unit4-dashboard.html](file:///unit4-dashboard.html)**: Specialized dashboard for Momentum & Impulse.
- **[operation_safe_heeler_results.html](file:///operation_safe_heeler_results.html)**: Results leaderboard for the crash engineering project.

## 🧠 Memory Sync
- **Persistent Context**: Refer to this file and `.agent/workflows/` at the start of every session to "re-index" the project goal.
- **Local Files**: When referencing PDF or image assets, check the `assets/` or `daily-updates/` folders first.
