import { Context } from '..';

// 「このカードが破壊されるとき、カードの持ち主に選択肢A「何もしにゃい」と選択肢B「復活」を提示し、
// Aを選ぶと何もせず、Bを選ぶとダメージ500を受ける代わりにこのカードを復活させる」
// という効果を持つカード

export default {
	name: 'Zombie',
	id: '0bb8df78-2e97-443c-ac8a-78649aaa28cd',
	hp: 500,
	ap: 300,
	cost: 3,
	setup: (ctx: Context) => {
		let destoryedPosition: number | null = null;
	
		ctx.thisCard.onBeforeDestroy = () => {
			destoryedPosition = ctx.game.getCardPos(ctx.thisCard);
		};

		ctx.thisCard.onDestroyed = () => {
			ctx.game.showChoices(ctx.thisCard.owner, [{
				text: 'nope',
				callback: () => {}
			}, {
				text: 'rebirth',
				callback: () => {
					ctx.game.damege(ctx.thisCard.owner, 500);
					ctx.game.summon(ctx.thisCard, destoryedPosition!);
				}
			}]);
		};
	}
};
