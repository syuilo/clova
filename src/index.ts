type Block = {
	type: 'empty' | 'unit';
};

type Field = Block[][];

type Commit = {
	player: number;
} & ({
	type: 'beginTurn';
	drew: Card['id'];
} | {
	type: 'lose';
	reason: 'noDeck';
});

type Card = {
	type: 'unit' | 'spell';
	id: string;
};

export class Player {
	deck: Card[];

	constructor(deck: Player['deck']) {
		this.deck = deck;
	}
}

export class Game {
	private field: Field;
	private turn: 0 | 1;
	private commits: Commit[];
	private players: Player[];

	constructor(players: Game['players']) {
		this.players = players;

		const empty = () => ({
			type: 'empty' as const
		});
	
		this.field = [
			[empty(), empty(), empty()],
			[empty(), empty(), empty()],
			[empty(), empty(), empty()],
			[empty(), empty(), empty()],
		];
	}

	private draw(player: number): Card | null {
		const card = this.players[player].deck.pop() || null;
		if (card === null) {
			this.commits.push({
				player: player,
				type: 'lose',
				reason: 'noDeck'
			});
		}
		return card;
	}

	public start() {
		const drew = this.draw(this.turn)!;
		this.commits.push({
			player: 0,
			type: 'beginTurn',
			drew: drew.id
		});
	}

	public commit() {

	}
}
