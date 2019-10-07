import { Card } from '.';

export type Actions = {
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
	private actions: Actions[];
	private logs: Log[] = [];
	private oldLogs: Log[] = [];

	constructor(actions: Actions[], oldLogs?: Log[]) {
		this.actions = actions;
		if (oldLogs) this.oldLogs = oldLogs;
	}

	public async requestAction(player: number, type: string, payload?: any) {
		const log = this.oldLogs.find(l => l.player === player);
		if (log) {
			this.oldLogs = this.oldLogs.filter(l => l !== log);
			this.logs.push(log);
			return log.payload;
		} else {
			const res = await this.actions[player][type](payload);
			this.logs.push({
				date: new Date(),
				player: player,
				payload: res
			});
			return res;
		}
	}
}
