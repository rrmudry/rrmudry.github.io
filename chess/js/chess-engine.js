// Complete FIDE Chess Rules Engine, SAN Formatter, 4-Tier AI Bot, and Staunton SVG Pieces.
// Zero external dependencies. Runs identically in browser and Node tests.
(function (root) {
  'use strict';

  const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const PIECE_VALUES = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };
  const MATERIAL_PTS = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

  // Piece-square positional bonus tables (from White's perspective; flipped for Black)
  const PST = {
    p: [
      [0,  0,  0,  0,  0,  0,  0,  0],
      [50, 50, 50, 50, 50, 50, 50, 50],
      [10, 10, 20, 30, 30, 20, 10, 10],
      [5,  5, 10, 25, 25, 10,  5,  5],
      [0,  0,  0, 20, 20,  0,  0,  0],
      [5, -5,-10,  0,  0,-10, -5,  5],
      [5, 10, 10,-20,-20, 10, 10,  5],
      [0,  0,  0,  0,  0,  0,  0,  0]
    ],
    n: [
      [-50,-40,-30,-30,-30,-30,-40,-50],
      [-40,-20,  0,  0,  0,  0,-20,-40],
      [-30,  0, 10, 15, 15, 10,  0,-30],
      [-30,  5, 15, 20, 20, 15,  5,-30],
      [-30,  0, 15, 20, 20, 15,  0,-30],
      [-30,  5, 10, 15, 15, 10,  5,-30],
      [-40,-20,  0,  5,  5,  0,-20,-40],
      [-50,-40,-30,-30,-30,-30,-40,-50]
    ],
    b: [
      [-20,-10,-10,-10,-10,-10,-10,-20],
      [-10,  0,  0,  0,  0,  0,  0,-10],
      [-10,  0,  5, 10, 10,  5,  0,-10],
      [-10,  5,  5, 10, 10,  5,  5,-10],
      [-10,  0, 10, 10, 10, 10,  0,-10],
      [-10, 10, 10, 10, 10, 10, 10,-10],
      [-10,  5,  0,  0,  0,  0,  5,-10],
      [-20,-10,-10,-10,-10,-10,-10,-20]
    ],
    r: [
      [0,  0,  0,  0,  0,  0,  0,  0],
      [5, 10, 10, 10, 10, 10, 10,  5],
      [-5,  0,  0,  0,  0,  0,  0, -5],
      [-5,  0,  0,  0,  0,  0,  0, -5],
      [-5,  0,  0,  0,  0,  0,  0, -5],
      [-5,  0,  0,  0,  0,  0,  0, -5],
      [-5,  0,  0,  0,  0,  0,  0, -5],
      [0,  0,  0,  5,  5,  0,  0,  0]
    ],
    q: [
      [-20,-10,-10, -5, -5,-10,-10,-20],
      [-10,  0,  0,  0,  0,  0,  0,-10],
      [-10,  0,  5,  5,  5,  5,  0,-10],
      [-5,  0,  5,  5,  5,  5,  0, -5],
      [0,  0,  5,  5,  5,  5,  0, -5],
      [-10,  5,  5,  5,  5,  5,  0,-10],
      [-10,  0,  5,  0,  0,  0,  0,-10],
      [-20,-10,-10, -5, -5,-10,-10,-20]
    ],
    k: [
      [-30,-40,-40,-50,-50,-40,-40,-30],
      [-30,-40,-40,-50,-50,-40,-40,-30],
      [-30,-40,-40,-50,-50,-40,-40,-30],
      [-30,-40,-40,-50,-50,-40,-40,-30],
      [-20,-30,-30,-40,-40,-30,-30,-20],
      [-10,-20,-20,-20,-20,-20,-20,-10],
      [20, 20,  0,  0,  0,  0, 20, 20],
      [20, 30, 10,  0,  0, 10, 30, 20]
    ]
  };

  function inBounds(r, c) {
    return r >= 0 && r < 8 && c >= 0 && c < 8;
  }

  function sqName(r, c) {
    return FILES[c] + (8 - r);
  }

  function parseSq(sq) {
    if (!sq || sq.length !== 2) return null;
    const c = FILES.indexOf(sq[0]);
    const r = 8 - parseInt(sq[1], 10);
    return inBounds(r, c) ? [r, c] : null;
  }

  function initialBoard() {
    return [
      ['br', 'bn', 'bb', 'bq', 'bk', 'bb', 'bn', 'br'],
      ['bp', 'bp', 'bp', 'bp', 'bp', 'bp', 'bp', 'bp'],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      ['wp', 'wp', 'wp', 'wp', 'wp', 'wp', 'wp', 'wp'],
      ['wr', 'wn', 'wb', 'wq', 'wk', 'wb', 'wn', 'wr']
    ];
  }

  function posHash(board, turn, castling, ep) {
    const rows = board.map(r => r.map(x => x || '.').join('')).join('/');
    const c = `${castling.wK ? 'K' : ''}${castling.wQ ? 'Q' : ''}${castling.bK ? 'k' : ''}${castling.bQ ? 'q' : ''}` || '-';
    const e = ep ? sqName(ep[0], ep[1]) : '-';
    return `${rows} ${turn} ${c} ${e}`;
  }

  function createGame() {
    const board = initialBoard();
    const castling = { wK: true, wQ: true, bK: true, bQ: true };
    const hash = posHash(board, 'w', castling, null);
    return {
      board,
      turn: 'w',
      castling,
      ep: null,
      halfMove: 0,
      fullMove: 1,
      history: [],
      hashes: [hash],
      captured: { w: [], b: [] } // w: black pieces captured by White; b: white pieces captured by Black
    };
  }

  function cloneState(st) {
    return {
      board: st.board.map(r => r.slice()),
      turn: st.turn,
      castling: { ...st.castling },
      ep: st.ep ? [st.ep[0], st.ep[1]] : null,
      halfMove: st.halfMove || 0,
      fullMove: st.fullMove || 1,
      history: (st.history || []).map(m => ({ ...m })),
      hashes: (st.hashes || []).slice(),
      captured: {
        w: ((st.captured && st.captured.w) || []).slice(),
        b: ((st.captured && st.captured.b) || []).slice()
      }
    };
  }

  function findKing(board, color) {
    const target = color + 'k';
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (board[r][c] === target) return [r, c];
      }
    }
    return null;
  }

  // Checks if square (tr, tc) is attacked by any piece of `byColor`
  function isSquareAttacked(board, tr, tc, byColor) {
    // 1. Pawn attacks
    const pawnRow = byColor === 'w' ? tr + 1 : tr - 1;
    if (inBounds(pawnRow, tc - 1) && board[pawnRow][tc - 1] === byColor + 'p') return true;
    if (inBounds(pawnRow, tc + 1) && board[pawnRow][tc + 1] === byColor + 'p') return true;

    // 2. Knight attacks
    const kJumps = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
    for (const [dr, dc] of kJumps) {
      const r = tr + dr, c = tc + dc;
      if (inBounds(r, c) && board[r][c] === byColor + 'n') return true;
    }

    // 3. King attacks
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (!dr && !dc) continue;
        const r = tr + dr, c = tc + dc;
        if (inBounds(r, c) && board[r][c] === byColor + 'k') return true;
      }
    }

    // 4. Orthogonal sliders (Rook / Queen)
    const ortho = [[-1,0],[1,0],[0,-1],[0,1]];
    for (const [dr, dc] of ortho) {
      let r = tr + dr, c = tc + dc;
      while (inBounds(r, c)) {
        const p = board[r][c];
        if (p) {
          if (p === byColor + 'r' || p === byColor + 'q') return true;
          break;
        }
        r += dr; c += dc;
      }
    }

    // 5. Diagonal sliders (Bishop / Queen)
    const diag = [[-1,-1],[-1,1],[1,-1],[1,1]];
    for (const [dr, dc] of diag) {
      let r = tr + dr, c = tc + dc;
      while (inBounds(r, c)) {
        const p = board[r][c];
        if (p) {
          if (p === byColor + 'b' || p === byColor + 'q') return true;
          break;
        }
        r += dr; c += dc;
      }
    }

    return false;
  }

  function inCheck(board, color) {
    const k = findKing(board, color);
    if (!k) return false;
    const enemy = color === 'w' ? 'b' : 'w';
    return isSquareAttacked(board, k[0], k[1], enemy);
  }

  // Generate pseudo-legal moves from (r, c)
  function pseudoMovesFrom(st, r, c) {
    const p = st.board[r][c];
    if (!p || p[0] !== st.turn) return [];
    const color = p[0];
    const enemy = color === 'w' ? 'b' : 'w';
    const type = p[1];
    const moves = [];

    const addMove = (tr, tc, extra = {}) => {
      moves.push({ from: [r, c], to: [tr, tc], piece: p, captured: st.board[tr][tc] || null, ...extra });
    };

    if (type === 'p') {
      const dir = color === 'w' ? -1 : 1;
      const startRow = color === 'w' ? 6 : 1;
      const promoRow = color === 'w' ? 0 : 7;
      const nr = r + dir;

      // Forward 1
      if (inBounds(nr, c) && !st.board[nr][c]) {
        if (nr === promoRow) {
          for (const pr of ['q', 'r', 'b', 'n']) addMove(nr, c, { promo: pr });
        } else {
          addMove(nr, c);
          // Forward 2 from start rank
          const nnr = r + dir * 2;
          if (r === startRow && !st.board[nnr][c]) {
            addMove(nnr, c, { doublePush: true });
          }
        }
      }

      // Diagonal captures & en-passant
      for (const dc of [-1, 1]) {
        const nc = c + dc;
        if (!inBounds(nr, nc)) continue;
        const target = st.board[nr][nc];
        if (target && target[0] === enemy) {
          if (nr === promoRow) {
            for (const pr of ['q', 'r', 'b', 'n']) addMove(nr, nc, { promo: pr });
          } else {
            addMove(nr, nc);
          }
        } else if (st.ep && st.ep[0] === nr && st.ep[1] === nc) {
          addMove(nr, nc, { epCapture: true, captured: enemy + 'p' });
        }
      }
    } else if (type === 'n') {
      const jumps = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
      for (const [dr, dc] of jumps) {
        const nr = r + dr, nc = c + dc;
        if (!inBounds(nr, nc)) continue;
        const t = st.board[nr][nc];
        if (!t || t[0] === enemy) addMove(nr, nc);
      }
    } else if (type === 'b' || type === 'r' || type === 'q') {
      const dirs = [];
      if (type === 'b' || type === 'q') dirs.push([-1,-1],[-1,1],[1,-1],[1,1]);
      if (type === 'r' || type === 'q') dirs.push([-1,0],[1,0],[0,-1],[0,1]);
      for (const [dr, dc] of dirs) {
        let nr = r + dr, nc = c + dc;
        while (inBounds(nr, nc)) {
          const t = st.board[nr][nc];
          if (!t) {
            addMove(nr, nc);
          } else {
            if (t[0] === enemy) addMove(nr, nc);
            break;
          }
          nr += dr; nc += dc;
        }
      }
    } else if (type === 'k') {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (!dr && !dc) continue;
          const nr = r + dr, nc = c + dc;
          if (!inBounds(nr, nc)) continue;
          const t = st.board[nr][nc];
          if (!t || t[0] === enemy) addMove(nr, nc);
        }
      }

      // Castling
      const homeRow = color === 'w' ? 7 : 0;
      if (r === homeRow && c === 4 && !inCheck(st.board, color)) {
        const kSide = color === 'w' ? st.castling.wK : st.castling.bK;
        const qSide = color === 'w' ? st.castling.wQ : st.castling.bQ;
        if (kSide && st.board[homeRow][7] === color + 'r' && !st.board[homeRow][5] && !st.board[homeRow][6]) {
          if (!isSquareAttacked(st.board, homeRow, 5, enemy) && !isSquareAttacked(st.board, homeRow, 6, enemy)) {
            addMove(homeRow, 6, { castle: 'K' });
          }
        }
        if (qSide && st.board[homeRow][0] === color + 'r' && !st.board[homeRow][1] && !st.board[homeRow][2] && !st.board[homeRow][3]) {
          if (!isSquareAttacked(st.board, homeRow, 3, enemy) && !isSquareAttacked(st.board, homeRow, 2, enemy)) {
            addMove(homeRow, 2, { castle: 'Q' });
          }
        }
      }
    }

    return moves;
  }

  // Applies a move on a board copy without computing SAN (used for legality filtering & AI search)
  function applyMoveFast(st, mv) {
    const next = {
      board: st.board.map(r => r.slice()),
      turn: st.turn === 'w' ? 'b' : 'w',
      castling: { ...st.castling },
      ep: null,
      halfMove: st.halfMove + 1,
      fullMove: st.turn === 'b' ? st.fullMove + 1 : st.fullMove
    };

    const [fr, fc] = mv.from;
    const [tr, tc] = mv.to;
    const p = next.board[fr][fc];
    const color = p[0];
    const type = p[1];

    next.board[fr][fc] = null;
    if (mv.epCapture) {
      const capRow = color === 'w' ? tr + 1 : tr - 1;
      next.board[capRow][tc] = null;
    }
    if (mv.castle === 'K') {
      next.board[tr][5] = next.board[tr][7];
      next.board[tr][7] = null;
    } else if (mv.castle === 'Q') {
      next.board[tr][3] = next.board[tr][0];
      next.board[tr][0] = null;
    }

    next.board[tr][tc] = mv.promo ? color + mv.promo : p;

    if (mv.doublePush) {
      next.ep = [(fr + tr) / 2, fc];
    }

    // Update castling rights
    if (p === 'wk') { next.castling.wK = false; next.castling.wQ = false; }
    if (p === 'bk') { next.castling.bK = false; next.castling.bQ = false; }
    if ((fr === 7 && fc === 0) || (tr === 7 && tc === 0)) next.castling.wQ = false;
    if ((fr === 7 && fc === 7) || (tr === 7 && tc === 7)) next.castling.wK = false;
    if ((fr === 0 && fc === 0) || (tr === 0 && tc === 0)) next.castling.bQ = false;
    if ((fr === 0 && fc === 7) || (tr === 0 && tc === 7)) next.castling.bK = false;

    if (type === 'p' || mv.captured) next.halfMove = 0;

    return next;
  }

  function legalMovesFrom(st, r, c) {
    const pseudo = pseudoMovesFrom(st, r, c);
    const color = st.turn;
    return pseudo.filter(mv => {
      const after = applyMoveFast(st, mv);
      return !inCheck(after.board, color);
    });
  }

  function legalMoves(st) {
    const all = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = st.board[r][c];
        if (p && p[0] === st.turn) {
          all.push(...legalMovesFrom(st, r, c));
        }
      }
    }
    return all;
  }

  // Formats a legal move in Standard Algebraic Notation (SAN)
  function formatSAN(st, mv, allLegal) {
    if (mv.castle === 'K') return 'O-O';
    if (mv.castle === 'Q') return 'O-O-O';

    const [fr, fc] = mv.from;
    const [tr, tc] = mv.to;
    const type = mv.piece[1];
    const dest = sqName(tr, tc);
    let san = '';

    if (type === 'p') {
      if (mv.captured) san = FILES[fc] + 'x' + dest;
      else san = dest;
      if (mv.promo) san += '=' + mv.promo.toUpperCase();
    } else {
      san = type.toUpperCase();
      // Disambiguate if another piece of same type can move to same destination
      const others = (allLegal || legalMoves(st)).filter(m =>
        m !== mv &&
        m.piece === mv.piece &&
        m.to[0] === tr &&
        m.to[1] === tc &&
        (m.from[0] !== fr || m.from[1] !== fc)
      );
      if (others.length > 0) {
        const sameFile = others.some(m => m.from[1] === fc);
        const sameRank = others.some(m => m.from[0] === fr);
        if (!sameFile) san += FILES[fc];
        else if (!sameRank) san += (8 - fr);
        else san += FILES[fc] + (8 - fr);
      }
      if (mv.captured) san += 'x';
      san += dest;
    }

    const after = applyMoveFast(st, mv);
    const oppInCheck = inCheck(after.board, after.turn);
    if (oppInCheck) {
      const oppLegal = legalMoves(after);
      san += oppLegal.length === 0 ? '#' : '+';
    }
    return san;
  }

  // Applies a validated move and updates full history, captured tray, and repetition hashes
  function makeMove(st, from, to, promoChoice = 'q') {
    const candidates = legalMovesFrom(st, from[0], from[1]).filter(
      m => m.to[0] === to[0] && m.to[1] === to[1]
    );
    if (!candidates.length) return null;
    const mv = candidates.find(m => !m.promo || m.promo === promoChoice) || candidates[0];
    const allLegal = legalMoves(st);
    const san = formatSAN(st, mv, allLegal);

    const next = cloneState(st);
    const fast = applyMoveFast(st, mv);
    next.board = fast.board;
    next.turn = fast.turn;
    next.castling = fast.castling;
    next.ep = fast.ep;
    next.halfMove = fast.halfMove;
    next.fullMove = fast.fullMove;

    if (mv.captured) {
      next.captured[st.turn].push(mv.captured);
    }

    const hash = posHash(next.board, next.turn, next.castling, next.ep);
    next.hashes.push(hash);
    next.history.push({
      from: mv.from,
      to: mv.to,
      piece: mv.piece,
      captured: mv.captured || null,
      promo: mv.promo || null,
      castle: mv.castle || null,
      epCapture: !!mv.epCapture,
      san,
      by: st.turn,
      at: Date.now()
    });

    return next;
  }

  function hasInsufficientMaterial(board) {
    const pieces = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = board[r][c];
        if (p && p[1] !== 'k') pieces.push({ p, r, c, sqColor: (r + c) % 2 });
      }
    }
    if (pieces.length === 0) return true; // K vs K
    if (pieces.length === 1 && (pieces[0].p[1] === 'b' || pieces[0].p[1] === 'n')) return true; // K+B or K+N vs K
    if (pieces.length === 2 && pieces[0].p[1] === 'b' && pieces[1].p[1] === 'b' && pieces[0].sqColor === pieces[1].sqColor) {
      return true; // Bishops on same color squares
    }
    return false;
  }

  function materialBalance(board) {
    let w = 0, b = 0;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = board[r][c];
        if (!p) continue;
        const pts = MATERIAL_PTS[p[1]] || 0;
        if (p[0] === 'w') w += pts;
        else b += pts;
      }
    }
    return { w, b, diff: w - b };
  }

  function evaluateStatus(st) {
    const moves = legalMoves(st);
    const check = inCheck(st.board, st.turn);
    if (moves.length === 0) {
      if (check) {
        const winner = st.turn === 'w' ? 'b' : 'w';
        return { over: true, outcome: 'checkmate', winner, reason: `Checkmate! ${winner === 'w' ? 'White' : 'Black'} wins.` };
      }
      return { over: true, outcome: 'stalemate', winner: 'draw', reason: 'Draw by Stalemate (no legal moves).' };
    }
    if (hasInsufficientMaterial(st.board)) {
      return { over: true, outcome: 'insufficient', winner: 'draw', reason: 'Draw by Insufficient Material.' };
    }
    if (st.halfMove >= 100) {
      return { over: true, outcome: 'fifty-move', winner: 'draw', reason: 'Draw by 50-Move Rule.' };
    }
    if (st.hashes && st.hashes.length >= 5) {
      const latest = st.hashes[st.hashes.length - 1];
      const count = st.hashes.filter(h => h === latest).length;
      if (count >= 3) {
        return { over: true, outcome: 'threefold', winner: 'draw', reason: 'Draw by Threefold Repetition.' };
      }
    }
    return { over: false, inCheck: check, legalCount: moves.length };
  }

  // ------------------------------------------------------------------
  // 4-Tier AI Bot Evaluation & Alpha-Beta Search
  // ------------------------------------------------------------------
  function evaluateBoard(st) {
    let score = 0;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = st.board[r][c];
        if (!p) continue;
        const color = p[0];
        const type = p[1];
        const base = PIECE_VALUES[type] || 0;
        const table = PST[type];
        const pstRow = color === 'w' ? r : 7 - r;
        const positional = table ? table[pstRow][c] : 0;
        if (color === 'w') score += base + positional;
        else score -= base + positional;
      }
    }
    return st.turn === 'w' ? score : -score;
  }

  function orderMoves(moves) {
    return moves.slice().sort((a, b) => {
      const scoreMove = m => {
        let s = 0;
        if (m.captured) s += 10 * (PIECE_VALUES[m.captured[1]] || 100) - (PIECE_VALUES[m.piece[1]] || 100) / 10;
        if (m.promo) s += PIECE_VALUES[m.promo] || 800;
        if (m.castle) s += 60;
        return s;
      };
      return scoreMove(b) - scoreMove(a);
    });
  }

  function negamax(st, depth, alpha, beta) {
    const moves = legalMoves(st);
    if (moves.length === 0) {
      if (inCheck(st.board, st.turn)) return -19000 - depth * 100;
      return 0; // Stalemate
    }
    if (depth <= 0) {
      return evaluateBoard(st);
    }

    const ordered = orderMoves(moves);
    let best = -Infinity;
    for (const mv of ordered) {
      const next = applyMoveFast(st, mv);
      const val = -negamax(next, depth - 1, -beta, -alpha);
      if (val > best) best = val;
      if (val > alpha) alpha = val;
      if (alpha >= beta) break;
    }
    return best;
  }

  function chooseBotMove(st, difficulty = 'medium') {
    const moves = legalMoves(st);
    if (!moves.length) return null;

    // Easy (Rookie): 1-ply with random noise so beginners can win
    if (difficulty === 'easy') {
      if (Math.random() < 0.32) {
        return moves[Math.floor(Math.random() * moves.length)];
      }
      let bestMove = moves[0], bestVal = -Infinity;
      for (const mv of orderMoves(moves)) {
        const next = applyMoveFast(st, mv);
        const val = -evaluateBoard(next) + (Math.random() * 90 - 45);
        if (val > bestVal) { bestVal = val; bestMove = mv; }
      }
      return bestMove;
    }

    const depth = difficulty === 'master' ? 3 : difficulty === 'hard' ? 3 : 2;
    const jitter = difficulty === 'master' ? 4 : difficulty === 'hard' ? 14 : 30;
    const ordered = orderMoves(moves);
    let bestMove = ordered[0];
    let bestScore = -Infinity;
    let alpha = -Infinity;
    const beta = Infinity;

    for (const mv of ordered) {
      const next = applyMoveFast(st, mv);
      const score = -negamax(next, depth - 1, -beta, -alpha) + (Math.random() * jitter - jitter / 2);
      if (score > bestScore) {
        bestScore = score;
        bestMove = mv;
      }
      if (score > alpha) alpha = score;
    }
    return bestMove;
  }

  // ------------------------------------------------------------------
  // Crisp Vector Staunton Chess Piece SVGs
  // ------------------------------------------------------------------
  function pieceSVG(code) {
    if (!code) return '';
    const isW = code[0] === 'w';
    const type = code[1];
    const fill = isW ? '#ffffff' : '#1e293b';
    const stroke = isW ? '#0f172a' : '#020617';
    const inner = isW ? '#0f172a' : '#e2e8f0';

    const shapes = {
      p: `<path d="M 22.5,9 C 19.5,9 17,11.5 17,14.5 C 17,16.8 18.4,18.7 20.4,19.5 C 17.5,21.2 16,24 16,28 C 16,30 19,31 19,31 L 14,35.5 L 31,35.5 L 26,31 C 26,31 29,30 29,28 C 29,24 27.5,21.2 24.6,19.5 C 26.6,18.7 28,16.8 28,14.5 C 28,11.5 25.5,9 22.5,9 z M 12.5,36 L 32.5,36 L 32.5,39 L 12.5,39 z" fill="${fill}" stroke="${stroke}" stroke-width="2.2" stroke-linejoin="round"/>`,
      r: `<g fill="${fill}" stroke="${stroke}" stroke-width="2.2" stroke-linejoin="round">
            <path d="M 11,39 L 34,39 L 33,35 L 12,35 z"/>
            <path d="M 14,35 L 14,20 L 31,20 L 31,35 z"/>
            <path d="M 11,20 L 34,20 L 34,12 L 30,12 L 30,15 L 25,15 L 25,12 L 20,12 L 20,15 L 15,15 L 15,12 L 11,12 z"/>
          </g>
          <line x1="16" y1="24" x2="29" y2="24" stroke="${inner}" stroke-width="1.6" stroke-linecap="round"/>`,
      n: `<g fill="${fill}" stroke="${stroke}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round">
            <path d="M 22,10 C 32.5,11 38.5,18 38,39 L 15,39 C 15,30 25,32.5 23,18"/>
            <path d="M 24,18 C 24.38,20.91 18.45,25.37 16,27 C 13,29 13.18,31.34 11,31 C 9.958,30.06 12.41,27.96 11,28 C 10,28 11.19,29.23 10,30 C 9,30 5.997,31 6,26 C 6,24 12,14 12,14 C 12,14 13.89,12.1 14,10.5 C 13.27,9.506 13.5,8.5 13.5,7.5 C 14.5,6.5 16.5,10 16.5,10 L 18.5,10 C 18.5,10 19.28,8.008 21,7 C 22,7 22,10 22,10"/>
          </g>
          <circle cx="15.5" cy="14.5" r="1.4" fill="${inner}"/>`,
      b: `<g fill="${fill}" stroke="${stroke}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round">
            <path d="M 9,36 C 12.39,35.03 19.11,36.43 22.5,34 C 25.89,36.43 32.61,35.03 36,36 C 36,36 37.65,36.54 39,38 C 38.32,38.97 37.35,38.99 36,38.5 C 32.61,37.53 25.89,38.96 22.5,37.5 C 19.11,38.96 12.39,37.53 9,38.5 C 7.646,38.99 6.677,38.97 6,38 C 7.354,36.06 9,36 9,36 z"/>
            <path d="M 15,32 C 17.5,34.5 27.5,34.5 30,32 C 30.5,30.5 30,30 30,30 C 30,27.5 27.5,26 27.5,26 C 33,24.5 33.5,14.5 22.5,10.5 C 11.5,14.5 12,24.5 17.5,26 C 17.5,26 15,27.5 15,30 C 15,30 14.5,30.5 15,32 z"/>
            <circle cx="22.5" cy="8" r="2.3"/>
          </g>
          <path d="M 19.5,18.5 L 25.5,18.5 M 22.5,15.5 L 22.5,21.5" stroke="${inner}" stroke-width="1.8" stroke-linecap="round"/>`,
      q: `<g fill="${fill}" stroke="${stroke}" stroke-width="2.2" stroke-linejoin="round">
            <path d="M 9,26 C 17.5,24.5 30,24.5 36,26 L 38.5,13.5 L 31,25 L 30.7,10.9 L 25.5,24.5 L 22.5,10 L 19.5,24.5 L 14.3,10.9 L 14,25 L 6.5,13.5 L 9,26 z"/>
            <path d="M 9,26 C 9,28 10.5,28 11.5,30 C 12.5,31.5 12.5,31 12,33.5 C 10.5,34.5 11,36 11,36 C 9.5,37.5 11,38.5 11,38.5 C 17.5,39.5 27.5,39.5 34,38.5 C 34,38.5 35.5,37.5 34,36 C 34,36 34.5,34.5 33,33.5 C 32.5,31 32.5,31.5 33.5,30 C 34.5,28 36,28 36,26 C 27.5,24.5 17.5,24.5 9,26 z"/>
            <circle cx="6" cy="12" r="1.8"/><circle cx="14" cy="9" r="1.8"/><circle cx="22.5" cy="8" r="1.8"/><circle cx="31" cy="9" r="1.8"/><circle cx="39" cy="12" r="1.8"/>
          </g>
          <path d="M 12,33.5 C 18,32 27,32 33,33.5" fill="none" stroke="${inner}" stroke-width="1.5"/>`,
      k: `<g fill="${fill}" stroke="${stroke}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round">
            <path d="M 22.5,11.63 L 22.5,6 M 20,8 L 25,8"/>
            <path d="M 22.5,25 C 22.5,25 27,17.5 25.5,14.5 C 25.5,14.5 24.5,12 22.5,12 C 20.5,12 19.5,14.5 19.5,14.5 C 18,17.5 22.5,25 22.5,25"/>
            <path d="M 11.5,37 C 17,40.5 27,40.5 32.5,37 L 32.5,30 C 32.5,30 41.5,25.5 38.5,19.5 C 34.5,13 25,16 22.5,23.5 L 22.5,27 L 22.5,23.5 C 19,16 9.5,13 6.5,19.5 C 3.5,25.5 11.5,29.5 11.5,29.5 L 11.5,37 z"/>
          </g>
          <path d="M 11.5,30 C 17,27 27,27 32.5,30 M 11.5,33.5 C 17,30.5 27,30.5 32.5,33.5" fill="none" stroke="${inner}" stroke-width="1.5"/>`
    };

    return `<svg viewBox="0 0 45 45" class="chess-svg piece-${code}" aria-hidden="true">${shapes[type] || ''}</svg>`;
  }

  const ChessEngine = {
    FILES,
    MATERIAL_PTS,
    sqName,
    parseSq,
    createGame,
    cloneState,
    inCheck,
    isSquareAttacked,
    legalMovesFrom,
    legalMoves,
    makeMove,
    evaluateStatus,
    materialBalance,
    chooseBotMove,
    pieceSVG
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChessEngine;
  }
  root.ChessEngine = ChessEngine;
})(typeof window !== 'undefined' ? window : globalThis);

