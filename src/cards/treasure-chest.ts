import { Game, Card } from '..';

// 「カードを2枚ドローし、そのどちらかを捨てる」
// という効果を持つスペルカード

export default {
	id: 'a629c01a-4520-4bc6-b1a5-f8d7ecd52eac',
	name: 'Treasure Chest',
	type: 'spell',
	cost: 3,
	action: async (game: Game, thisCard: Card) => {
		const drawed1 = game.draw(thisCard.owner);
		if (drawed1 === null) return;
		const drawed2 = game.draw(thisCard.owner);
		if (drawed2 === null) return;

		const chosen = await game.cardChoices(thisCard.owner, [drawed1, drawed2]);

		game.dropHandCard(chosen);
	}
};
