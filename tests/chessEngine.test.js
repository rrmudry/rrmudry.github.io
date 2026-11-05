const assert = require('assert');
const C = require('../chess/js/chess-engine.js');

function playSequence(st, moves) {
  let cur = st;
  for (const [f, t, pr] of moves) {
    const next = C.makeMove(cur, C.parseSq(f), C.parseSq(t), pr);
    assert(next, `Expected move ${f}->${t} to be legal`);
    cur = next;
  }
  return cur;
}

test('Initial board has 20 legal moves for White', () => {
  const g = C.createGame();
  expect(C.legalMoves(g).length).toBe(20);
});

test("Fool's Mate (1. f3 e5 2. g4 Qh4#)", () => {
  const g = playSequence(C.createGame(), [
    ['f2', 'f3'],
    ['e7', 'e5'],
    ['g2', 'g4'],
    ['d8', 'h4']
  ]);
  const st = C.evaluateStatus(g);
  expect(st.over).toBe(true);
  expect(st.outcome).toBe('checkmate');
  expect(st.winner).toBe('b');
  expect(g.history[g.history.length - 1].san).toBe('Qh4#');
});

test('En Passant (1. e4 a6 2. e5 d5 3. exd6)', () => {
  const g = playSequence(C.createGame(), [
    ['e2', 'e4'],
    ['a7', 'a6'],
    ['e4', 'e5'],
    ['d7', 'd5'],
    ['e5', 'd6']
  ]);
  expect(g.board[2][3]).toBe('wp');
  expect(g.board[3][3]).toBeNull();
  expect(g.history[g.history.length - 1].san).toBe('exd6');
});

test('Kingside Castling (1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. O-O)', () => {
  const g = playSequence(C.createGame(), [
    ['e2', 'e4'], ['e7', 'e5'],
    ['g1', 'f3'], ['b8', 'c6'],
    ['f1', 'c4'], ['f8', 'c5'],
    ['e1', 'g1']
  ]);
  expect(g.board[7][6]).toBe('wk');
  expect(g.board[7][5]).toBe('wr');
  expect(g.history[g.history.length - 1].san).toBe('O-O');
});

test('Bot AI returns valid move across all tiers', () => {
  const g = playSequence(C.createGame(), [
    ['e2', 'e4'], ['e7', 'e5'],
    ['g1', 'f3'], ['b8', 'c6']
  ]);
  for (const diff of ['easy', 'medium', 'hard', 'master']) {
    const mv = C.chooseBotMove(g, diff);
    expect(mv).toBeDefined();
    expect(mv.from).toBeDefined();
    expect(mv.to).toBeDefined();
  }
});

test('Move Score Record & Accuracy Summary', () => {
  const g = playSequence(C.createGame(), [
    ['e2', 'e4'], ['e7', 'e5'],
    ['g1', 'f3'], ['b8', 'c6'],
    ['f1', 'c4'], ['f8', 'c5'],
    ['e1', 'g1']
  ]);
  const summary = C.summarizeMoveScores(g);
  expect(typeof summary.w.accuracy).toBe('number');
  expect(summary.w.accuracy).toBeGreaterThan(0);
  expect(typeof summary.b.accuracy).toBe('number');
  expect(summary.b.accuracy).toBeGreaterThan(0);
  expect(g.history.every(h => h.grade && h.symbol && h.evalText)).toBe(true);
});

