import { CardDef } from '../engine';

export default {
	id: 'cee44ed0-571a-4423-9fbf-8a2d5ad85f08',
	name: 'ネクロマンサー',
	desc: 'このユニットがプレイされたとき、フィールドに自分のトラッシュにあるコスト3以下のユニット1体を選んでフィールドに出す。',
	image: 'https://3.bp.blogspot.com/-XpKJmpZCGgA/WdyDpbYHRQI/AAAAAAABHeM/dsM5vV8jD2Yh7WWVsiueF1nef91rnAa0ACLcBGAs/s800/mahoutsukai_necromancer.png',
	type: 'unit' as const,
	power: 3,
	cost: 5,
	skills: [],
	setup: async (game, thisCard) => {

	}
} as CardDef;
