import { CardDef } from '../engine';

export default {
	id: '9bc8340f-b382-48eb-abb1-2452661dffee',
	name: 'クラッキング',
	desc: 'ユニット1体のディフェンスを解除する。',
	image: 'https://1.bp.blogspot.com/-M8FyjFiDUXs/XGjyFslnIII/AAAAAAABReM/YYKyntrOVbMKKFudalrqiFGRriOQoF98wCLcBGAs/s2000/bg_glass_ware.jpg',
	type: 'spell' as const,
	cost: 3,
	action: async (game, thisCard, api) => {
		const chosen = await api.unitChoice(game.turn === 0 ? 1 : 0);
		chosen.skills = chosen.skills.filter(x => x !== 'defender');
	}
} as CardDef;
