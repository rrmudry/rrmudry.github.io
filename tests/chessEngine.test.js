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

// 1. Initial board has 20 legal moves for White
let g = C.createGame();
assert.strictEqual(C.legalMoves(g).length, 20, 'Start position should have 20 legal moves');

// 2. Fool's Mate (1. f3 e5 2. g4 Qh4#)
g = playSequence(C.createGame(), [
  ['f2', 'f3'],
  ['e7', 'e5'],
  ['g2', 'g4'],
  ['d8', 'h4']
]);
let st = C.evaluateStatus(g);
assert.strictEqual(st.over, true);
assert.strictEqual(st.outcome, 'checkmate');
assert.strictEqual(st.winner, 'b');
assert.strictEqual(g.history[g.history.length - 1].san, 'Qh4#');

// 3. En Passant (1. e4 a6 2. e5 d5 3. exd6)
g = playSequence(C.createGame(), [
  ['e2', 'e4'],
  ['a7', 'a6'],
  ['e4', 'e5'],
  ['d7', 'd5'],
  ['e5', 'd6']
]);
assert.strictEqual(g.board[2][3], 'wp', 'White pawn should be on d6');
assert.strictEqual(g.board[3][3], null, 'Black pawn on d5 should be captured en-passant');
assert.strictEqual(g.history[g.history.length - 1].san, 'exd6');

// 4. Kingside Castling (1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. O-O)
g = playSequence(C.createGame(), [
  ['e2', 'e4'], ['e7', 'e5'],
  ['g1', 'f3'], ['b8', 'c6'],
  ['f1', 'c4'], ['f8', 'c5'],
  ['e1', 'g1']
]);
assert.strictEqual(g.board[7][6], 'wk');
assert.strictEqual(g.board[7][5], 'wr');
assert.strictEqual(g.history[g.history.length - 1].san, 'O-O');

// 5. Bot AI returns valid move across all tiers
for (const diff of ['easy', 'medium', 'hard', 'master']) {
  const mv = C.chooseBotMove(g, diff);
  assert(mv && mv.from && mv.to, `Bot (${diff}) should pick a valid move`);
}

console.log('✅ All ChessEngine unit tests passed!');

