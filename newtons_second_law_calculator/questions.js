// Curated Newton's 2nd Law word problems for Fnet = m · a
// Variables: F (net force, N), m (mass, kg), a (acceleration, m/s²). The class says "net force".
// Regular bank: Level 1 (20, whole numbers), Level 2 (20, decimals), Level 3 (10, mastery quiz).
// Honors bank (required for Period 0, opt-in ⭐ for Periods 1–6), per the differentiation policy:
//   - two forces with signs (right +, left −) that add to the net force
//   - TOTAL system mass (two masses add in the mass slot)
//   - signed acceleration / net force given "to the left"
//   - working backward (m = Fnet ÷ a)
// Text tokens: {F} {m} {a} for one value, {F1} {F2} / {m1} {m2} when two values share a variable,
// {?} for the unknown. A value is [number] or [number, 'left' | 'right'].
// Run `node questions.js` to check every answer.

const UNITS = { F: 'N', m: 'kg', a: 'm/s²' };

function make(id, level, solveFor, text, vals, unknownText, honors = false) {
  const values = [];
  const textParts = [];
  text.split(/(\{[^}]+\})/).forEach(chunk => {
    const tok = chunk.match(/^\{([^}]+)\}$/);
    if (!tok) {
      if (chunk) textParts.push(chunk);
      return;
    }
    const key = tok[1];
    if (key === '?') {
      textParts.push({ isUnknown: true });
      return;
    }
    const [value, dir] = vals[key];
    const variable = key.replace(/\d+$/, '');
    const v = { id: `q${id}${key}`, value, unit: UNITS[variable], variable };
    if (dir) v.dir = dir;
    values.push(v);
    textParts.push({ valueId: v.id });
  });
  return { id, level, honors, solveFor, textParts, values, unknownText };
}

const H = true;

const QUESTIONS = [
  // =========================================================================
  // LEVEL 1: Identify the values and place them in the formula (whole numbers)
  // =========================================================================
  // Solve for net force
  make(1, 1, 'F', 'A {m} toy car speeds up at {a}. What is {?}?', { m: [4], a: [3] }, 'the net force on the car'),
  make(2, 1, 'F', 'A {m} car speeds up at {a} when the light turns green. What is {?}?', { m: [1200], a: [2] }, 'the net force on the car'),
  make(3, 1, 'F', 'A {m} skater speeds up at {a}. What is {?}?', { m: [60], a: [2] }, 'the net force on the skater'),
  make(4, 1, 'F', 'A player kicks a {m} soccer ball. The ball speeds up at {a}. What is {?}?', { m: [0.5], a: [40] }, 'the net force on the ball'),
  make(5, 1, 'F', 'A {m} wagon speeds up at {a}. What is {?}?', { m: [10], a: [3] }, 'the net force on the wagon'),
  make(6, 1, 'F', 'A {m} sprinter leaves the starting line with an acceleration of {a}. What is {?}?', { m: [70], a: [4] }, 'the net force on the sprinter'),
  make(7, 1, 'F', 'A {m} lab cart speeds up at {a}. What is {?}?', { m: [2], a: [6] }, 'the net force on the cart'),
  // Solve for acceleration
  make(8, 1, 'a', 'A net force of {F} acts on a {m} box. What is {?}?', { F: [30], m: [6] }, 'the acceleration of the box'),
  make(9, 1, 'a', 'A {m} motorcycle has a net force of {F} on it. What is {?}?', { m: [250], F: [500] }, 'the acceleration of the motorcycle'),
  make(10, 1, 'a', 'A net force of {F} pushes a {m} backpack across a table. What is {?}?', { F: [18], m: [3] }, 'the acceleration of the backpack'),
  make(11, 1, 'a', 'A {m} go-kart has a net force of {F} on it. What is {?}?', { m: [500], F: [1000] }, 'the acceleration of the go-kart'),
  make(12, 1, 'a', 'A net force of {F} acts on a {m} bowling ball. What is {?}?', { F: [45], m: [9] }, 'the acceleration of the bowling ball'),
  make(13, 1, 'a', 'A {m} basketball is thrown with a net force of {F}. What is {?}?', { m: [0.5], F: [10] }, 'the acceleration of the basketball'),
  make(14, 1, 'a', 'A {m} truck has a net force of {F} on it. What is {?}?', { m: [1600], F: [4800] }, 'the acceleration of the truck'),
  // Solve for mass (working backward)
  make(15, 1, 'm', 'A net force of {F} gives a box an acceleration of {a}. What is {?}?', { F: [20], a: [4] }, 'the mass of the box'),
  make(16, 1, 'm', 'A net force of {F} makes a car speed up at {a}. What is {?}?', { F: [3000], a: [2] }, 'the mass of the car'),
  make(17, 1, 'm', 'A net force of {F} acts on a dog sled. The sled speeds up at {a}. What is {?}?', { F: [90], a: [3] }, 'the mass of the sled'),
  make(18, 1, 'm', 'A net force of {F} gives a lab cart an acceleration of {a}. What is {?}?', { F: [12], a: [6] }, 'the mass of the cart'),
  make(19, 1, 'm', 'A net force of {F} makes a runner speed up at {a}. What is {?}?', { F: [240], a: [4] }, 'the mass of the runner'),
  make(20, 1, 'm', 'A net force of {F} gives a crate an acceleration of {a}. What is {?}?', { F: [150], a: [5] }, 'the mass of the crate'),

  // =========================================================================
  // LEVEL 2: Place the values, then calculate in Desmos (decimals)
  // =========================================================================
  // Solve for net force
  make(21, 2, 'F', 'A {m} cart speeds up at {a}. What is {?}?', { m: [1.5], a: [3.2] }, 'the net force on the cart'),
  make(22, 2, 'F', 'A {m} car speeds up at {a}. What is {?}?', { m: [850], a: [2.4] }, 'the net force on the car'),
  make(23, 2, 'F', 'A bat hits a {m} baseball. The ball speeds up at {a}. What is {?}?', { m: [0.145], a: [250] }, 'the net force on the baseball'),
  make(24, 2, 'F', 'A {m} cyclist speeds up at {a}. What is {?}?', { m: [65], a: [1.8] }, 'the net force on the cyclist'),
  make(25, 2, 'F', 'A {m} sled speeds up at {a}. What is {?}?', { m: [12.5], a: [0.8] }, 'the net force on the sled'),
  make(26, 2, 'F', 'A {m} drone speeds up at {a}. What is {?}?', { m: [2.4], a: [4.5] }, 'the net force on the drone'),
  make(27, 2, 'F', 'A racket hits a {m} tennis ball. The ball speeds up at {a}. What is {?}?', { m: [0.06], a: [500] }, 'the net force on the tennis ball'),
  // Solve for acceleration
  make(28, 2, 'a', 'A net force of {F} acts on a {m} box. What is {?}?', { F: [25], m: [8] }, 'the acceleration of the box'),
  make(29, 2, 'a', 'A {m} rider on a scooter has a net force of {F} on them. What is {?}?', { m: [75], F: [360] }, 'the acceleration of the rider'),
  make(30, 2, 'a', 'A net force of {F} acts on a {m} bag of rice. What is {?}?', { F: [7.5], m: [2.5] }, 'the acceleration of the bag'),
  make(31, 2, 'a', 'A {m} car has a net force of {F} on it. What is {?}?', { m: [1250], F: [2900] }, 'the acceleration of the car'),
  make(32, 2, 'a', 'A player kicks a {m} soccer ball with a net force of {F}. What is {?}?', { m: [0.45], F: [15] }, 'the acceleration of the ball'),
  make(33, 2, 'a', 'A net force of {F} acts on a {m} suitcase. What is {?}?', { F: [52], m: [16] }, 'the acceleration of the suitcase'),
  make(34, 2, 'a', 'A {m} toy truck has a net force of {F} on it. What is {?}?', { m: [0.3], F: [0.9] }, 'the acceleration of the toy truck'),
  // Solve for mass (working backward)
  make(35, 2, 'm', 'A net force of {F} gives a wheelbarrow an acceleration of {a}. What is {?}?', { F: [84], a: [3.5] }, 'the mass of the wheelbarrow'),
  make(36, 2, 'm', 'A net force of {F} gives a lab cart an acceleration of {a}. What is {?}?', { F: [6.6], a: [2.2] }, 'the mass of the cart'),
  make(37, 2, 'm', 'A net force of {F} makes a car speed up at {a}. What is {?}?', { F: [1800], a: [1.2] }, 'the mass of the car'),
  make(38, 2, 'm', 'A net force of {F} gives a box an acceleration of {a}. What is {?}?', { F: [27], a: [4.5] }, 'the mass of the box'),
  make(39, 2, 'm', 'A net force of {F} makes a bowling ball speed up at {a}. What is {?}?', { F: [4.2], a: [0.6] }, 'the mass of the bowling ball'),
  make(40, 2, 'm', 'A net force of {F} makes a person on skates speed up at {a}. What is {?}?', { F: [520], a: [6.5] }, 'the mass of the person'),

  // =========================================================================
  // LEVEL 3: Mastery quiz
  // =========================================================================
  make(41, 3, 'F', 'A {m} hockey player speeds up at {a}. What is {?}?', { m: [55], a: [2.6] }, 'the net force on the player'),
  make(42, 3, 'a', 'A net force of {F} acts on an {m} pony. What is {?}?', { F: [640], m: [80] }, 'the acceleration of the pony'),
  make(43, 3, 'm', 'A net force of {F} gives a shopping cart an acceleration of {a}. What is {?}?', { F: [96], a: [3.2] }, 'the mass of the shopping cart'),
  make(44, 3, 'F', 'A {m} soccer ball speeds up at {a} after a kick. What is {?}?', { m: [0.42], a: [35] }, 'the net force on the ball'),
  make(45, 3, 'a', 'A net force of {F} acts on a {m} watermelon. What is {?}?', { F: [13.5], m: [4.5] }, 'the acceleration of the watermelon'),
  make(46, 3, 'm', 'A net force of {F} makes a car speed up at {a}. What is {?}?', { F: [2250], a: [1.5] }, 'the mass of the car'),
  make(47, 3, 'F', 'A {m} sled speeds up at {a}. What is {?}?', { m: [9.5], a: [2] }, 'the net force on the sled'),
  make(48, 3, 'a', 'A {m} kayak has a net force of {F} on it. What is {?}?', { m: [35], F: [210] }, 'the acceleration of the kayak'),
  make(49, 3, 'm', 'A net force of {F} makes a skateboard speed up at {a}. What is {?}?', { F: [7.2], a: [3.2] }, 'the mass of the skateboard'),
  make(50, 3, 'a', 'A {m} truck has a net force of {F} on it. What is {?}?', { m: [1400], F: [3150] }, 'the acceleration of the truck'),

  // =========================================================================
  // ⭐ HONORS — Level 1
  // =========================================================================
  make(101, 1, 'a', 'You push a {m} box to the right with {F1}. Friction pulls left on it with {F2}. What is {?}?', { m: [10], F1: [50, 'right'], F2: [20, 'left'] }, 'the acceleration of the box', H),
  make(102, 1, 'a', 'A {m1} child sits in a {m2} wagon. The net force on the wagon and child is {F}. What is {?}?', { m1: [25], m2: [5], F: [60] }, 'their acceleration', H),
  make(103, 1, 'F', 'A {m} cart speeds up to the left at {a}. What is {?}? (Right is +, left is −.)', { m: [8], a: [4, 'left'] }, 'the net force on the cart', H),
  make(104, 1, 'a', 'A {m} box is pulled left with {F1} and pulled right with {F2}. What is {?}? (Right is +, left is −.)', { m: [5], F1: [40, 'left'], F2: [10, 'right'] }, 'the acceleration of the box', H),
  make(105, 1, 'F', 'A {m1} skater wears a {m2} backpack. Together they speed up at {a}. What is {?}?', { m1: [70], m2: [10], a: [2] }, 'the net force on the skater and backpack', H),
  make(106, 1, 'm', 'A net force of {F} to the left makes a sled speed up at {a} to the left. What is {?}?', { F: [90, 'left'], a: [3, 'left'] }, 'the mass of the sled', H),

  // =========================================================================
  // ⭐ HONORS — Level 2
  // =========================================================================
  make(107, 2, 'a', 'A {m} crate is pushed right with {F1}. Friction pulls left with {F2}. What is {?}?', { m: [30], F1: [120, 'right'], F2: [45, 'left'] }, 'the acceleration of the crate', H),
  make(108, 2, 'a', 'Two lab carts are hooked together: a {m1} cart and a {m2} cart. The net force on both carts is {F}. What is {?}?', { m1: [1.2], m2: [0.8], F: [5] }, 'their acceleration', H),
  make(109, 2, 'F', 'A {m} cart speeds up to the left at {a}. What is {?}? (Right is +, left is −.)', { m: [2.5], a: [3.6, 'left'] }, 'the net force on the cart', H),
  make(110, 2, 'a', 'A {m} box is pushed right with {F1} and pulled left with {F2}. What is {?}? (Right is +, left is −.)', { m: [18], F1: [35, 'right'], F2: [80, 'left'] }, 'the acceleration of the box', H),
  make(111, 2, 'm', 'A rope pulls a crate right with {F1}. Friction pulls left with {F2}. The crate speeds up at {a}. What is {?}?', { F1: [200, 'right'], F2: [50, 'left'], a: [2.5] }, 'the mass of the crate', H),
  make(112, 2, 'F', 'A {m1} car tows a {m2} trailer. Together they speed up at {a}. What is {?}?', { m1: [1500], m2: [300], a: [1.5] }, 'the net force on the car and trailer', H),
  make(113, 2, 'a', 'A {m1} cart carries a {m2} brick. The cart is pushed left with {F1} and right with {F2}. What is {?}? (Right is +, left is −.)', { m1: [2], m2: [1.5], F1: [14, 'left'], F2: [3.5, 'right'] }, 'their acceleration', H),
  make(114, 2, 'm', 'A net force of {F} to the left makes a cart speed up at {a} to the left. What is {?}?', { F: [7.2, 'left'], a: [1.8, 'left'] }, 'the mass of the cart', H),

  // =========================================================================
  // ⭐ HONORS — Level 3
  // =========================================================================
  make(115, 3, 'a', 'A {m} refrigerator is pushed right with {F1}. Friction pulls left with {F2}. What is {?}?', { m: [60], F1: [250, 'right'], F2: [100, 'left'] }, 'the acceleration of the refrigerator', H),
  make(116, 3, 'F', 'A {m} cart speeds up to the left at {a}. What is {?}? (Right is +, left is −.)', { m: [4.5], a: [2.4, 'left'] }, 'the net force on the cart', H),
  make(117, 3, 'a', 'A {m1} cart carries a {m2} bag of sand. The net force on them is {F}. What is {?}?', { m1: [6], m2: [3], F: [27] }, 'their acceleration', H),
  make(118, 3, 'a', 'An {m} box is pushed right with {F1} and pulled left with {F2}. What is {?}? (Right is +, left is −.)', { m: [8], F1: [18, 'right'], F2: [42, 'left'] }, 'the acceleration of the box', H),
  make(119, 3, 'm', 'A dog pulls a sled right with {F1}. Friction pulls left with {F2}. The sled speeds up at {a}. What is {?}?', { F1: [95, 'right'], F2: [15, 'left'], a: [4] }, 'the mass of the sled', H),
  make(120, 3, 'F', 'A {m1} cyclist rides a {m2} bike. Together they speed up to the left at {a}. What is {?}? (Right is +, left is −.)', { m1: [55], m2: [15], a: [1.2, 'left'] }, 'the net force on the cyclist and bike', H),
  make(121, 3, 'm', 'A net force of {F} to the left makes a crate speed up at {a} to the left. What is {?}?', { F: [36, 'left'], a: [4.5, 'left'] }, 'the mass of the crate', H),
  make(122, 3, 'a', 'A {m1} boat pulls a {m2} water skier. The boat engine pushes right with {F1}. Water drag pulls left with {F2}. What is {?}?', { m1: [400], m2: [50], F1: [600, 'right'], F2: [150, 'left'] }, 'their acceleration', H)
];

// Signed value: right is +, left is −
function signedValue(v) {
  return v.dir === 'left' ? -v.value : v.value;
}

// Exact answer: forces add to the net force, masses add to the total mass
function solveQuestion(q) {
  const sum = (variable) => q.values.filter(v => v.variable === variable).reduce((s, v) => s + signedValue(v), 0);
  if (q.solveFor === 'F') return sum('m') * sum('a');
  if (q.solveFor === 'a') return sum('F') / sum('m');
  return sum('F') / sum('a');
}

if (typeof module !== 'undefined') {
  module.exports = { QUESTIONS, solveQuestion, signedValue };
  if (require.main === module) {
    const ids = new Set();
    QUESTIONS.forEach(q => {
      if (ids.has(q.id)) throw new Error(`Duplicate id ${q.id}`);
      ids.add(q.id);
      const vars = new Set(q.values.map(v => v.variable));
      if (vars.has(q.solveFor) || vars.size !== 2) throw new Error(`Q${q.id}: bad variables`);
      const ans = solveQuestion(q);
      console.log(`${q.honors ? 'H' : ' '} L${q.level} Q${q.id} ${q.solveFor} = ${Math.round(ans * 1000) / 1000}`);
    });
    const count = (lvl, h) => QUESTIONS.filter(q => q.level === lvl && q.honors === h).length;
    console.log([1, 2, 3].map(l => `L${l}: ${count(l, false)} + ${count(l, true)} honors`).join(' | '));
  }
}
