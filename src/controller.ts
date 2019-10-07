import { Card } from '.';

type Actions = {
	mainPhase: () => { type: string; };
	cardChoice: (payload: any) => Card['id'];
};

export class Controller {
	private actions: Actions;
	private logs: any[] = [];
	private oldLogs: any[] = [];

	constructor(actions: Actions, oldLogs?: any[]) {
		this.actions = actions;
		if (oldLogs) this.oldLogs = oldLogs;
	}

	public async requestAction(type: string, payload?: any) {
		if (this.oldLogs.length > 0) {
			const log = this.oldLogs.shift();
			return log;
		} else {
			const res = await this.actions[type](payload);
			this.logs.push(res);
			return res;
		}
	}
}
