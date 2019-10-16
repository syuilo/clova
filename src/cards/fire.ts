import { CardDef } from '../engine';

export default {
	id: 'df694836-4239-463f-916f-bf3af90226c6',
	name: '火の魔法',
	desc: 'ユニット1体に2ダメージ。',
	image: 'https://3.bp.blogspot.com/-bTpI2R-Kxe0/Viio_KII7WI/AAAAAAAAztM/oNokVj_uJyI/s800/honoo_hi_fire.png',
	type: 'spell' as const,
	cost: 2,
	action: async (game, thisCard, api) => {
		const chosen = await api.unitChoice(game.turn, game.turn === 0 ? 1 : 0);
		if (chosen === null) return;
		game.damageUnit(chosen, 2);
	}
} as CardDef;
