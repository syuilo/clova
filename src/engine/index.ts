import { Controller } from './controller';
import * as seedrandom from 'seedrandom';

type Cell = EmptyCell | UnitCell;

type EmptyCell = {
	type: 'empty';
};

type UnitCell = {
	type: 'unit';
	card: Card;
};

type Field = {
	back1: [Cell, Cell, Cell];
	front: [Cell, Cell, Cell, Cell];
	back2: [Cell, Cell, Cell];
};

type API = {
	cardChoice: (player: number, cards: Card[]) => Promise<Card>;
};

export type CardDef = {
	id: string;
	type: string;
	cost: number;
} & ({
	type: 'unit';
	setup: (game: Game, thisCard: Card, api: API) => Promise<void>;
} | {
	type: 'spell';
	action: (game: Game, thisCard: Card, api: API) => Promise<void>;
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

type State = {
	field: Field;
	player1: Player;
	player2: Player;
	turn: number;
	winner: number | null;
};

export type ClientState = {
	opponentHandCount: number;
	opponentDeckCount: number;
	myHand: Card[];
	myDeck: Card[];
	field: Field;
	turn: number;
};

export class Game {
	private cards: CardDef[];
	public io: Controller;
	public state: State;
	private rng: seedrandom.prng;

	constructor(cards: Game['cards'], player1: Player, player2: Player, controller: Controller, seed: any) {
		const empty = () => ({
			type: 'empty' as const
		});

		this.state = {
			player1: player1,
			player2: player2,
			field: {
				back1: [empty(), empty(), empty()],
				front: [empty(), empty(), empty(), empty()],
				back2: [empty(), empty(), empty()],
			},
			turn: 0,
			winner: null
		};

		this.cards = cards;
		this.io = controller;
		this.rng = seedrandom(seed);
	}

	public get turn() {
		return this.state.turn;
	}

	public get player() {
		return this.turn === 0 ? this.state.player1 : this.state.player2;
	}

	public getStateForClient(player: number): ClientState {
		return {
			opponentHandCount: player === 0 ? this.state.player2.hand.length : this.state.player1.hand.length,
			opponentDeckCount: player === 0 ? this.state.player2.deck.length : this.state.player1.deck.length,
			myHand: player === 0 ? this.state.player1.hand : this.state.player2.hand,
			myDeck: player === 0 ? this.state.player1.deck : this.state.player2.deck,
			field: this.state.field,
			turn: this.turn,
		};
	}

	public lookupCard(card: Card | Card['id']): CardDef {
		if (typeof card === 'string') {
			return this.cards.find(def => def.id === card)!;
		} else {
			return this.cards.find(def => def.id === card.def)!;
		}
	}

	private shuffle(cards: Card[]): Card[] {
		let m = cards.length;
		while (m) {
			const i = Math.floor(this.rng() * m--);
			[cards[m], cards[i]] = [cards[i], cards[m]];
		}
		return cards;
	}

	private randomPick(cards: Card[]): Card {
		return cards; // TODO
	}

	public async start() {
		const deck1 = this.shuffle(this.state.player1.deck);
		const deck2 = this.shuffle(this.state.player2.deck);

		let player1Cards = [deck1.shift()!, deck1.shift()!, deck1.shift()!, deck1.shift()!, deck1.shift()!];
		let player2Cards = [deck2.shift()!, deck2.shift()!, deck2.shift()!, deck2.shift()!, deck2.shift()!];

		const [player1redraw, player2redraw] = await Promise.all([
			this.io.q(0, 'choiceRedrawCards', player1Cards),
			this.io.q(1, 'choiceRedrawCards', player2Cards),
		]);

		// TODO: validate param
		for (const id of player1redraw) {
			deck1.push(player1Cards.find(x => x.id === id)!);
			player1Cards = player1Cards.filter(x => x.id !== id);
		}
		this.shuffle(deck1);
		for (let i = 0; i < player1redraw.length; i++) {
			player1Cards.push(deck1.shift()!);
		}
		this.state.player1.hand = player1Cards;

		// TODO: validate param
		for (const id of player2redraw) {
			deck2.push(player2Cards.find(x => x.id === id)!);
			player2Cards = player2Cards.filter(x => x.id !== id);
		}
		this.shuffle(deck2);
		for (let i = 0; i < player2redraw.length; i++) {
			player2Cards.push(deck2.shift()!);
		}
		this.state.player2.hand = player2Cards;

		this.mainPhase();
	}

	private async useSpell(card: Card) {
		const def = this.lookupCard(card);

		if (def.type !== 'spell') {
			throw new Error('spell card required');
		}

		const api: API = {
			cardChoice: async (player, cards) => {
				const chosen = await this.io.q(player, 'cardChoice', cards);
				const card = cards.find(c => c.id === chosen);
				if (card == null) throw new Error('no such card');
				return card;
			}
		};

		await def.action(this, card, api);
	}

	/**
	 * Main phase
	 */
	private async mainPhase() {
		let ended = false;
		while (!ended) {
			const movedCards: Card['id'][] = [];
			const action = await this.io.q(this.turn, 'mainPhase');

			switch (action.type) {
				// カード使用
				case 'play': {
					const cardId = action.payload.card;
					const card = this.player.hand.find(c => c.id === cardId);
					if (card == null) throw new Error('no such card');
	
					// 手札から抜く
					this.player.hand = this.player.hand.filter(c => c.id !== cardId);
	
					const cardDef = this.lookupCard(card);
					if (cardDef.type === 'unit') {
						this.summon(card, action.payload.index);
					} else if (cardDef.type === 'spell') {
						await this.useSpell(card);
					}
	
					break;
				}
	
				// ユニット移動
				case 'move': {
					const cardId = action.payload.card;
					const index = action.payload.index;
	
					let card: Card | null = null;
					const posBack1 = this.state.field.back1.findIndex(c => c.type === 'unit' && c.card.id === cardId);
					const posBack2 = this.state.field.back2.findIndex(c => c.type === 'unit' && c.card.id === cardId);
					const posFront = this.state.field.front.findIndex(c => c.type === 'unit' && c.card.id === cardId);
					if (posBack1 > -1) card = (this.state.field.back1[posBack1] as UnitCell).card;
					if (posBack2 > -1) card = (this.state.field.back1[posBack2] as UnitCell).card;
					if (posFront > -1) card = (this.state.field.back1[posFront] as UnitCell).card;
					if (card === null) throw new Error('no such card');
					if (card.owner !== this.turn) throw new Error('the card is not yours');
					if (movedCards.includes(card.id)) throw new Error('the card is already moved in this turn');

					this.state.field.front[index] = { type: 'unit', card: card };
					if (posBack1 > -1) this.state.field.back1[posBack1] = { type: 'empty' };
					if (posBack2 > -1) this.state.field.back1[posBack2] = { type: 'empty' };
					if (posFront > -1) this.state.field.back1[posFront] = { type: 'empty' };
					movedCards.push(card.id);
					break;
				}
	
				// ターンエンド
				case 'end': {
					this.state.turn = this.turn === 0 ? 1 : 0;
					ended = true;
					break;
				}
			
				default: throw new Error('Unknown main phase action: ' + action.type);
			}
		}
	
		this.mainPhase();
	}

	public draw(player: number): Card | null {
		const deck = player === 0 ? this.state.player1.deck : this.state.player2.deck;
		const hand = player === 0 ? this.state.player1.hand : this.state.player2.hand;

		// デッキの一番上にあるカードを取得
		const card = deck[0];

		if (card === undefined) {
			// デッキがなくなったら負け
			this.state.winner = player === 0 ? 1 : 0;
			return null;
		} else {
			deck.shift();
			hand.push(card);
			return card;
		}
	}

	public summon(card: Card, index: number) {
		const def = this.lookupCard(card);
/*
		if (this.players[card.owner].energy < def.cost) {
			throw new Error('no energy');
		}

		this.players[card.owner].energy -= def.cost;
*/
		this.setUnit(card, this.state.turn === 0 ? 'back1' : 'back2', index);
	}

	public setUnit(card: Card, section: keyof State['field'], index: number) {
		const def = this.lookupCard(card);

		if (this.state.field[section][index].type === 'empty') {
			this.state.field[section][index] = {
				type: 'unit',
				card: card
			};
			//def.setup({ game: this, thisCard: card });
		}
	}

	public dropHandCard(player: Player, card: Card) {
		player.hand = player.hand.filter(c => c.id !== card.id);
	}
}
