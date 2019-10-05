type Transition<State, Operation> = (state: State, operation: Operation) => State;

export class Store<State, Operation> {
	private initialState: State;
	private operations: Operation[] = [];
	private transition: Transition<State, Operation>;
	private currentState: State;

	constructor(initialState: State, transition: Transition<State, Operation>) {
		this.initialState = initialState;
		this.transition = transition;
		this.currentState = initialState;
	}

	public commit(operation: Operation) {
		this.operations.push(operation);
		this.currentState = this.transition(this.currentState, operation);
	}

	public commitAll(operations: Operation[]) {
		for (const operation of operations) this.commit(operation);
	}
}
