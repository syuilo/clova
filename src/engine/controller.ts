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
	private logs: Log[] = [];
	private queue: Log[] = [];
	private onInput: (((log: Log) => Promise<boolean>) | null)[] = [];
	private inputRequest: (player: number, type: string, payload: any, logs: any[]) => void;
	private notAcceptedLogs: Log[] = [];

	constructor(inputRequest: Controller['inputRequest'], queue?: Log[]) {
		this.inputRequest = inputRequest;
		if (queue) this.queue = queue;
	}

	public input(action: Log): Promise<boolean> {
		console.log('<- INPUT', action.player, action.payload);
		return this.onInput[action.player]!(action);
	}

	public q(player: number, type: string, payload: any, logs: any[]): Promise<any> {
		if (this.notAcceptedLogs) this.notAcceptedLogs = this.logs.concat(this.notAcceptedLogs);
		return new Promise(res => {
			if (this.queue.filter(log => log.player === player).length === 0) {
				this.onInput[player] = log => new Promise(ok => {
					console.log('<- OUTPUT', player, type, log.payload);
					res(log.payload);
					this.onInput[player] = null;
					this.notAcceptedLogs.push(log);
				});
				console.log('-> WAITING INPUT...', player, type, payload);
				this.inputRequest(player, type, payload, logs);
			} else {
				const log = this.queue.find(log => log.player === player);
				this.queue = this.queue.filter(_log => _log !== log);
				this.logs.push(log!);
				console.log('<- OUTPUT', player, type, log!.payload);
				res(log!.payload);
			}
		});
	} 

	public getLogs(): Log[] {
		return this.logs;
	}
}
