import { Base, Meteor, Missile, Explosion, PowerUp } from './entities.js';
import { LEVELS } from './levels.js';
import InputHandler from './input.js';
import UI from './ui.js';

/**
 * Main game class to manage game state, entities, and the game loop.
 */
export default class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.lastTime = 0;
        this.state = 'MENU'; // BOOT, MENU, PLAYING, PAUSED, LEVEL_COMPLETE, GAME_OVER

        this.bases = [];
        this.meteors = [];
        this.missiles = [];
        this.explosions = [];
        this.powerUps = [];

        this.level = 0;
        this.lives = 3;
        this.score = 0;
        this.waveMeteors = 0;
        this.muted = false;
        this.powerUpSpawnTimer = 0;
        this.missileSpeedMultiplier = 1;
        this.fastMissileTimer = 0;
        this.smartMissiles = 0;

        this.input = new InputHandler(this);
        this.ui = new UI(this);

        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.groundY = this.canvas.height - 50;
        this.setupBases();
    }

    setupBases() {
        this.bases = [];
        if (this.level === 1) {
            this.bases.push(new Base(0, 'distance', this.canvas.width * 0.5, this.groundY));
        } else if (this.level === 2) {
            this.bases.push(new Base(0, 'distance', this.canvas.width * 0.3, this.groundY));
            this.bases.push(new Base(2, 'time', this.canvas.width * 0.7, this.groundY));
        } else {
            this.bases = [
                new Base(0, 'distance', this.canvas.width * 0.2, this.groundY),
                new Base(1, 'speed', this.canvas.width * 0.5, this.groundY),
                new Base(2, 'time', this.canvas.width * 0.8, this.groundY)
            ];
        }
    }

    start() {
        this.state = 'PLAYING';
        this.level = 1;
        this.lives = 3;
        this.score = 0;
        this.meteors = [];
        this.missiles = [];
        this.explosions = [];
        this.powerUps = [];
        this.powerUpSpawnTimer = 0;
        this.missileSpeedMultiplier = 1;
        this.fastMissileTimer = 0;
        this.smartMissiles = 0;
        this.loadLevel(this.level);
        requestAnimationFrame((time) => this.gameLoop(time));
    }

    restart() {
        this.start();
    }

    loadLevel(levelId) {
        const levelData = LEVELS.find(l => l.id === levelId);
        if (!levelData) {
            this.state = 'GAME_OVER'; // Or a 'YOU WIN' state
            this.saveHighScore();
            return;
        }

        this.currentLevel = levelData;
        this.meteorSpawnTimer = 0;
        this.powerUpSpawnTimer = 0;
        this.waveMeteors = levelData.wave;
        this.setupBases();
    }

    gameLoop(currentTime) {
        const deltaTime = Math.min(currentTime - this.lastTime, 50); // Clamp deltaTime
        this.lastTime = currentTime;

        this.update(deltaTime);
        this.draw();

        requestAnimationFrame((time) => this.gameLoop(time));
    }

    update(deltaTime) {
        if (this.state !== 'PLAYING') return;

        this.meteorSpawnTimer += deltaTime;
        if (this.meteorSpawnTimer > this.currentLevel.spawnRateMs && this.waveMeteors > 0) {
            this.spawnMeteor();
            this.meteorSpawnTimer = 0;
            this.waveMeteors--;
        }

        this.powerUpSpawnTimer += deltaTime;
        if (this.powerUpSpawnTimer > 10000 && Math.random() < 0.1) { // 10% chance every 10 seconds
            this.spawnPowerUp();
            this.powerUpSpawnTimer = 0;
        }

        if (this.fastMissileTimer > 0) {
            this.fastMissileTimer -= deltaTime;
            if (this.fastMissileTimer <= 0) {
                this.missileSpeedMultiplier = 1;
            }
        }

        this.meteors.forEach(meteor => meteor.update(deltaTime));
        this.missiles.forEach(missile => missile.update(deltaTime));
        this.explosions.forEach(explosion => explosion.update(deltaTime));
        this.powerUps.forEach(powerUp => powerUp.update(deltaTime));

        this.checkCollisions();

        this.meteors.forEach((meteor, index) => {
            if (meteor.y >= this.groundY) {
                this.meteors.splice(index, 1);
                this.lives--;
                if (this.lives <= 0) {
                    this.state = 'GAME_OVER';
                    this.saveHighScore();
                }
            }
        });

        this.powerUps.forEach((powerUp, index) => {
            if (powerUp.y >= this.groundY) {
                this.powerUps.splice(index, 1);
            }
        });

        this.explosions = this.explosions.filter(e => e.alive);

        if (this.waveMeteors <= 0 && this.meteors.length === 0) {
            this.level++;
            this.loadLevel(this.level);
        }
    }

    spawnMeteor() {
        const level = this.currentLevel;
        const x = Math.random() * this.canvas.width;
        const y = -50;
        const type = this.getRandomMeteorType();
        const meteor = new Meteor(Date.now(), type, x, y, 0, 0.1, 40, 0, 100);
        this.meteors.push(meteor);
    }

    spawnPowerUp() {
        const x = Math.random() * this.canvas.width;
        const y = -50;
        const rand = Math.random();
        let type;
        if (rand < 0.5) {
            type = 'extraLife';
        } else if (rand < 0.8) {
            type = 'fastMissile';
        } else {
            type = 'smartMissile';
        }
        const powerUp = new PowerUp(Date.now(), type, x, y, 0.05, 15);
        this.powerUps.push(powerUp);
    }

    getRandomMeteorType() {
        const mix = this.currentLevel.mix;
        const rand = Math.random();
        if (rand < mix.distance) return 'distance';
        if (rand < mix.distance + mix.speed) return 'speed';
        return 'time';
    }

    fireMissile(baseIndex) {
        const base = this.bases[baseIndex];
        const now = Date.now();
        if (now < base.readyAt) return;

        base.readyAt = now + this.currentLevel.baseCooldownMs;

        let targetX = this.input.mouseX;
        let targetY = this.input.mouseY;
        let targetMeteor = null;

        if (this.smartMissiles > 0) {
            targetMeteor = this.findNearestMeteor(base.x, base.y);
            if (targetMeteor) {
                targetX = targetMeteor.x;
                targetY = targetMeteor.y;
                this.smartMissiles--;
            }
        }

        const dx = targetX - base.x;
        const dy = targetY - base.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const speed = 500 * this.missileSpeedMultiplier; // px/s

        const missile = new Missile(
            Date.now(),
            base.id,
            base.type,
            base.x,
            base.y - 20,
            (dx / dist) * (speed / 1000),
            (dy / dist) * (speed / 1000),
            targetX,
            targetY,
            targetMeteor
        );
        this.missiles.push(missile);
    }

    findNearestMeteor(x, y) {
        let nearestMeteor = null;
        let minDistance = Infinity;

        this.meteors.forEach(meteor => {
            const dx = meteor.x - x;
            const dy = meteor.y - y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < minDistance) {
                minDistance = dist;
                nearestMeteor = meteor;
            }
        });

        return nearestMeteor;
    }

    checkCollisions() {
        // Missile target arrival
        this.missiles.forEach((missile, index) => {
            const dx = missile.x - missile.targetX;
            const dy = missile.y - missile.targetY;
            if (dx * dx + dy * dy < 25 * 25) { // 25px radius
                this.missiles.splice(index, 1);
                this.createExplosion(missile.x, missile.y, missile.type);
            }
        });

        // Explosion-meteor collision
        this.explosions.forEach(explosion => {
            this.meteors.forEach((meteor, meteorIndex) => {
                if (!meteor) return; // Meteor might have been destroyed by another explosion in the same frame
                const dx = explosion.x - meteor.x;
                const dy = explosion.y - meteor.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < explosion.radius + meteor.radius) {
                    if (explosion.ownerType === meteor.type) {
                        this.meteors[meteorIndex] = undefined; // Mark for removal
                        this.score += 100;
                    } else {
                        if (meteor.splitCount < this.currentLevel.splitLimit) {
                            this.splitMeteor(meteor);
                            this.meteors[meteorIndex] = undefined; // Mark for removal
                            this.score -= 25;
                        }
                    }
                }
            });
        });
        this.meteors = this.meteors.filter(m => m);

        // Explosion-powerup collision
        this.explosions.forEach(explosion => {
            this.powerUps.forEach((powerUp, powerUpIndex) => {
                if (!powerUp) return;
                const dx = explosion.x - powerUp.x;
                const dy = explosion.y - powerUp.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < explosion.radius + powerUp.radius) {
                    this.powerUps[powerUpIndex] = undefined; // Mark for removal
                    if (powerUp.type === 'extraLife') {
                        this.lives++;
                    } else if (powerUp.type === 'fastMissile') {
                        this.missileSpeedMultiplier = 2;
                        this.fastMissileTimer = 10000;
                    } else if (powerUp.type === 'smartMissile') {
                        this.smartMissiles++;
                    }
                }
            });
        });
        this.powerUps = this.powerUps.filter(p => p);
    }

    createExplosion(x, y, type) {
        const maxRadius = this.currentLevel.explosionRadius;
        const initialRadius = maxRadius / 2;
        const explosion = new Explosion(Date.now(), x, y, initialRadius, maxRadius, 0.5, 0.5, type);
        this.explosions.push(explosion);
    }

    splitMeteor(meteor) {
        const angle1 = Math.atan2(meteor.vy, meteor.vx) + 0.55;
        const angle2 = Math.atan2(meteor.vy, meteor.vx) - 0.55;
        const speed = Math.sqrt(meteor.vx * meteor.vx + meteor.vy * meteor.vy) * 1.1;

        const child1 = new Meteor(Date.now(), meteor.type, meteor.x, meteor.y, Math.cos(angle1) * speed, Math.sin(angle1) * speed, meteor.radius * 0.7, meteor.splitCount + 1, 50);
        const child2 = new Meteor(Date.now(), meteor.type, meteor.x, meteor.y, Math.cos(angle2) * speed, Math.sin(angle2) * speed, meteor.radius * 0.7, meteor.splitCount + 1, 50);

        this.meteors.push(child1, child2);
    }

    saveHighScore() {
        const highScores = JSON.parse(localStorage.getItem('highScores')) || [];
        highScores.push(this.score);
        highScores.sort((a, b) => b - a);
        highScores.splice(5); // Keep top 5 scores
        localStorage.setItem('highScores', JSON.stringify(highScores));
    }

    togglePause() {
        if (this.state === 'PLAYING') {
            this.state = 'PAUSED';
        } else if (this.state === 'PAUSED') {
            this.state = 'PLAYING';
        }
    }

    toggleMute() {
        this.muted = !this.muted;
    }

    draw() {
        this.ctx.fillStyle = 'black';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.state === 'MENU' || this.state === 'GAME_OVER' || this.state === 'PAUSED') {
            this.ui.draw(this.ctx);
            return;
        }

        // Draw ground
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(0, this.groundY, this.canvas.width, this.canvas.height - this.groundY);

        this.bases.forEach(base => base.draw(this.ctx));
        this.meteors.forEach(meteor => meteor.draw(this.ctx));
        this.missiles.forEach(missile => missile.draw(this.ctx));
        this.explosions.forEach(explosion => explosion.draw(this.ctx));
        this.powerUps.forEach(powerUp => powerUp.draw(this.ctx));
        this.ui.draw(this.ctx);
    }
}
