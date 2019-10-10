import { Game, Card, CardDef } from '../engine';

// 「カードを2枚ドローし、そのどちらかを捨てる」
// という効果を持つスペルカード

export default {
	id: 'a629c01a-4520-4bc6-b1a5-f8d7ecd52eac',
	name: '宝箱',
	image: 'https://1.bp.blogspot.com/-abtG2HYMsA8/UU--5kLFD0I/AAAAAAAAO_w/ta20nlofB6Y/s400/kaizoku_takara.png',
	type: 'spell' as const,
	cost: 3,
	action: (state, thisCard, api, end) => {
		const drawed1 = state.draw(thisCard.owner);
		if (drawed1 == null) return state;
		const drawed2 = state.draw(thisCard.owner);
		if (drawed2 == null) return state;

		api.cardChoice(thisCard.owner, [drawed1, drawed2], chosen => {
			state.dropHandCard(chosen);
			end();
		});

		return state;
	}
} as CardDef;
