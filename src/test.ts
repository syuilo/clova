import { Game, Player } from '.';

const playerA = new Player([]);
const playerB = new Player([]);

const game = new Game([playerA, playerB]);

game.start();
