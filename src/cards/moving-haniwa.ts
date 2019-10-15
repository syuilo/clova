import { CardDef } from '../engine';

export default {
	id: '389c0fd0-2435-4732-89fe-9e3df257b2df',
	name: '動くハニワ',
	image: 'https://2.bp.blogspot.com/-N-jDwVKR98s/U7O8GKiTydI/AAAAAAAAiZs/hJRKcA09g54/s800/haniwa.png',
	type: 'unit' as const,
	power: 1,
	cost: 2,
	attrs: ['defender'],
	setup: async (game, thisCard) => {
	}
} as CardDef;
