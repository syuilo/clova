import { CardDef } from '../engine';
import fire from './fire';
import recover from './recover';
import powerUp from './power-up';

export default {
	id: '2902ba9e-f1ca-4e25-8320-674fc75b7bd4',
	name: '魔法使い',
	desc: 'このユニットがフィールドにある限り、自分のターン終了ごとに「火の魔法」「癒しの魔法」「強化の魔法」のいずれかを選び手札に加える。',
	image: 'https://2.bp.blogspot.com/-9E31gBPeGKI/U00KHPHLXqI/AAAAAAAAfOg/VfOxsQp8w-8/s800/majo_girl_majokko.png',
	type: 'unit' as const,
	power: 2,
	cost: 5,
	attrs: [],
	onMyTurnEnd: async (game, thisCard, api) => {
		const a = game.instantiate(game.turn, fire);
		const b = game.instantiate(game.turn, recover);
		const c = game.instantiate(game.turn, powerUp);
		const chosen = await api.cardChoice(game.turn, [a, b, c]);
		game.player.hand.push(chosen!);
	}
} as CardDef;
