import { CardDef } from '../engine';

export default {
	id: '2aa6e8ae-1b14-4078-be10-2f74a6dacd3a',
	name: 'エナジードリンク',
	desc: 'エネルギー+3',
	image: 'https://4.bp.blogspot.com/-IkazUSDDSgI/Vz_w3dGx8kI/AAAAAAAA6uc/fWiat0hlYmgW23QTrIIQY9piit5cHKTtgCLcB/s800/drink_energy.png',
	type: 'spell' as const,
	cost: 2,
	action: async (game, thisCard, api) => {
		game.player.energy += 3;
	}
} as CardDef;
