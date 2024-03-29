import { CardDef, UnitCard } from '../engine';

export default {
	id: 'cee44ed0-571a-4423-9fbf-8a2d5ad85f08',
	name: 'ネクロマンサー',
	desc: '<登場> フィールドに自分のトラッシュにあるコスト3以下のユニット1体を選んでフィールドに出す。',
	image: 'https://3.bp.blogspot.com/-XpKJmpZCGgA/WdyDpbYHRQI/AAAAAAABHeM/dsM5vV8jD2Yh7WWVsiueF1nef91rnAa0ACLcBGAs/s800/mahoutsukai_necromancer.png',
	type: 'unit' as const,
	power: 3,
	cost: 5,
	attrs: [],
	onPlay: async (game, thisCard, api) => {
		const chosen = await api.cardChoiceFrom(game.turn, 'trash', card => game.lookup(card).type === 'unit' && card.cost <= 3);
		if (chosen === null) return;
		const index = await api.choiceFieldIndex(game.turn);
		game.setUnit(chosen as UnitCard, game.turn === 0 ? 'back1' : 'back2', index);
		game.player.trash = game.player.trash.filter(x => x.id !== chosen.id);
	}
} as CardDef;
