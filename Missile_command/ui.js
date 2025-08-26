export default class UI {
    constructor(game) {
        this.game = game;
        this.font = '30px Arial';
    }

    draw(ctx) {
        ctx.fillStyle = 'white';
        ctx.font = this.font;

        // HUD
        ctx.textAlign = 'center';
        ctx.fillText(`Score: ${this.game.score}`, this.game.canvas.width / 2, 40);
        ctx.fillText(`Level: ${this.game.level}`, this.game.canvas.width / 2, 80); // Moved down to avoid overlap
        ctx.fillText(`Lives: ${this.game.lives}`, this.game.canvas.width / 2, 120); // Moved down to avoid overlap
        ctx.textAlign = 'start'; // Reset to default for other elements
        if (this.game.smartMissiles > 0) {
            ctx.fillText(`Smart Missiles: ${this.game.smartMissiles}`, 20, 80);
        }

        if (this.game.state === 'GAME_OVER') {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(0, 0, this.game.canvas.width, this.game.canvas.height);
            ctx.fillStyle = 'white';
            ctx.textAlign = 'center';
            ctx.fillText('GAME OVER', this.game.canvas.width / 2, this.game.canvas.height / 2 - 40);
            ctx.fillText(`Final Score: ${this.game.score}`, this.game.canvas.width / 2, this.game.canvas.height / 2);
            ctx.fillText('Press R to Restart', this.game.canvas.width / 2, this.game.canvas.height / 2 + 40);

            const highScores = JSON.parse(localStorage.getItem('highScores')) || [];
            if (highScores.length > 0) {
                ctx.fillText('High Scores:', this.game.canvas.width / 2, this.game.canvas.height / 2 + 100);
                highScores.forEach((score, index) => {
                    ctx.fillText(`${index + 1}. ${score}`, this.game.canvas.width / 2, this.game.canvas.height / 2 + 140 + index * 40);
                });
            }
        } else if (this.game.state === 'PAUSED') {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(0, 0, this.game.canvas.width, this.game.canvas.height);
            ctx.fillStyle = 'white';
            ctx.textAlign = 'center';
            ctx.fillText('PAUSED', this.game.canvas.width / 2, this.game.canvas.height / 2);
        }

        if (this.game.state === 'MENU') {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(0, 0, this.game.canvas.width, this.game.canvas.height);
            ctx.fillStyle = 'white';
            ctx.textAlign = 'center';
            ctx.fillText('Physics Defense', this.game.canvas.width / 2, this.game.canvas.height / 2 - 80);
            ctx.fillText('Press S to Start Game', this.game.canvas.width / 2, this.game.canvas.height / 2);
            ctx.fillText('Press E for Endless Mode', this.game.canvas.width / 2, this.game.canvas.height / 2 + 40);
        }
    }
}