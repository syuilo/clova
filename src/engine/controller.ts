import { Card } from '.';
import { Repository } from './repository';
import seedrandom = require('seedrandom');

export type ActionSupplier = {
	choiceRedrawCards: (cards: Card[]) => Card['id'][];
	mainPhase: () => { type: string; };
	cardChoice: (payload: any) => Card['id'];
};

type Log = {
	date?: Date;
	player: number;
	payload: any;
};

export class Controller {
	private logs: Log[] = [];
	private queue: Log[] = [];
	private onInput: (((log: Log) => Promise<boolean>) | null)[] = [];
	private inputRequest: (player: number, type: string, payload: any) => void;

	constructor(inputRequest: Controller['inputRequest'], queue?: Log[]) {
		this.inputRequest = inputRequest;
		if (queue) this.queue = queue;
	}

	public input(action: Log): Promise<boolean> {
		console.log('<- INPUT', action.player, action.payload);
		return this.onInput[action.player]!(action);
	}

	public q<S, T extends Repository<S>>(repo: T, seed: string, player: number, type: string, payload: any, callback: (v: Log['payload'], s: S, rng: seedrandom.prng) => S): Promise<void> {
		const rng = seedrandom(seed + player.toString() + this.logs.filter(l => l.player === player).length.toString());
		return new Promise(res => {
			if (this.queue.filter(log => log.player === player).length === 0) {
				this.onInput[player] = log => new Promise(ok => {
					console.log('<- OUTPUT', player, type, log.payload);
					try {
						repo.setState(callback(log.payload, JSON.parse(JSON.stringify(repo.getState())), rng));
						this.onInput[player] = null;
						this.logs.push(log);
						res();
						ok(true);
					} catch (e) {
						console.error(e);
						ok(false);
					}
				});
				console.log('-> WAITING INPUT...', player, type, payload);
				this.inputRequest(player, type, payload);
			} else {
				/* TODO
				const log = this.queue.find(log => log.player === player);
				this.queue = this.queue.filter(_log => _log !== log);
				this.logs.push(log!);
				console.log('<- OUTPUT', player, type, log!.payload);
				callback(log!.payload);
				res();
				*/
			}
		});
	} 

	public getLogs(): Log[] {
		return this.logs;
	}
}
