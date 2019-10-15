import { CardDef } from '../engine';

export default {
	id: '86a05f7f-ad39-437e-b78a-eb7ad987cff5',
	name: 'ゴーレム',
	image: 'https://3.bp.blogspot.com/-ZWsv1eBwP-8/XDXcFKGXH2I/AAAAAAABRGs/bAVhn3sVs2wkaFSaeTzvwdAD3CuS47ZUACLcBGAs/s800/fantasy_golem.png',
	type: 'unit' as const,
	power: 3,
	cost: 5,
	attrs: ['defender'],
	setup: async (game, thisCard) => {
	}
} as CardDef;
