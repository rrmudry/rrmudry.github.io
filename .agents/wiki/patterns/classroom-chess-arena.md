# Classroom Chess Arena (`chess/`)

## Overview
`chess/index.html` is a multi-mode Classroom Chess Arena designed for free time when students finish classwork early. It supports:
1. **Online Classmate Matchmaking (`Google Auth + Firestore`)**:
   - **⚡ 1-Click Quick Match (Auto-Pair Queue)**: Atomic `db.runTransaction` pairs two waiting students (prioritizing same period and non-repeat opponents) or puts the student into `'seeking'` status until the next classmate clicks Quick Match.
   - **⚔️ Direct Classmate Challenge**: Period-filtered live lounge (`All Periods`, `Period 0`–`6`) where students can send a real-time challenge invite banner (`Accept` / `Decline`) to a specific classmate.
   - **🛰️ Teacher Matchmaking Controls (`isTeacher`)**: **🎲 Pair All Available Students** batch-pairs all idle/seeking students in the selected period and lets the teacher spectate any active classroom board.
2. **Single Player vs. Chessbot**: 4 difficulty tiers (`easy` Rookie, `medium` Club, `hard` Tactician, `master` Grandmaster) powered by Alpha-Beta pruning and Piece-Square Tables.
3. **Two Players on 1 Device**: Pass-and-play mode with configurable digital chess clocks (`3m`, `5m`, `10m`, `Untimed`).

## Key Architectural Patterns & Gotchas

### 1. Firestore No-Nested-Arrays Rule (Flat Algebraic Move Replay)
Firestore rejects nested 2D arrays (`[[...]]`). Never store the 8×8 `board` matrix or `[r, c]` coordinate arrays inside a `moves` array in `chess_matches/{matchId}`.
- **Solution**: Store `moves` as an array of flat objects with algebraic square strings:
  `{ from: 'e2', to: 'e4', promo: null, san: 'e4', by: 'w', at: 17938... }`
- On every `onSnapshot` update, replay `moves` from `ChessEngine.createGame()` via `ChessEngine.makeMove(st, ChessEngine.parseSq(m.from), ChessEngine.parseSq(m.to), m.promo || 'q')`. Replaying 80 ply takes `< 0.3ms` and deterministically reconstructs board state, castling rights, en-passant targets, captured trays, and threefold repetition hashes.

### 2. Cross-Student Pairing Security Rule Invariants (`firestore.rules` Section 13)
When Student B pairs with Student A (or sends a challenge to Student A), Student B updates `chess_players/{uidA}` and creates `chess_matches/{matchId}`:
- `chess_players/{uid}` allows cross-student `update` only when `uid`, `studentId`, and `name` remain unchanged (`request.resource.data.uid == resource.data.uid`, etc.). Always use `.update({...})` (never overwrite without preserving `uid`, `studentId`, `name`).
- `chess_matches/{matchId}` requires `request.auth.uid in request.resource.data.uids` on `create`, and `request.resource.data.uids == resource.data.uids` on `update`.

### 3. Chromebook Viewport Height Fit & Non-Destructive Square Selection
- Constrain `.board-frame` with `max-width: min(520px, max(280px, calc(100vh - 13.5rem)))` so the top player bar, 8×8 board, and bottom player bar fit 100% inside a 1366×768 Chromebook viewport without vertical scrolling.
- When selecting or dragging a square (`selectSquare`), update `.selected`, `.legal-move`, and `.legal-capture` classes in-place (`updateBoardSelectionClasses()`) rather than rebuilding `boardGrid.innerHTML` mid-click/drag.

