type Commit = Record<string, any>;

type CommitHandler = (Commit) => void;

export class Repository {
	private commits: Commit[] = [];
	public next: CommitHandler | null = null;

	public commit(commit: Commit): void {
		this.commits.push(commit);
		if (this.next) {
			this.next(commit);
			this.next = null;
		}
	}
}
