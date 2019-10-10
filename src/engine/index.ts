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
	public controller: Controller;
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

	private get field() {
		return this.state.field;
	}

	public getState() {
		return this.state;
	}

	public getStateForClient(player: number) {
		return {
			opponentHandCount: this.players[player === 0 ? 1 : 0].hand.length,
			opponentDeckCount: this.players[player === 0 ? 1 : 0].deck.length,
			myHand: this.players[player].hand,
			myDeck: this.players[player].deck,
			field: this.state.field
		};
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

		await Promise.all([
			this.controller.q(0, 'choiceRedrawCards', player1Cards, player1redraw => {
				// TODO: validate param
				for (const id of player1redraw) {
					deck1.push(player1Cards.find(x => x.id === id)!);
					player1Cards = player1Cards.filter(x => x.id !== id);
				}
				this.shuffle(deck1);
				for (let i = 0; i < player1redraw.length; i++) {
					player1Cards.push(deck1.shift()!);
				}
				this.players[0].hand = player1Cards;
			}),
			this.controller.q(1, 'choiceRedrawCards', player2Cards, player2redraw => {
				// TODO: validate param
				for (const id of player2redraw) {
					deck2.push(player2Cards.find(x => x.id === id)!);
					player2Cards = player2Cards.filter(x => x.id !== id);
				}
				this.shuffle(deck2);
				for (let i = 0; i < player2redraw.length; i++) {
					player2Cards.push(deck2.shift()!);
				}
				this.players[1].hand = player2Cards;
			})
		]);

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
		const choice = await this.controller.q('cardChoice', cards);
		return cards[choice];
	}

	private async useSpell(card: Card | Card['id']) {
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
		await this.controller.q(this.turn, 'mainPhase', null, action => {
			switch (action.type) {
				case 'play':
					const cardId = action.payload.card;
					const card = this.currentPlayer.hand.find(c => c.id === cardId);
					if (card == null) throw new Error('no such card');
					const cardDef = this.lookupCard(card);
					if (cardDef.type === 'unit') {
						this.summon(card, action.payload.index);
					} else if (cardDef.type === 'spell') {
						this.useSpell(cardId);
					}
					break;
	
				case 'turnEnd':
					// TODO
					break;
			
				default: throw new Error('Unknown main phase action: ' + action.type);
			}
	
			this.mainPhase();
		});
	}

	public summon(card: Card, index: number): void {
		const def = this.lookupCard(card);
/*
		if (this.players[card.owner].energy < def.cost) {
			throw new Error('no energy');
		}

		this.players[card.owner].energy -= def.cost;
*/
		this.setUnit(card, this.turn === 0 ? 'back1' : 'back2', index);
	}

	public setUnit(card: Card, section: keyof Game['state']['field'], index: number): void {
		const def = this.lookupCard(card);

		if (this.field[section][index].type === 'empty') {
			this.field[section][index] = {
				type: 'unit',
				card: card
			};
			console.log(this.field);
			//def.setup({ game: this, thisCard: card });
		}
	}
}
