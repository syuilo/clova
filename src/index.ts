import { Repository } from './repository';

type Cell = {
	type: 'empty';
} | {
	type: 'unit';
	card: Card;
};

type Field = Cell[];

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

export abstract class UI {
	/**
	 * UIに選択肢ダイアログなどを出す
	 */
	public abstract choices(choices: string[]);
}

export class Game {
	private cards: CardDef[];
	private repository: Repository;
	private state: State;

	constructor(cards: Game['cards'], players: Player[]) {
		const empty = () => ({
			type: 'empty' as const
		});

		this.state = {
			players: players,
			field: [
				empty(), empty(), empty(),
				empty(), empty(), empty(),
				empty(), empty(), empty(),
				empty(), empty(), empty(),
			],
			turn: 0,
			winner: null
		};

		this.cards = cards;
		this.repository = new Repository();
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

	/**
	 * コミットを与えてゲームの状態を復元
	 */
	private loadCommits(commits: Repository['commits']): void {
		for (const commit of commits) {
			this.repository.commit(commit);
		}
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

	public getCardPos(card: Card): number | null {
		const index = this.field.findIndex(cell => cell.type === 'unit' && cell.card.id === card.id);
		return index > -1 ? index : null;
	}

	public start(): void {
		this.main();
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

	public cardChoices(target: number, cards: Card[]) {
		return new Promise((res) => {
			// 次のコミットをlisten
			this.repository.next = payload => {
				res(cards.find(c => c.id === payload.cardId));
			};
	
			// TODO
			// const choice = this.ui.cardChoices(...);
			const choice = Math.floor(Math.random() * cards.length);
	
			// TODO: typeは不要
			this.repository.commit({
				cardId: cards[choice].id,
			});
		});
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
	public main() {
		// 次のコミットをlisten
		this.repository.next = action => {
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

			this.main();
		};

		// TODO
		// const action = this.ui.requestAction(...);
		const action = { type: 'summon', cardId: 'foo' };

		// TODO: typeは不要
		this.repository.commit(action);
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
