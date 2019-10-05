export default {
	name: 'Zombie',
	id: '0bb8df78-2e97-443c-ac8a-78649aaa28cd',
	hp: 500,
	ap: 300,
	cost: 3,
	setup: (ctx: any) => {
		ctx.thisCard.onBeforeDestroy = () => {
			ctx.showChoices([{
				text: 'nope'
			}, {
				text: 'rebirth',
				callback: () => {
					ctx.damege(ctx.thisCard.owner, 500);
					ctx.summon(ctx.thisCard, ctx.thisCard.owner);
				}
			}]);
		};
	}
};
