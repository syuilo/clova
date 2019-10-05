import { Context } from '..';

// 「カードを2枚ドローし、そのどちらかを捨てる」
// という効果を持つスペルカード

export default {
	id: 'a629c01a-4520-4bc6-b1a5-f8d7ecd52eac',
	name: 'Treasure Chest',
	type: 'spell',
	action: async (ctx: Context) => {
		const drew1 = ctx.game.draw();
		const drew2 = ctx.game.draw();

		const chosen = await ctx.game.showCardChoices(ctx.thisCard.owner, [drew1, drew2]);

		chosen.destroy();
	}
};
