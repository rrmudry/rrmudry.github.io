export default class InputHandler {
    constructor(game) {
        this.game = game;
        this.mouseX = 0;
        this.mouseY = 0;

        window.addEventListener('mousemove', (e) => {
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
        });

        window.addEventListener('keydown', (e) => {
            if (e.key === 'a') this.game.fireMissile(0);
            if (e.key === 's') this.game.fireMissile(1);
                                    if (e.key === 'd') this.game.fireMissile(2);
            if (e.key === 'p') this.game.togglePause();
            if (e.key === 'm') this.game.toggleMute();

            if (this.game.state === 'MENU' && e.key === 's') {
                this.game.start();
            }
            if ((this.game.state === 'GAME_OVER' || this.game.state === 'PLAYING') && e.key === 'r') {
                this.game.restart();
            }

            if (this.game.state === 'MENU' && e.key === 's') {
                this.game.start();
            }
                        if ((this.game.state === 'GAME_OVER' || this.game.state === 'PLAYING') && e.key === 'r') {
                this.game.restart();
            }
        });
    }
}