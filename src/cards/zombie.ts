import { Game, Card } from '../engine';

// 「このカードが破壊されるとき、カードの持ち主に選択肢A「何もしにゃい」と選択肢B「復活」を提示し、
// Aを選ぶと何もせず、Bを選ぶとダメージ500を受ける代わりにこのカードを復活させる」
// という効果を持つカード

export default {
	id: '0bb8df78-2e97-443c-ac8a-78649aaa28cd',
	name: 'ゾンビ',
	image: 'https://1.bp.blogspot.com/-f8ltztd6QEs/WUJGwkjY85I/AAAAAAABEzs/2a4OD0OvHQklr6HQAAa209LVBLWxJc1gQCLcBGAs/s400/fantasy_zombie_man.png',
	type: 'unit' as const,
	power: 500,
	cost: 3,
	setup: (game: Game, thisCard: Card) => {
		let destroyedPosition: number | null = null;
	
		ctx.thisCard.onBeforeDestroy = () => {
			destroyedPosition = ctx.game.getCardPos(ctx.thisCard);
		};

		ctx.thisCard.onDestroyed = () => {
			ctx.game.showChoices(ctx.thisCard.owner, [{
				text: 'nope',
				callback: () => {}
			}, {
				text: 'rebirth',
				callback: () => {
					ctx.game.damage(ctx.thisCard.owner, 500);
					ctx.game.summon(ctx.thisCard, destroyedPosition!);
				}
			}]);
		};
	}
};
