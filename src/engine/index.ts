import { Controller } from './controller';
import * as seedrandom from 'seedrandom';
import { Repository } from './repository';

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

type API = {
	cardChoice: (player: number, cards: Card[], callback: (chosen: Card) => void) => void;
};

export type CardDef = {
	id: string;
	type: string;
	cost: number;
} & ({
	type: 'unit';
	setup: (state: GameState, thisCard: Card, api: API, callback: Function) => GameState;
} | {
	type: 'spell';
	action: (state: GameState, thisCard: Card, api: API, callback: Function) => GameState;
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

export class GameState {
	public state: State;
	private cardDefs: CardDef[];

	constructor(state: State, cardDefs: CardDef[]) {
		this.state = state;
		this.cardDefs = cardDefs;
	}

	private lookupCard(card: Card | Card['id']): CardDef {
		if (typeof card === 'string') {
			return this.cardDefs.find(def => def.id === card)!;
		} else {
			return this.cardDefs.find(def => def.id === card.def)!;
		}
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
}

export class Game {
	private cards: CardDef[];
	public controller: Controller;
	private repository: Repository<State>;
	private seed: string;
	private rng: seedrandom.prng;

	constructor(cards: Game['cards'], player1: Player, player2: Player, controller: Controller, seed: any) {
		const empty = () => ({
			type: 'empty' as const
		});

		this.repository = new Repository({
			player1: player1,
			player2: player2,
			field: {
				back1: [empty(), empty(), empty()],
				front: [empty(), empty(), empty(), empty()],
				back2: [empty(), empty(), empty()],
			},
			turn: 0,
			winner: null
		});

		this.cards = cards;
		this.controller = controller;
		this.rng = seedrandom(seed);
		this.seed = seed;
	}

	private q(player: number, type: string, payload: any, callback: (v: any, state: State, rng: seedrandom.prng) => Partial<State>) {
		return this.controller.q(this.repository, this.seed, player, type, payload, callback);
	}

	public getStateForClient(player: number) {
		const state = this.repository.getState();
		return {
			opponentHandCount: player === 0 ? state.player2.hand.length : state.player1.hand.length,
			opponentDeckCount: player === 0 ? state.player2.deck.length : state.player1.deck.length,
			myHand: player === 0 ? state.player1.hand : state.player2.hand,
			myDeck: player === 0 ? state.player1.deck : state.player2.deck,
			field: state.field
		};
	}

	public lookupCard(card: Card | Card['id']): CardDef {
		if (typeof card === 'string') {
			return this.cards.find(def => def.id === card)!;
		} else {
			return this.cards.find(def => def.id === card.def)!;
		}
	}

	private shuffle(cards: Card[], rng: seedrandom.prng): Card[] {
		let m = cards.length;
		while (m) {
			const i = Math.floor(rng() * m--);
			[cards[m], cards[i]] = [cards[i], cards[m]];
		}
		return cards;
	}

	private randomPick(cards: Card[]): Card {
		return cards; // TODO
	}

	public async start() {
		const state = this.repository.getState();

		const deck1 = this.shuffle(state.player1.deck, this.rng);
		const deck2 = this.shuffle(state.player2.deck, this.rng);

		let player1Cards = [deck1.shift()!, deck1.shift()!, deck1.shift()!, deck1.shift()!, deck1.shift()!];
		let player2Cards = [deck2.shift()!, deck2.shift()!, deck2.shift()!, deck2.shift()!, deck2.shift()!];

		await Promise.all([
			this.q(0, 'choiceRedrawCards', player1Cards, (player1redraw, state, rng) => {
				// TODO: validate param
				for (const id of player1redraw) {
					deck1.push(player1Cards.find(x => x.id === id)!);
					player1Cards = player1Cards.filter(x => x.id !== id);
				}
				this.shuffle(deck1, rng);
				for (let i = 0; i < player1redraw.length; i++) {
					player1Cards.push(deck1.shift()!);
				}
				state.player1.hand = player1Cards;
				return {
					player1: state.player1
				};
			}),
			this.q(1, 'choiceRedrawCards', player2Cards, (player2redraw, state, rng) => {
				// TODO: validate param
				for (const id of player2redraw) {
					deck2.push(player2Cards.find(x => x.id === id)!);
					player2Cards = player2Cards.filter(x => x.id !== id);
				}
				this.shuffle(deck2, rng);
				for (let i = 0; i < player2redraw.length; i++) {
					player2Cards.push(deck2.shift()!);
				}
				state.player2.hand = player2Cards;
				return {
					player2: state.player2
				};
			})
		]);

		this.mainPhase();
	}

	private useSpell(gs: GameState, card: Card, callback: Function): State {
		const def = this.lookupCard(card);

		// TODO: 対象カードがspellか判定必要?
		// 仕組み的にspell以外のカードが来ることはないけど、型ガードのために必要かも
		// (def as 〜).action で実行時のコストなしで型システムをすり抜けることはできそう
		if (def.type !== 'spell') {
			throw 'something happened';
		}

		const api: API = {
			cardChoice: (player, cards, callback) => {
				this.q(player, 'cardChoice', cards, (chosen, state) => {
					const cardId = chosen;
					const card = cards.find(c => c.id === cardId);
					if (card == null) throw new Error('no such card');
					callback(card);
					return gs.state;
				})
			}
		};

		return def.action(gs, card, api, callback);
	}

	private get turn() {
		const state = this.repository.getState();
		return state.turn;
	}

	/**
	 * Main phase
	 */
	private async mainPhase() {
		await this.q(this.turn, 'mainPhase', null, (action, state) => {
			const gs = new GameState(state, this.cards);
			const player = state.turn === 0 ? state.player1 : state.player2;
			switch (action.type) {
				case 'play':
					const cardId = action.payload.card as string;
					const card = player.hand.find(c => c.id === cardId);
					if (card == null) throw new Error('no such card');
					const cardDef = this.lookupCard(card);
					if (cardDef.type === 'unit') {
						gs.summon(card, action.payload.index);
						this.mainPhase();
					} else if (cardDef.type === 'spell') {
						this.useSpell(gs, card, () => {
							this.mainPhase();
						});
					}
					return state;
	
				case 'turnEnd': return {
					...state,
					turn: state.turn === 0 ? 1 : 0
				};
			
				default: throw new Error('Unknown main phase action: ' + action.type);
			}
		});
	}
}
