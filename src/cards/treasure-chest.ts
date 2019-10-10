import { CardDef } from '../engine';

// 「カードを2枚ドローし、そのどちらかを捨てる」
// という効果を持つスペルカード

export default {
	id: 'a629c01a-4520-4bc6-b1a5-f8d7ecd52eac',
	name: '宝箱',
	image: 'https://1.bp.blogspot.com/-abtG2HYMsA8/UU--5kLFD0I/AAAAAAAAO_w/ta20nlofB6Y/s400/kaizoku_takara.png',
	type: 'spell' as const,
	cost: 2,
	action: async (game, thisCard, api) => {
		const drawed1 = game.draw(game.turn);
		if (drawed1 == null) return;
		const drawed2 = game.draw(game.turn);
		if (drawed2 == null) return;

		const chosen = await api.cardChoice(game.turn, [drawed1, drawed2]);
	
		game.dropHandCard(game.player, chosen);
	}
} as CardDef;
