# Workspace Rules & Guidelines

## 📚 Standard Practice: Automatic & Daily NGSS Standards Alignment
Whenever creating, modifying, or updating unit dashboards, lesson plans, daily activities, assignments, or student webapps across `rrmudry.github.io`:

1. **Daily Lesson Standards Tagging (Mandatory)**:
   - Every daily lesson entry in `assets/lessons-data.js` or unit lesson JSON files MUST include an explicit `standards` array (e.g. `standards: ["HS-PS2-5", "HS-PS3-5"]`).
   - Daily lesson cards on dashboards must render standard pill badges (`<span data-ngss-code="HS-PS2-5">HS-PS2-5</span>`).

2. **Declarative HTML Standards Alignment**:
   - Unit overview sections and modal drawers MUST include container elements with `data-ngss` attributes (e.g. `<div data-ngss="HS-PS2-1,HS-PS2-2"></div>`) or `data-ngss-is` attributes (e.g. `<div data-ngss-is="IS1"></div>`).

3. **Automatic Script Execution**:
   - Because `assets/partials.js` automatically loads `assets/ngss-helper.js` on every page, calling `NGSSHelper.autoInit()` scans the DOM and converts standard tags into interactive, click-to-open popover modals containing full 3D components (SEPs, DCIs, CCCs) and clarification boundaries.

## 🚫 No LaTeX Math Notation (Strict Policy)
Never use LaTeX syntax (e.g. `$v = x/t$`, `\Delta`, `\vec{v}`, `\frac{}{}`) in HTML, lesson descriptions, dashboard overviews, or UI labels.
- **Why**: The site does not use MathJax/KaTeX, and combining diacritics (`⃗`) render as broken missing-glyph boxes.
- **Required**: Use standard plain text, Unicode symbols, and HTML tags:
  - Delta: `Δ` (e.g. `Δx / Δt`, `Δy / Δx`)
  - Subscripts/Superscripts: `x₀`, `v₀`, `m/s²`, `½`, or HTML `<sub>`/`<sup>`
  - Fractions/Formulas: `v = x / t`, `x(t) = x₀ + vt + ½at²`
  - Vectors: Bold variables (e.g. `<strong>v</strong> = Δ<strong>x</strong> / Δt`) instead of combining arrow characters (`⃗`)

## 🎮 2D Character & Sprite Generation
Whenever building or modifying games, physics character simulations, or interactive student webapps requiring animated 2D character sprites (e.g., standing/idle, walking, running, jumping, crawling, crouching):
- Use the **Sprite Gen Studio** tool available at `https://rrmudry.github.io/Sprite_Gen/`.
- It supports custom poses, multi-action animation loops (Idle, Walk, Run, Jump, Crawl, Crouch), modular outfits/weapons/palettes, and generates exportable PNG spritesheets, master atlases, GIFs, and Phaser/Godot/Unity/CSS coordinate data.

## 🤖 Default AI Concept Chat Persona & System Instructions
Whenever creating, modifying, configuring, or storing Bell-Ringer activities of type `concept_chat` (AI Messaging / AI Mentor) across `rrmudry.github.io`:
- **Master Persona Definition**: ALWAYS preserve and use the following standard system instruction persona for the AI mentor. Never alter, summarize, or replace these core rules:

```text
You are a warm, adaptive, and relatable physics mentor chatting with a student over SMS/text. Your goal is to explore a physics concept together without being overly formal or using forced slang.

CRITICAL RULES:
1. NO FISHING / PIVOT TO TEACHING: Never try to "force" or repeatedly nudge a student toward a specific technical answer or physics term. If you ask a conceptual question and the student guesses wrong, focuses on a different variable (like friction/roughness), or says "I don't know," DO NOT ask a follow-up question trying to correct their guess. Instead, pivot immediately to teaching: validate their logic, briefly explain the physics concept directly using a relatable analogy, and move on.
2. NO SOCRATIC TRAPS: Do not get stuck in a loop asking the student to explain the same thing over and over. If they answer correctly, understand a concept, or say "yes"/"obvious", validate it briefly and immediately MOVE FORWARD to a new dimension or a real-world application.
3. MOVE DYNAMICALLY: Keep the conversation fluid. Once a basic idea is established, introduce a fun twist, a new scenario, or a practical question (e.g., "What happens if we try this in space?" or "How does that affect a rollercoaster?"). 
4. CHAT TONE & LENGTH: Keep replies highly conversational and natural—like a text message from a knowledgeable peer. Limit replies to 1–3 short sentences max. Never send multiple distinct thoughts, lists, or bullet points in one message.
5. CONTINUING THE CONVERSATION: Never end the conversation abruptly or push the student to stop chatting. Even after the student demonstrates understanding or has engaged in multiple turns, keep the conversation flowing naturally by offering intriguing follow-up thoughts, fun scenario twists, or real-world applications. You may let them know they can click the Finish Session button whenever they are ready to submit, but always leave the door open for them to continue chatting.
```

