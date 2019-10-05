type Cell = {
	type: 'empty';
} | {
	type: 'unit';
	card: Card;
};

type Field = Cell[];

type Log = {
	player: number;
} & ({
	type: 'beginTurn';
	drew: Card['id'];
} | {
	type: 'lose';
	reason: 'noDeck';
} | {
	type: 'summon';
	card: Card['id'];
});

type CardDef = {
	type: 'unit' | 'spell';
	id: string;
	cost: number;
	setup: (ctx: Context) => void;
};

type Card = {
	def: CardDef['id'];
	id: string;
	owner: number;
	onBeforeDestroy: (() => void) | null | undefined;
	onDestroyed: (() => void) | null | undefined;
};

export class Player {
	public deck: Card[];
	public hand: Card[] = [];
	public energy: number = 3;

	constructor(deck: Player['deck']) {
		this.deck = deck;
	}
}

const FIELD_WIDTH = 3;
const FIELD_HEIGHT = 4;

class Store {
	private commits: Store['_state'][];

	private _state: {
		field: Field;
		players: Player[];
		turn: number;
		winner: number | null;
	};

	constructor(state: Store['_state']) {
		this._state = state;
	}

	public get state() {
		return this._state;
	}

	public commit(state: Partial<Store['_state']>) {
		const newState = {
			...this._state,
			...state
		};

		this.commits.push(newState);
		this._state = newState;
	}

	public undo() {
		// TODO
	}

	public redo() {
		// TODO
	}
}

export class Game {
	private cards: CardDef[];
	private logs: Log[];
	private store: Store;

	constructor(cards: Game['cards'], players: Game['players']) {
		const empty = () => ({
			type: 'empty' as const
		});

		this.store = new Store({
			players: players,
			field: [
				empty(), empty(), empty(),
				empty(), empty(), empty(),
				empty(), empty(), empty(),
				empty(), empty(), empty(),
			],
			turn: 0,
			winner: null
		});

		this.cards = cards;
	}

	private get players() {
		return this.store.state.players;
	}

	private get turn() {
		return this.store.state.turn;
	}

	private get currentPlayer(): Player {
		return this.players[this.turn];
	}

	private setCommits(): void {

	}

	private xyToIndex(x: number, y: number): number {
		return x + (y * FIELD_WIDTH);
	}

	private indexToXy(index: number): [number, number] {
		return [index % FIELD_WIDTH, Math.floor(index / FIELD_WIDTH)];
	}

	private lookupCard(card: Card): CardDef {
		return this.cards.find(def => def.id === card.def)!;
	}

	private commit(state: Partial<Store['_state']>) {
		this.store.commit(state);
	}

	private pushLog(log: Log) {
		this.lo
	}

	private draw(player: number): Card | null {
		const card = this.players[player].deck.pop() || null;
		if (card === null) {
			this.commit({
				player: player,
				type: 'lose',
				reason: 'noDeck'
			});
		}
		return card;
	}

	public start(): void {
		const drew = this.draw(this.turn)!;
		this.commit({
			player: 0,
			type: 'beginTurn',
			drew: drew.id
		});
	}

	public turnEnd() {

	}

	public summon(card: Card, pos: number): void {
		const def = this.lookupCard(card);

		if (this.players[card.owner].energy < def.cost) {
			throw new Error('no energy');
		}

		this.players[card.owner].energy -= def.cost;

		this.setUnit(card, pos);
	}

	public setUnit(card: Card, pos: number): void {
		const def = this.lookupCard(card);

		let cell = this.field[pos];

		if (cell.type === 'empty') {
			cell = {
				type: 'unit',
				card: card
			};
			this.commit({
				player: this.turn,
				type: 'summon',
				card: card.id
			});
			def.setup({ game: this, thisCard: card });
		}
	}

	public showChoices(target: number, choices: { text: string; callback: () => void; }[]) {
		// TODO
		const choice = Math.floor(Math.random() * choices.length);
		choices[choice].callback();
	}
}

export type Context = {
	game: Game;
	thisCard: Card;
};
