import { CardDef } from '../engine';

export default {
	id: 'c907bf86-80ed-4734-b1b4-4ecdc83384ad',
	name: 'ゴッドドッグ',
	image: 'https://2.bp.blogspot.com/-6HhC2AY0eps/XLAdB1LYatI/AAAAAAABSU8/6mvfk-9iyAA0mK8q8IKI4tNqTFt0Y1IDgCLcBGAs/s800/fantsy_haneinu.png',
	type: 'unit' as const,
	power: 1,
	cost: 2,
	skills: ['quick'],
	setup: async (game, thisCard) => {
	}
} as CardDef;
