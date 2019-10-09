import { Game, Card } from '../server/engine';

export default {
	id: 'df24c430-cd3b-4a39-99e2-222154b98f27',
	name: 'Slime',
	type: 'unit' as const,
	power: 100,
	cost: 1,
	setup: (game: Game, thisCard: Card) => {
	}
};
