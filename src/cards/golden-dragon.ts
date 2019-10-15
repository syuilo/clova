import { CardDef } from '../engine';

export default {
	id: '716e4b38-b28a-4364-b338-534110e833ea',
	name: 'ゴールデンドラゴン',
	image: 'https://2.bp.blogspot.com/-JRXAdeAa8lE/WaPvrH9bcpI/AAAAAAABGOU/5qgPt_CJ_C0U_1rknFbVL94yHeDPan8ngCLcBGAs/s800/fantasy_kouryu_dragon.png',
	type: 'unit' as const,
	power: 9,
	cost: 10,
	attrs: ['quick', 'defender'],
	setup: async (game, thisCard) => {
	}
} as CardDef;
