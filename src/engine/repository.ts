export class Repository<T> {
	private state: T;

	constructor(state: T) {
		this.state = state;
		Object.freeze(this.state);
	}

	public setState(state: T) {
		this.state = {
			...this.state,
			...state
		};
		console.debug('STATE UPDATED');
	}

	public getState() {
		return this.state;
	}
}
