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
	private actionSuppliers: ActionSupplier[];
	private logs: Log[] = [];
	private queue: Log[] = [];

	constructor(actionSuppliers: ActionSupplier[]) {
		this.actionSuppliers = actionSuppliers;
	}

	public supplyAction(action: Log): void {
		this.logs.push(action);
		this.queue.push(action);
	}

	public async consumeAction(player: number, type: string, payload?: any): Promise<Log['payload']> {
		if (this.queue.length === 0) {
			const action = await this.actionSuppliers[player][type](payload);
			this.supplyAction({
				date: new Date(),
				player: player,
				payload: action
			});
		}
		return this.queue.shift()!.payload;
	} 

	public getLogs(): Log[] {
		return this.logs;
	}
}
