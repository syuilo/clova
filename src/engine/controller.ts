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

export abstract class Controller {
	public abstract output(player: number, type: string, payload?: any): Promise<any>;
}

const validate = (player: number, type: string, payload?: any) => true;

export class ServerController extends Controller {
	private logs: Log[] = [];
	private queue: Log[] = [];
	private onInput: (((log: Log) => boolean) | null)[] = [];

	constructor(queue?: Log[]) {
		super();
		if (queue) this.queue = queue;
	}

	public input(action: Log): boolean {
		console.log('<- INPUT', action.player, action.payload);
		return this.onInput[action.player]!(action);
	}

	public output(player: number, type: string, payload?: any): Promise<Log['payload']> {
		return new Promise(res => {
			if (this.queue.filter(log => log.player === player).length === 0) {
				this.onInput[player] = log => {
					if (!validate(player, type, log.payload)) return false;
					console.log('<- OUTPUT', player, type, log.payload);
					this.onInput[player] = null;
					this.logs.push(log);
					res(log.payload);
					return true;
				};
				console.log('-> WAITING INPUT...', player, type, payload);
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

export class ClientController extends Controller {
	private inputRequest: (player: number, type: string, payload: any) => void;
	private queue: Log[] = [];
	private onInput: (((log: Log) => void) | null)[] = [];

	constructor(inputRequest: ClientController['inputRequest'], queue?: Log[]) {
		super();
		this.inputRequest = inputRequest;
		if (queue) this.queue = queue;
	}

	public input(action: Log): void {
		console.log('<- INPUT', action.player, action.payload);
		this.onInput[action.player]!(action);
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
				this.inputRequest(player, type, payload);
			} else {
				const log = this.queue.find(log => log.player === player);
				this.queue = this.queue.filter(_log => _log !== log);
				console.log('<- OUTPUT', player, type, log!.payload);
				res(log!.payload);
			}
		});
	} 
}
