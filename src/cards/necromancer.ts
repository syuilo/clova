import { CardDef, UnitCard } from '../engine';

export default {
	id: 'cee44ed0-571a-4423-9fbf-8a2d5ad85f08',
	name: 'ネクロマンサー',
	desc: 'このユニットがプレイされたとき、フィールドに自分のトラッシュにあるコスト3以下のユニット1体を選んでフィールドに出す。',
	image: 'https://3.bp.blogspot.com/-XpKJmpZCGgA/WdyDpbYHRQI/AAAAAAABHeM/dsM5vV8jD2Yh7WWVsiueF1nef91rnAa0ACLcBGAs/s800/mahoutsukai_necromancer.png',
	type: 'unit' as const,
	power: 3,
	cost: 5,
	skills: [],
	onPlay: async (game, thisCard, api) => {
		const chosen = await api.cardChoiceFromTrash(game.turn, 'unit', 3) as UnitCard;
		const index = await api.choiceFieldIndex(game.turn);
		game.setUnit(chosen, game.turn === 0 ? 'back1' : 'back2', index);
	}
} as CardDef;
