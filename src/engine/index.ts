import { Controller } from './controller';
import * as seedrandom from 'seedrandom';

type Cell = {
	type: 'empty';
} | {
	type: 'unit';
	card: Card;
};

type Field = {
	back1: [Cell, Cell, Cell];
	front: [Cell, Cell, Cell, Cell];
	back2: [Cell, Cell, Cell];
};

type CardDef = {
	id: string;
	type: string;
	cost: number;
} & ({
	type: 'unit';
	setup: (game: Game, thisCard: Card) => void;
} | {
	type: 'spell';
	action: (game: Game, thisCard: Card) => void;
});

export type Card = {
	def: CardDef['id'];
	id: string;
	owner: number;
	onBeforeDestroy?: (() => void) | null | undefined;
	onDestroyed?: (() => void) | null | undefined;
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

export class Game {
	private cards: CardDef[];
	private controller: Controller;
	private state: State;
	private rng: seedrandom.prng;

	constructor(cards: Game['cards'], players: Player[], controller: Controller, seed: any) {
		const empty = () => ({
			type: 'empty' as const
		});

		this.state = {
			players: players,
			field: {
				back1: [empty(), empty(), empty()],
				front: [empty(), empty(), empty(), empty()],
				back2: [empty(), empty(), empty()],
			},
			turn: 0,
			winner: null
		};

		this.cards = cards;
		this.controller = controller;
		this.rng = seedrandom(seed);
	}

	private get turn() {
		return this.state.turn;
	}

	private get players(): Player[] {
		return this.state.players;
	}

	private get currentPlayer(): Player {
		return this.players[this.turn];
	}

	public getState() {
		return this.state;
	}

	// TODO: 必要？
	private xyToIndex(x: number, y: number): number {
		return x + (y * FIELD_WIDTH);
	}

	// TODO: 必要？
	private indexToXy(index: number): [number, number] {
		return [index % FIELD_WIDTH, Math.floor(index / FIELD_WIDTH)];
	}

	public lookupCard(card: Card | Card['id']): CardDef {
		if (typeof card === 'string') {
			return this.cards.find(def => def.id === card)!;
		} else {
			return this.cards.find(def => def.id === card.def)!;
		}
	}

	public getCardPos(card: Card): number | null {
		const index = this.field.findIndex(cell => cell.type === 'unit' && cell.card.id === card.id);
		return index > -1 ? index : null;
	}

	private random() {
		return this.rng();
	}

	private shuffle(cards: Card[]): Card[] {
		let m = cards.length;
		while (m) {
			const i = Math.floor(this.random() * m--);
			[cards[m], cards[i]] = [cards[i], cards[m]];
		}
		return cards;
	}

	private randomPick(cards: Card[]): Card {
		return cards; // TODO
	}

	public async start() {
		const deck1 = this.shuffle(this.players[0].deck);
		const deck2 = this.shuffle(this.players[1].deck);

		let player1Cards = [deck1.shift()!, deck1.shift()!, deck1.shift()!, deck1.shift()!, deck1.shift()!];
		let player2Cards = [deck2.shift()!, deck2.shift()!, deck2.shift()!, deck2.shift()!, deck2.shift()!];

		const [player1redraw, player2redraw] = await Promise.all([
			this.controller.output(0, 'choiceRedrawCards', player1Cards),
			this.controller.output(1, 'choiceRedrawCards', player2Cards)
		]);

		for (const id of player1redraw) {
			deck1.push(player1Cards.find(x => x.id === id)!);
			player1Cards = player1Cards.filter(x => x.id !== id);
		}
		this.shuffle(deck1);
		for (let i = 0; i < player1redraw.length; i++) {
			player1Cards.push(deck1.shift()!);
		}

		for (const id of player2redraw) {
			deck2.push(player2Cards.find(x => x.id === id)!);
			player2Cards = player2Cards.filter(x => x.id !== id);
		}
		this.shuffle(deck2);
		for (let i = 0; i < player2redraw.length; i++) {
			player2Cards.push(deck2.shift()!);
		}

		this.players[0].hand = player1Cards;
		this.players[1].hand = player2Cards;

		this.mainPhase();
	}

	public draw(player: number): Card | null {
		const deck = this.players[player].deck;
	
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

	public async cardChoice(target: number, cards: Card[]) {
		const choice = await this.controller.output('cardChoice', cards);
		return cards[choice];
	}

	private useSpell(card: Card | Card['id']) {
		const def = this.lookupCard(card);

		// TODO: 対象カードがspellか判定必要?
		// 仕組み的にspell以外のカードが来ることはないけど、型ガードのために必要かも
		// (def as 〜).action で実行時のコストなしで型システムをすり抜けることはできそう
		if (def.type !== 'spell') {
			throw 'something happened';
		}

		def.action(this, card);
	}

	/**
	 * Main phase
	 */
	private async mainPhase() {
		const action = await this.controller.output(this.turn, 'mainPhase');

		switch (action.type) {
			case 'summon':
				// TODO
				break;

			case 'useSpell':
				this.useSpell(action.cardId);
				break;

			case 'turnEnd':
				// TODO
				break;
		
			default:
				break;
		}

		this.mainPhase();
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
}
