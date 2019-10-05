type Transition<State, Action> = (state: State, action: Action) => State;

export class Store<State, Action> {
	private initialState: State;
	private actions: Action[] = [];
	private transition: Transition<State, Action>;
	private currentState: State;

	constructor(initialState: State, transition: Transition<State, Action>) {
		this.initialState = initialState;
		this.transition = transition;
		this.currentState = initialState;
	}

	public commit(action: Action) {
		this.actions.push(action);
		this.currentState = this.transition(this.currentState, action);
	}

	public commitAll(actions: Action[]) {
		for (const action of actions) this.commit(action);
	}
}
