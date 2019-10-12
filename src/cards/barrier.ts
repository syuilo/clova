import { CardDef } from '../engine';

export default {
	id: '488559b0-74f5-465a-b5fa-701cf2fa2f5d',
	name: '聖なる守り',
	image: 'https://3.bp.blogspot.com/-xX3PcuPRerM/V9pplldNj2I/AAAAAAAA9tw/iKm1kH_O4XYZkLXsn76iu6HQLSmGh6ibQCLcB/s800/barrier_hemisphere.png',
	type: 'spell' as const,
	cost: 3,
	action: async (game, thisCard, api) => {
		const chosen = await api.unitChoice(game.turn);
		if (!chosen.skills.includes('defender')) chosen.skills.push('defender');
	}
} as CardDef;
