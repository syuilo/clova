import { Context } from '..';

// 「カードを2枚ドローし、そのどちらかを捨てる」
// という効果を持つスペルカード

export default {
	id: 'a629c01a-4520-4bc6-b1a5-f8d7ecd52eac',
	name: 'Treasure Chest',
	type: 'spell',
	cost: 3,
	action: async (ctx: Context) => {
		const drew1 = ctx.draw(ctx.thisCard.owner);
		const drew2 = ctx.draw(ctx.thisCard.owner);

		const chosen = await ctx.showCardChoices(ctx.thisCard.owner, [drew1, drew2]);

		ctx.game.dropHandCard(chosen);
	}
};
