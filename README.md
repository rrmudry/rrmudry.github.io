<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Physics Speed Calculator

This project powers the interactive physics drill that now lives on the
GitHub Pages homepage. The production build is generated with Vite and
published to `assets/physics-speed-calculator/`.

## Run Locally

**Prerequisites:** Node.js 20+

```bash
npm install
npm run dev
```

The app does not require any secrets. If you decide to wire it up to an
API, add the variables to the repository-level `.env.example` file so other
contributors know what to set.

## Build for GitHub Pages

```bash
npm run build
```

The build output is written directly to `assets/physics-speed-calculator/`,
which is where GitHub Pages serves the live experience from.
