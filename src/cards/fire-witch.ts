import { CardDef } from '../engine';
import fire from './fire';

export default {
	id: '763d5c10-a709-4afd-92b3-9023b0af48f9',
	name: '火の魔法使い',
	desc: '<登場> 「火の魔法」1枚を手札に加え、そのコストを0にする。',
	image: 'https://1.bp.blogspot.com/-qIk57ZwR7Fw/WK7fAj4LuDI/AAAAAAABCAQ/k376RTqNXLkq9vDKscHrbBcyck-X7PofgCLcB/s800/mahoutsukai_fire.png',
	type: 'unit' as const,
	power: 2,
	cost: 4,
	attrs: [],
	onPlay: async (game, thisCard) => {
		const card = game.instantiate(thisCard.owner, fire);
		card.cost = 0;
		game.player.hand.push(card);
	}
} as CardDef;
