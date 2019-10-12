import { Controller } from './controller';
import * as seedrandom from 'seedrandom';

type Cell = EmptyCell | UnitCell;

type EmptyCell = {
	type: 'empty';
};

type UnitCell = {
	type: 'unit';
	card: UnitCard;
};

type Field = {
	back1: [Cell, Cell, Cell];
	front: [Cell, Cell, Cell, Cell];
	back2: [Cell, Cell, Cell];
};

type API = {
	cardChoice: (player: number, cards: Card[]) => Promise<Card>;
	unitChoice: (player: number, owner: number | null) => Promise<UnitCard>;
	cardChoiceFromDeck: (player: number, type: 'unit' | 'spell' | null, costMax: number) => Promise<Card>;
	cardChoiceFromTrash: (player: number, type: 'unit' | 'spell' | null, costMax: number) => Promise<Card>;
	choiceFieldIndex: (player: number) => Promise<number>;
};

type UnitCardDef = {
	id: string;
	cost: number;
	type: 'unit';
	power: number;
	skills: ('quick' | 'defender')[];
	setup?: (game: Game, thisCard: Card, api: API) => Promise<void>;
	onPlay?: (game: Game, thisCard: Card, api: API) => Promise<void>;
	onDestroy?: (game: Game, thisCard: Card, api: API) => Promise<void>;
};

type SpellCardDef = {
	id: string;
	cost: number;
	type: 'spell';
	action: (game: Game, thisCard: Card, api: API) => Promise<void>;
};

export type CardDef = UnitCardDef | SpellCardDef;

export type SpellCard = {
	def: CardDef['id'];
	id: string;
	owner: number;
	cost: number;
};

export type UnitCard = {
	def: CardDef['id'];
	id: string;
	owner: number;
	cost: number;
	power: number;
	skills: ('quick' | 'defender')[];
};

export type Card = UnitCard | SpellCard;

type Player = {
	deck: Card[];
	hand: Card[];
	trash: Card[];
	energy: number;
	life: number;
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
	opponentTrashCount: number;
	myHand: Card[];
	myDeck: Card[];
	myTrash: Card[];
	myLife: number;
	opponentLife: number;
	myEnergy: number;
	opponentEnergy: number;
	field: Field;
	turn: number;
};

const ENERGY_MAX = 10;

export class Game {
	private cards: CardDef[];
	public controller: Controller;
	public state: State;
	private rng: seedrandom.prng;
	private energyCharge = 3;
	private logs: { type: string; payload: any; }[] = [];

	constructor(cards: Game['cards'], player1Deck: string[], player2Deck: string[], controller: Controller, seed: any) {
		const empty = () => ({
			type: 'empty' as const
		});

		let cardId = 0;

		const player1 = {
			deck: player1Deck.map(id => {
				const def = cards.find(x => x.id === id)!;
				cardId++;
				return {
					def: id,
					id: cardId.toString(),
					owner: 0,
					cost: def.cost,
					...(def.type === 'unit' ? {
						power: def.power,
						skills: JSON.parse(JSON.stringify(def.skills)),
					} : {})
				};
			}),
			hand: [],
			trash: [],
			energy: 3,
			life: 20
		};

		const player2 = {
			deck: player2Deck.map(id => {
				const def = cards.find(x => x.id === id)!;
				cardId++;
				return {
					def: id,
					id: cardId.toString(),
					owner: 1,
					cost: def.cost,
					...(def.type === 'unit' ? {
						power: def.power,
						skills: JSON.parse(JSON.stringify(def.skills)),
					} : {})
				};
			}),
			hand: [],
			trash: [],
			energy: 3,
			life: 20
		};

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
		this.controller = controller;
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
			opponentTrashCount: player === 0 ? this.state.player2.trash.length : this.state.player1.trash.length,
			myHand: player === 0 ? this.state.player1.hand : this.state.player2.hand,
			myDeck: player === 0 ? this.state.player1.deck : this.state.player2.deck,
			myTrash: player === 0 ? this.state.player1.trash : this.state.player2.trash,
			myLife: player === 0 ? this.state.player1.life : this.state.player2.life,
			opponentLife: player === 0 ? this.state.player2.life : this.state.player1.life,
			myEnergy: player === 0 ? this.state.player1.energy : this.state.player2.energy,
			opponentEnergy: player === 0 ? this.state.player2.energy : this.state.player1.energy,
			field: this.state.field,
			turn: this.turn,
		};
	}

	public lookup(card: Card | Card['id']): CardDef {
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

	private q(player: number, type: string, payload: any) {
		const logs = this.logs;
		this.logs = [];
		return this.controller.q(player, type, payload, logs);
	}

	private pushLog(type: string, payload: any) {
		this.logs.push({ type, payload });
	}

	private randomPick(cards: Card[]): Card {
		return cards; // TODO
	}

	public findUnitPosition(card: Card): [keyof Field, number] | null {
		const posBack1 = this.state.field.back1.findIndex(c => c.type === 'unit' && c.card.id === card.id);
		const posBack2 = this.state.field.back2.findIndex(c => c.type === 'unit' && c.card.id === card.id);
		const posFront = this.state.field.front.findIndex(c => c.type === 'unit' && c.card.id === card.id);
		if (posBack1 > -1) return ['back1', posBack1];
		if (posBack2 > -1) return ['back2', posBack2];
		if (posFront > -1) return ['front', posFront];
		return null;
	}

	public findUnit(cardId: Card['id']): UnitCard | null {
		const posBack1 = this.state.field.back1.findIndex(c => c.type === 'unit' && c.card.id === cardId);
		const posBack2 = this.state.field.back2.findIndex(c => c.type === 'unit' && c.card.id === cardId);
		const posFront = this.state.field.front.findIndex(c => c.type === 'unit' && c.card.id === cardId);
		if (posBack1 > -1) return (this.state.field.back1[posBack1] as UnitCell).card;
		if (posBack2 > -1) return (this.state.field.back2[posBack2] as UnitCell).card;
		if (posFront > -1) return (this.state.field.front[posFront] as UnitCell).card;
		return null;
	}

	public findCardFromDeck(player: number, cardId: Card['id']): Card | null {
		const deck = player === 0 ? this.state.player1.deck : this.state.player2.deck;
		return deck.find(card => card.id === cardId) || null;
	}

	public findCardFromTrash(player: number, cardId: Card['id']): Card | null {
		const trash = player === 0 ? this.state.player1.trash : this.state.player2.trash;
		return trash.find(card => card.id === cardId) || null;
	}

	public async start() {
		const deck1 = this.shuffle(this.state.player1.deck);
		const deck2 = this.shuffle(this.state.player2.deck);

		let player1Cards = [deck1.shift()!, deck1.shift()!, deck1.shift()!, deck1.shift()!, deck1.shift()!];
		let player2Cards = [deck2.shift()!, deck2.shift()!, deck2.shift()!, deck2.shift()!, deck2.shift()!];

		const [player1redraw, player2redraw] = await Promise.all([
			this.q(0, 'choiceRedrawCards', player1Cards),
			this.q(1, 'choiceRedrawCards', player2Cards),
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

	private get api() {
		const api: API = {
			cardChoice: async (player, cards) => {
				const chosen = await this.q(player, 'cardChoice', cards);
				const card = cards.find(c => c.id === chosen);
				if (card == null) throw new Error('no such card');
				return card;
			},
			unitChoice: async (player, owner) => {
				const chosen = await this.q(player, 'unitChoice', owner);
				const card = this.findUnit(chosen);
				if (card == null) throw new Error('no such card');
				if (owner !== null && card.owner !== owner) throw new Error('owner not match');
				return card;
			},
			cardChoiceFromDeck: async (player, type, costMax) => {
				const chosen = await this.q(player, 'cardChoiceFromDeck', { type, costMax });
				const card = this.findCardFromDeck(player, chosen);
				if (card == null) throw new Error('no such card');
				if (this.lookup(card).type !== type) throw new Error('not match type');
				if (card.cost > costMax) throw new Error('cost over');
				return card;
			},
			cardChoiceFromTrash: async (player, type, costMax) => {
				const chosen = await this.q(player, 'cardChoiceFromTrash', { type, costMax });
				const card = this.findCardFromTrash(player, chosen);
				if (card == null) throw new Error('no such card');
				if (this.lookup(card).type !== type) throw new Error('not match type');
				if (card.cost > costMax) throw new Error('cost over');
				return card;
			},
			choiceFieldIndex: async (player) => {
				const index = await this.q(player, 'choiceFieldIndex', null);
				return index;
			},
		};

		return api;
	}

	private async useSpell(card: Card) {
		const def = this.lookup(card);

		if (def.type !== 'spell') {
			throw new Error('spell card required');
		}

		(card.owner === 0 ? this.state.player1 : this.state.player2).trash.push(card);

		await def.action(this, card, this.api);
	}

	/**
	 * Main phase
	 */
	private async mainPhase() {
		this.player.energy = Math.max(this.player.energy, this.energyCharge);
		const drawed = this.draw(this.turn);
		if (drawed == null) return;

		const movedUnits: Card['id'][] = [];
		const attackedUnits: Card['id'][] = [];
		const playedUnits: Card['id'][] = [];

		let ended = false;
		while (!ended) {
			const action = await this.q(this.turn, 'mainPhase', null);
			switch (action.type) {
				// カード使用
				case 'play': {
					const cardId = action.payload.card;
					const card = this.player.hand.find(c => c.id === cardId);
					if (card == null) throw new Error('no such card');
					const cardDef = this.lookup(card);
					if (this.player.energy < cardDef.cost) throw new Error('no enough energy');

					// エネルギー消費
					this.player.energy -= cardDef.cost;

					// 手札から抜く
					this.player.hand = this.player.hand.filter(c => c.id !== cardId);
	
					if (cardDef.type === 'unit') {
						playedUnits.push(card.id);
						await this.playUnit(card as UnitCard, action.payload.index);
					} else if (cardDef.type === 'spell') {
						await this.useSpell(card);
					}
	
					break;
				}
	
				// ユニット移動
				case 'move': {
					const cardId = action.payload.card;
					const index = action.payload.index;
	
					const card = this.findUnit(cardId);
					if (card === null) throw new Error('no such card');
					if (card.owner !== this.turn) throw new Error('the card is not yours');
					if (movedUnits.includes(card.id)) throw new Error('the card is already moved in this turn');
					if (playedUnits.includes(card.id) && !card.skills.includes('quick')) throw new Error('you can not move unit that played in this turn');
					if (this.state.field.front[index].type !== 'empty') throw new Error('there is a unit');
					const pos = this.findUnitPosition(card)!;
					this.state.field.front[index] = { type: 'unit', card: card };
					this.state.field[pos[0]][pos[1]] = { type: 'empty' };
					movedUnits.push(card.id);
					break;
				}

				// ユニットへ攻撃
				case 'attack': {
					const cardId = action.payload.card;
					const targetId = action.payload.target;
	
					const attacker = this.findUnit(cardId);
					if (attacker === null) throw new Error('no such attacker');
					if (attacker.owner !== this.turn) throw new Error('the attacker is not yours');
					if (attackedUnits.includes(attacker.id)) throw new Error('the attacker is already attacked in this turn');
					if (playedUnits.includes(attacker.id) && !attacker.skills.includes('quick')) throw new Error('you can not do attack unit that played in this turn');
					const attackee = this.findUnit(targetId);
					if (attackee === null) throw new Error('no such attackee');
					if (attackee.owner === this.turn) throw new Error('the attackee is yours');
					const attackerPos = this.findUnitPosition(attacker)!;
					const attackeePos = this.findUnitPosition(attackee)!;
					// TODO: validate position

					// Check defender
					if (!attackee.skills.includes('defender')) {
						if (attackeePos[0] === 'back1' && this.state.field.back1.some(x => x.type === 'unit' && x.card.skills.includes('defender'))) throw new Error('there is a defender');
						if (attackeePos[0] === 'back2' && this.state.field.back2.some(x => x.type === 'unit' && x.card.skills.includes('defender'))) throw new Error('there is a defender');
						if (attackeePos[0] === 'front' && this.state.field.front.some(x => x.type === 'unit' && x.card.skills.includes('defender') && x.card.owner !== this.turn)) throw new Error('there is a defender');
					}

					attackedUnits.push(attacker.id);

					// Battle
					const attackerPower = attacker!.power;
					const attackeePower = attackee!.power;
					attackee!.power -= attackerPower;
					attacker!.power -= attackeePower;
					if (attacker!.power <= 0) await this.destroy(attacker!);
					if (attackee!.power <= 0) await this.destroy(attackee!);

					break;
				}

				// プレイヤーへ攻撃
				case 'directAttack': {
					const cardId = action.payload.card;
	
					const attacker = this.findUnit(cardId);
					if (attacker === null) throw new Error('no such attacker');
					if (attacker.owner !== this.turn) throw new Error('the attacker is not yours');
					if (attackedUnits.includes(attacker.id)) throw new Error('the attacker is already attacked in this turn');
					const attackerPos = this.findUnitPosition(attacker)!;
					// TODO: validate position

					// Check defender
					if (this.state.field[this.turn === 0 ? 'back2' : 'back1'].some(x => x.type === 'unit' && x.card.skills.includes('defender'))) throw new Error('there is a defender');

					attackedUnits.push(attacker.id);

					const target = this.turn === 0 ? this.state.player2 : this.state.player1;
					this.damage(target, attacker!.power);
					break;
				}
	
				// ターンエンド
				case 'end': {
					ended = true;
					break;
				}
			
				default: throw new Error('Unknown main phase action: ' + action.type);
			}
		}

		const nextTurn = this.turn === 0 ? 1 : 0;
		this.state.turn = nextTurn;
		if (nextTurn === 0 && this.energyCharge < ENERGY_MAX) this.energyCharge++;
		this.mainPhase();
	}

	public damage(target: Player, amount: number) {
		target.life -= amount;
	}

	/**
	 * Destroy a unit
	 */
	public async destroy(unit: UnitCard) {
		const pos = this.findUnitPosition(unit);
		if (pos === null) throw new Error('no such unit');
		this.state.field[pos[0]][pos[1]] = { type: 'empty' };
		(unit.owner === 0 ? this.state.player1 : this.state.player2).trash.push(unit);

		const def = this.lookup(unit) as UnitCardDef;

		// 状態リセット
		unit.power = def.power;
		unit.skills = JSON.parse(JSON.stringify(def.skills));

		// 破壊時ハンドラを実行
		if (def.onDestroy) await def.onDestroy(this, unit, this.api);
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

	public async playUnit(card: UnitCard, index: number) {
		// プレイ時ハンドラを実行
		const def = this.lookup(card) as UnitCardDef;
		if (def.onPlay) await def.onPlay(this, card, this.api);

		this.setUnit(card, this.state.turn === 0 ? 'back1' : 'back2', index);
	}

	public setUnit(card: UnitCard, section: keyof State['field'], index: number) {
		const def = this.lookup(card);

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
