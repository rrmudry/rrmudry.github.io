import Game from './game.js';

window.addEventListener('load', () => {
    const canvas = document.getElementById('game-canvas');
    const game = new Game(canvas);
    game.start();
});
