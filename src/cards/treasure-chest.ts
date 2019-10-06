import { Context } from '..';

// 「カードを2枚ドローし、そのどちらかを捨てる」
// という効果を持つスペルカード

export default {
	id: 'a629c01a-4520-4bc6-b1a5-f8d7ecd52eac',
	name: 'Treasure Chest',
	type: 'spell',
	cost: 3,
	action: async (ctx: Context) => {
		const drawed1 = ctx.draw(ctx.thisCard.owner);
		if (drawed1 === null) return;
		const drawed2 = ctx.draw(ctx.thisCard.owner);
		if (drawed2 === null) return;

		const chosen = await ctx.cardChoices(ctx.thisCard.owner, [drawed1, drawed2]);

		ctx.game.dropHandCard(chosen);
	}
};
