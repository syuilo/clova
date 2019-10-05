type Transition<State, Action> = (state: State, action: Action) => State;

export class Store<State, Action> {
	private initialState: State;
	private actions: Action[] = [];
	private transition: Transition<State, Action>;
	private _state: State;

	constructor(initialState: State, transition: Transition<State, Action>) {
		this.initialState = initialState;
		this.transition = transition;
		this._state = initialState;
	}

	public get state() {
		return this._state;
	}

	public commit(action: Action) {
		this.actions.push(action);
		this._state = this.transition(this._state, action);
	}

	// TODO: このメソッドは必要？使う？ 中断機能ありなら使いそう
	public commitAll(actions: Action[]) {
		for (const action of actions) this.commit(action);
	}
}
