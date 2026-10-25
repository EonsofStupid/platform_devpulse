<script lang="ts">
	/**
	 * TaskListCard - Task checklist popup for Maestro
	 * AI can present tasks for user to track/complete
	 */

	interface Task {
		id: string;
		text: string;
		completed: boolean;
	}

	interface Props {
		title?: string;
		tasks: Task[];
		onToggle: (id: string) => void;
		onComplete?: () => void;
		onClose?: () => void;
	}

	let { title = 'Tasks', tasks, onToggle, onComplete, onClose }: Props = $props();

	let completedCount = $derived(tasks.filter((t) => t.completed).length);
	let progress = $derived(tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0);
	let allComplete = $derived(completedCount === tasks.length && tasks.length > 0);
</script>

<div class="task-list-card">
	<header class="card-header">
		<h3>{title}</h3>
		{#if onClose}
			<button class="close-btn" onclick={onClose} aria-label="Close">×</button>
		{/if}
	</header>

	<div class="progress-section">
		<div class="progress-bar-bg">
			<div class="progress-bar-fill" style="width: {progress}%"></div>
		</div>
		<span class="progress-text">{completedCount}/{tasks.length} completed</span>
	</div>

	<ul class="task-list">
		{#each tasks as task (task.id)}
			<li class="task-item" class:completed={task.completed}>
				<label class="task-label">
					<input
						type="checkbox"
						checked={task.completed}
						onchange={() => onToggle(task.id)}
					/>
					<span class="checkbox"></span>
					<span class="task-text">{task.text}</span>
				</label>
			</li>
		{/each}
	</ul>

	{#if allComplete && onComplete}
		<footer class="card-footer">
			<button class="btn complete" onclick={onComplete}>
				All Done!
			</button>
		</footer>
	{/if}
</div>

<style>
	.task-list-card {
		background: rgba(30, 30, 50, 0.95);
		border: 1px solid rgba(99, 102, 241, 0.3);
		border-radius: 12px;
		padding: 1rem;
		max-width: 360px;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.75rem;
	}

	.card-header h3 {
		margin: 0;
		font-size: 1rem;
		font-weight: 600;
		color: #fff;
	}

	.close-btn {
		background: none;
		border: none;
		color: rgba(255, 255, 255, 0.5);
		font-size: 1.25rem;
		cursor: pointer;
		padding: 0;
		line-height: 1;
	}

	.close-btn:hover {
		color: #fff;
	}

	.progress-section {
		margin-bottom: 1rem;
	}

	.progress-bar-bg {
		height: 6px;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 3px;
		overflow: hidden;
		margin-bottom: 0.35rem;
	}

	.progress-bar-fill {
		height: 100%;
		background: #22c55e;
		border-radius: 3px;
		transition: width 0.3s ease;
	}

	.progress-text {
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.5);
	}

	.task-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.task-item {
		background: rgba(255, 255, 255, 0.03);
		border-radius: 6px;
		transition: background 0.15s ease;
	}

	.task-item:hover {
		background: rgba(255, 255, 255, 0.06);
	}

	.task-item.completed .task-text {
		text-decoration: line-through;
		color: rgba(255, 255, 255, 0.4);
	}

	.task-label {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.6rem 0.75rem;
		cursor: pointer;
	}

	.task-label input[type='checkbox'] {
		display: none;
	}

	.checkbox {
		width: 18px;
		height: 18px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-radius: 4px;
		flex-shrink: 0;
		position: relative;
		transition: all 0.15s ease;
	}

	.task-item.completed .checkbox {
		background: #22c55e;
		border-color: #22c55e;
	}

	.task-item.completed .checkbox::after {
		content: '✓';
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		color: #fff;
		font-size: 0.7rem;
		font-weight: bold;
	}

	.task-text {
		font-size: 0.9rem;
		color: #fff;
		transition: all 0.15s ease;
	}

	.card-footer {
		margin-top: 1rem;
	}

	.btn.complete {
		width: 100%;
		padding: 0.75rem;
		background: #22c55e;
		border: none;
		border-radius: 8px;
		color: #fff;
		font-size: 0.9rem;
		font-weight: 600;
		cursor: pointer;
		transition: background 0.15s ease;
	}

	.btn.complete:hover {
		background: #16a34a;
	}
</style>
