import { CardDef } from '../engine';

export default {
	id: '6477e237-2ac2-46d0-b989-7f380d322a74',
	name: 'パワーアップ',
	image: 'https://2.bp.blogspot.com/-kX0PnaF5PC8/W9RcW7TRweI/AAAAAAABPqU/tCXGl6Srcx44kp8pMx0OEc2AHzdC8qNUACLcBGAs/s800/game_ken_seiken.png',
	type: 'spell' as const,
	cost: 3,
	action: async (game, thisCard, api) => {
		const chosen = await api.unitChoice(game.turn, game.turn);
		chosen.power += 3;
	}
} as CardDef;
