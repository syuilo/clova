import { CardDef } from '../engine';

export default {
	id: '199d4ed1-ae90-4f28-9d90-40475563e918',
	name: 'ドラゴン',
	image: 'https://4.bp.blogspot.com/-t0TdfnnfnH0/UT10GYML1QI/AAAAAAAAOrY/qNLEwXbzl-0/s1600/fantasy_dragon.png',
	type: 'unit' as const,
	power: 8,
	cost: 8,
	attrs: ['quick'],
	setup: async (game, thisCard) => {
	}
} as CardDef;
