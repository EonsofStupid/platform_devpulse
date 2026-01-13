/**
 * Task Store - Maestro-generated tasks
 *
 * Tasks are created by Maestro during conversations.
 * User can approve, modify, skip, or mark complete.
 */

export type TaskStatus = 'pending' | 'approved' | 'in_progress' | 'completed' | 'skipped';

export interface MaestroTask {
	id: string;
	content: string;
	status: TaskStatus;
	createdAt: number;
	completedAt?: number;
}

class TaskStore {
	tasks = $state<MaestroTask[]>([]);

	// Derived states
	pendingTasks = $derived(this.tasks.filter((t) => t.status === 'pending'));
	activeTasks = $derived(this.tasks.filter((t) => t.status === 'in_progress'));
	completedTasks = $derived(this.tasks.filter((t) => t.status === 'completed'));
	hasActiveTasks = $derived(this.tasks.some((t) => t.status === 'in_progress' || t.status === 'pending'));

	/**
	 * Add a new task from Maestro
	 */
	addTask(content: string): MaestroTask {
		const task: MaestroTask = {
			id: crypto.randomUUID(),
			content,
			status: 'pending',
			createdAt: Date.now()
		};
		this.tasks = [task, ...this.tasks];
		return task;
	}

	/**
	 * Add multiple tasks at once
	 */
	addTasks(contents: string[]): MaestroTask[] {
		const newTasks = contents.map((content) => ({
			id: crypto.randomUUID(),
			content,
			status: 'pending' as TaskStatus,
			createdAt: Date.now()
		}));
		this.tasks = [...newTasks, ...this.tasks];
		return newTasks;
	}

	/**
	 * Approve a task (user confirms Maestro should do it)
	 */
	approveTask(id: string) {
		this.tasks = this.tasks.map((t) => (t.id === id ? { ...t, status: 'approved' as TaskStatus } : t));
	}

	/**
	 * Start working on a task
	 */
	startTask(id: string) {
		this.tasks = this.tasks.map((t) => (t.id === id ? { ...t, status: 'in_progress' as TaskStatus } : t));
	}

	/**
	 * Mark task as completed
	 */
	completeTask(id: string) {
		this.tasks = this.tasks.map((t) =>
			t.id === id ? { ...t, status: 'completed' as TaskStatus, completedAt: Date.now() } : t
		);
	}

	/**
	 * Skip a task (user declines)
	 */
	skipTask(id: string) {
		this.tasks = this.tasks.map((t) => (t.id === id ? { ...t, status: 'skipped' as TaskStatus } : t));
	}

	/**
	 * Update task content
	 */
	updateTask(id: string, content: string) {
		this.tasks = this.tasks.map((t) => (t.id === id ? { ...t, content } : t));
	}

	/**
	 * Remove a task
	 */
	removeTask(id: string) {
		this.tasks = this.tasks.filter((t) => t.id !== id);
	}

	/**
	 * Clear completed tasks
	 */
	clearCompleted() {
		this.tasks = this.tasks.filter((t) => t.status !== 'completed');
	}

	/**
	 * Clear all tasks
	 */
	clearAll() {
		this.tasks = [];
	}
}

export const taskStore = new TaskStore();
