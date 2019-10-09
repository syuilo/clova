import { Card } from '.';

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
	private inputRequest?: (player: number, type: string, payload: any) => void;
	private logs: Log[] = [];
	private queue: Log[] = [];
	private onInput: (((log: Log) => void) | null)[] = [];

	constructor(inputRequest?: Controller['inputRequest']) {
		this.inputRequest = inputRequest;
	}

	public input(action: Log): void {
		console.log('<- INPUT', action.player, action.payload);
		this.logs.push(action);
		this.queue.push(action);
		if (this.onInput[action.player]) this.onInput[action.player]!(action);
	}

	public output(player: number, type: string, payload?: any): Promise<Log['payload']> {
		return new Promise(res => {
			if (this.queue.filter(log => log.player === player).length === 0) {
				this.onInput[player] = log => {
					console.log('<- OUTPUT', player, type, log.payload);
					this.onInput[player] = null;
					res(log.payload);
				};
				console.log('-> WAITING INPUT...', player, type, payload);
				if (this.inputRequest) this.inputRequest(player, type, payload);
			} else {
				const log = this.queue.find(log => log.player === player);
				this.queue = this.queue.filter(_log => _log !== log);
				console.log('<- OUTPUT', player, type, log!.payload);
				res(log!.payload);
			}
		});
	} 

	public getLogs(): Log[] {
		return this.logs;
	}
}
