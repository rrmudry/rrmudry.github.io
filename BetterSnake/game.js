const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const levelEl = document.getElementById('level');
const livesEl = document.getElementById('lives');
const powerEl = document.getElementById('power');
const gameOverEl = document.getElementById('gameover');
const finalScoreEl = document.getElementById('final-score');
const restartBtn = document.getElementById('restart');

const GRID = 20;
const TILE = canvas.width / GRID;
const POWER_DURATION = 5000;

let snake, dir, nextDir, food, powerUps, obstacles;
let score, level, lives, baseSpeed, activePower, powerEnd;
let running = false;

function init() {
  score = 0;
  level = 1;
  lives = 3;
  baseSpeed = 200;
  activePower = null;
  powerEnd = 0;
  resetLevel();
  updateUI();
  running = true;
  requestAnimationFrame(loop);
}

function resetLevel() {
  snake = [{x: Math.floor(GRID/2), y: Math.floor(GRID/2)}];
  dir = {x:1,y:0};
  nextDir = dir;
  food = spawnEmpty();
  powerUps = [];
  obstacles = [];
  if(level >=3) spawnObstacles((level-2)*2);
}

function spawnEmpty() {
  let pos;
  do {
    pos = {x: rand(GRID), y: rand(GRID)};
  } while(occupied(pos));
  return pos;
}

function spawnObstacles(n) {
  obstacles = [];
  for(let i=0;i<n;i++) {
    obstacles.push(spawnEmpty());
  }
}

function occupied(pos) {
  return snake.some(s=>s.x===pos.x && s.y===pos.y) ||
         obstacles.some(o=>o.x===pos.x && o.y===pos.y) ||
         (food && food.x===pos.x && food.y===pos.y);
}

function rand(max) { return Math.floor(Math.random()*max); }

function loop(timestamp) {
  if(!running) return;
  const speed = getSpeed();
  if(!loop.last || timestamp-loop.last>=speed) {
    update();
    draw();
    loop.last = timestamp;
  }
  requestAnimationFrame(loop);
}

function getSpeed() {
  let s = baseSpeed - (level-1)*20;
  if(activePower==='speed') s /= 2;
  if(activePower==='slow') s *= 1.5;
  return Math.max(40,s);
}

function update() {
  if(activePower && Date.now()>powerEnd) {
    activePower = null;
    powerEl.textContent = '';
  }
  if(Math.random()<0.02 && powerUps.length<1) {
    powerUps.push({type: ['speed','slow','shrink'][rand(3)], pos: spawnEmpty()});
  }

  dir = nextDir;
  const head = {x: snake[0].x + dir.x, y: snake[0].y + dir.y};
  wrap(head);

  if(hitObstacle(head) || hitSelf(head)) {
    lives--;
    if(lives<=0) return gameOver();
    resetLevel();
    updateUI();
    return;
  }

  snake.unshift(head);
  if(head.x===food.x && head.y===food.y) {
    score++;
    food = spawnEmpty();
    if(score % 10 ===0 && level<5){ level++; resetLevel(); }
  } else {
    snake.pop();
  }

  const puIndex = powerUps.findIndex(p=>p.pos.x===head.x && p.pos.y===head.y);
  if(puIndex>-1) {
    const type = powerUps[puIndex].type;
    powerUps.splice(puIndex,1);
    applyPower(type);
  }

  updateUI();
}

function hitObstacle(pos){ return obstacles.some(o=>o.x===pos.x&&o.y===pos.y); }
function hitSelf(pos){ return snake.slice(1).some(s=>s.x===pos.x&&s.y===pos.y); }
function wrap(pos){
  if(pos.x<0) pos.x=GRID-1;
  if(pos.x>=GRID) pos.x=0;
  if(pos.y<0) pos.y=GRID-1;
  if(pos.y>=GRID) pos.y=0;
}

function applyPower(type){
  activePower = type;
  powerEnd = Date.now()+POWER_DURATION;
  powerEl.textContent = type;
  if(type==='shrink' && snake.length>3){ snake.splice(-2); }
}

function draw() {
  ctx.fillStyle='#000';
  ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle='#0f0';
  snake.forEach(s=>drawRect(s.x,s.y,'#0f0'));
  drawRect(food.x,food.y,'#f00');
  powerUps.forEach(p=>drawRect(p.pos.x,p.pos.y,'#ff0'));
  ctx.fillStyle='#888';
  obstacles.forEach(o=>drawRect(o.x,o.y,'#888'));
}

function drawRect(x,y,color){
  ctx.fillStyle=color;
  ctx.fillRect(x*TILE,y*TILE,TILE-1,TILE-1);
}

function updateUI(){
  scoreEl.textContent = score;
  levelEl.textContent = level;
  livesEl.textContent = lives;
}

function gameOver(){
  running=false;
  finalScoreEl.textContent=score;
  gameOverEl.classList.remove('hidden');
}

restartBtn.onclick = () => {
  gameOverEl.classList.add('hidden');
  init();
};

window.addEventListener('keydown',e=>{
  if(e.key==='ArrowUp' && dir.y!==1) nextDir={x:0,y:-1};
  else if(e.key==='ArrowDown' && dir.y!==-1) nextDir={x:0,y:1};
  else if(e.key==='ArrowLeft' && dir.x!==1) nextDir={x:-1,y:0};
  else if(e.key==='ArrowRight' && dir.x!==-1) nextDir={x:1,y:0};
});

init();
