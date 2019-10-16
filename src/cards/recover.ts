import { CardDef } from '../engine';

export default {
	id: 'eb86437b-19ca-4ba9-84e5-68f518398380',
	name: '癒しの魔法',
	desc: 'ライフ+2する。',
	image: 'https://4.bp.blogspot.com/-0yIvi-7GB3k/VLeqCjBcJLI/AAAAAAAAqbs/5xQ5c-WL8Po/s800/heart_ribbon_pink.png',
	type: 'spell' as const,
	cost: 3,
	action: async (game, thisCard, api) => {
		game.player.life += 2;
	}
} as CardDef;
