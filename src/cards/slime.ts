import { Game, Card } from '../engine';

export default {
	id: 'df24c430-cd3b-4a39-99e2-222154b98f27',
	name: 'スライム',
	image: 'https://1.bp.blogspot.com/-DSgUUXrWoFw/XVKfz2Z_3XI/AAAAAAABUEs/a9QCrDh18-grpZCL0O_pD7r4KWC921gawCLcBGAs/s400/fantasy_game_character_slime.png',
	type: 'unit' as const,
	power: 100,
	cost: 1,
	setup: (game: Game, thisCard: Card) => {
	}
};
