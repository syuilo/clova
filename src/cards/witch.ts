import { CardDef } from '../engine';

export default {
	id: '2902ba9e-f1ca-4e25-8320-674fc75b7bd4',
	name: '魔法使い',
	image: 'https://2.bp.blogspot.com/-9E31gBPeGKI/U00KHPHLXqI/AAAAAAAAfOg/VfOxsQp8w-8/s800/majo_girl_majokko.png',
	type: 'unit' as const,
	power: 500,
	cost: 5,
	setup: async (game, thisCard) => {
	}
} as CardDef;
