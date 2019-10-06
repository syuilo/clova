import { Store } from './store';

type Action = {
	type: string;
	payload: Record<string, any>;
};

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
	drawed: Card['id'];
} | {
	type: 'lose';
	reason: 'noDeck';
} | {
	type: 'summon';
	card: Card['id'];
});

type CardDef = {
	id: string;
	type: string;
	cost: number;
} & ({
	type: 'unit';
	setup: (ctx: Context) => void;
} | {
	type: 'spell';
	action: (ctx: Context) => void;
});

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

type State = {
	field: Field;
	players: Player[];
	turn: number;
	winner: number | null;
};

export class Context {
	public game: Game;
	public thisCard: Card;
	private state: State;

	constructor(game: Context['game'], thisCard: Context['thisCard'], state: Context['state']) {
		this.game = game;
		this.thisCard = thisCard;
		this.state = state;
	}

	public draw(player: number): Card | null {
		const deck = this.game.players[player].deck;
	
		// デッキの一番上にあるカードを取得
		const card = deck[0];

		if (card === undefined) {
			// デッキがなくなったら負け
			this.state.winner = player === 0 ? 1 : 0;
			return null;
		} else {
			deck.shift();
			this.state.players[player].hand.push(card);
			return card;
		}
	}

	public async showCardChoices(target: number, cards: Card[]) {
		// TODO
		const choice = Math.floor(Math.random() * cards.length);
		return cards[choice];
	}
}

export class Game {
	private cards: CardDef[];
	private store: Store<State, Action>;

	constructor(cards: Game['cards'], players: Game['players']) {
		const empty = () => ({
			type: 'empty' as const
		});

		this.store = new Store<State, Action>({
			players: players,
			field: [
				empty(), empty(), empty(),
				empty(), empty(), empty(),
				empty(), empty(), empty(),
				empty(), empty(), empty(),
			],
			turn: 0,
			winner: null
		}, this.applyAction);

		this.cards = cards;
	}

	public get players() {
		return this.store.state.players;
	}

	private get turn() {
		return this.store.state.turn;
	}

	private get field() {
		return this.store.state.field;
	}

	private get currentPlayer(): Player {
		return this.players[this.turn];
	}

	private applyAction(state: State, action: Action): State {
		state = JSON.parse(JSON.stringify(state)); // copy
		switch (action.type) {
			case 'useSpell': return this.applyUseSpell(state, action.payload);
			default: throw new Error('Unknown action: ' + action.type);
		}
	}

	private setCommits(): void {

	}

	// TODO: 必要？
	private xyToIndex(x: number, y: number): number {
		return x + (y * FIELD_WIDTH);
	}

	// TODO: 必要？
	private indexToXy(index: number): [number, number] {
		return [index % FIELD_WIDTH, Math.floor(index / FIELD_WIDTH)];
	}

	private lookupCard(card: Card | Card['id']): CardDef {
		if (typeof card === 'string') {
			return this.cards.find(def => def.id === card)!;
		} else {
			return this.cards.find(def => def.id === card.def)!;
		}
	}

	private commit(state: Partial<Store['_state']>) {
		this.store.commit(state);
	}

	public getCardPos(card: Card): number | null {
		const index = this.field.findIndex(cell => cell.type === 'unit' && cell.card.id === card.id);
		return index > -1 ? index : null;
	}

	public useSpell(card: Card) {
		this.store.commit({ type: 'useSpell', payload: {
			player: this.currentPlayer,
			cardId: card.id,
		}});
	}

	public applyUseSpell(state: State, action: Action): State {
		const { player, cardId } = action.payload;
		const card = state.players[player].hand.find(c => c.id === cardId)!;
		const def = this.lookupCard(card);

		// TODO: 対象カードがspellか判定必要?
		// 仕組み的にspell以外のカードが来ることはないけど、型ガードのために必要かも
		// (def as 〜).action で実行時のコストなしで型システムをすり抜けることはできそう
		if (def.type !== 'spell') {
			throw 'something happened';
		}

		def.action(new Context(this, card, state));
	}

	// TODO: currentStateを外部から参照できるように(?)

	public start(): void {
		const drawed = this.draw(this.turn)!;
		this.commit({
			player: 0,
			type: 'beginTurn',
			drawed: drawed.id
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
