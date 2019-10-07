import { Game, Player } from '.';
import { Controller, Actions } from './controller';

const playerA = new Player([]);
const playerB = new Player([]);

const player1Actions: Actions = {
	choiceRedrawCards: (cards) => {
		return window.prompt('REDRAW');
	},

	mainPhase: () => {
		const act = window.prompt('MAIN');
		if (act == null) return { type: 'turnEnd' };

		switch (act.split(' ')[0]) {
			case 'summon': return { type: 'summon',  };

			default:
				break;
		}
	}
};

const controller = new Controller([player1Actions, player2Actions]);

const game = new Game([], [playerA, playerB]);

game.start();
