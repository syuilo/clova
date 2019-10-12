import { CardDef } from '../engine';

// このユニットが破壊されたとき、相手はカードをドローする

export default {
	id: '7588499b-1c33-4c7b-94b4-740ce457fd02',
	name: 'ミミック',
	image: 'https://1.bp.blogspot.com/-_8wJqUxj-d4/W4PJlko8nmI/AAAAAAABOIc/Z-MzXgFr2OkbWRKja484G8tVn74a80h5QCLcBGAs/s800/character_game_mimic.png',
	type: 'unit' as const,
	power: 4,
	cost: 4,
	skills: [],
	onDestroy: async (game, thisCard) => {
		game.draw(thisCard.owner === 0 ? 1 : 0);
	}
} as CardDef;
