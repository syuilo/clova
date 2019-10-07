import { Game, Player } from '.';
import { Controller } from './controller';

const playerA = new Player([]);
const playerB = new Player([]);

const controller = new Controller({
	mainPhase: () => {
		const act = window.prompt('MAIN');
		if (act == null) return { type: 'turnEnd' };

		switch (act.split(' ')[0]) {
			case 'summon': return { type: 'summon',  };

			default:
				break;
		}
	}
});

const game = new Game([], [playerA, playerB]);

game.start();
