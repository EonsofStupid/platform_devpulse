<script lang="ts">
	/**
	 * TaskPanel - Displays Maestro's current tasks
	 * User can approve, modify, skip, or mark complete
	 */
	import { taskStore, type MaestroTask } from '$lib/stores';

	// Panel state
	let isCollapsed = $state(false);
	let editingId = $state<string | null>(null);
	let editContent = $state('');

	// Derived
	let tasks = $derived(taskStore.tasks);
	let hasTasks = $derived(tasks.length > 0);
	let pendingCount = $derived(taskStore.pendingTasks.length);
	let activeCount = $derived(taskStore.activeTasks.length);

	function toggleCollapse() {
		isCollapsed = !isCollapsed;
	}

	function startEdit(task: MaestroTask) {
		editingId = task.id;
		editContent = task.content;
	}

	function saveEdit() {
		if (editingId && editContent.trim()) {
			taskStore.updateTask(editingId, editContent.trim());
		}
		editingId = null;
		editContent = '';
	}

	function cancelEdit() {
		editingId = null;
		editContent = '';
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			saveEdit();
		} else if (e.key === 'Escape') {
			cancelEdit();
		}
	}

	const statusIcons: Record<string, string> = {
		pending: '⏳',
		approved: '✓',
		in_progress: '⚡',
		completed: '✅',
		skipped: '⏭️'
	};

	const statusColors: Record<string, string> = {
		pending: '#f59e0b',
		approved: '#3b82f6',
		in_progress: '#8b5cf6',
		completed: '#22c55e',
		skipped: 'rgba(255,255,255,0.3)'
	};
</script>

<div class="task-panel" class:collapsed={isCollapsed}>
	<header class="panel-header" onclick={toggleCollapse}>
		<div class="header-left">
			<span class="header-icon">📋</span>
			<span class="header-title">Tasks</span>
			{#if pendingCount > 0}
				<span class="badge pending">{pendingCount}</span>
			{/if}
			{#if activeCount > 0}
				<span class="badge active">{activeCount}</span>
			{/if}
		</div>
		<button class="collapse-btn" aria-label={isCollapsed ? 'Expand' : 'Collapse'}>
			<svg
				width="12"
				height="12"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				style="transform: rotate({isCollapsed ? '0' : '180'}deg); transition: transform 0.2s ease;"
			>
				<polyline points="6 9 12 15 18 9" />
			</svg>
		</button>
	</header>

	{#if !isCollapsed}
		<div class="panel-content">
			{#if !hasTasks}
				<div class="empty-state">
					<span class="empty-icon">✨</span>
					<p>No active tasks</p>
					<p class="empty-hint">Maestro will add tasks as you chat</p>
				</div>
			{:else}
				<ul class="task-list">
					{#each tasks as task (task.id)}
						<li class="task-item" class:completed={task.status === 'completed'} class:skipped={task.status === 'skipped'}>
							<div class="task-status" style="color: {statusColors[task.status]}">
								{statusIcons[task.status]}
							</div>

							{#if editingId === task.id}
								<input
									type="text"
									class="task-edit"
									bind:value={editContent}
									onkeydown={handleKeydown}
									onblur={saveEdit}
								/>
							{:else}
								<span class="task-content" ondblclick={() => startEdit(task)}>
									{task.content}
								</span>
							{/if}

							<div class="task-actions">
								{#if task.status === 'pending'}
									<button class="action-btn approve" onclick={() => taskStore.approveTask(task.id)} title="Approve">
										✓
									</button>
									<button class="action-btn skip" onclick={() => taskStore.skipTask(task.id)} title="Skip">
										⏭
									</button>
								{:else if task.status === 'approved'}
									<button class="action-btn start" onclick={() => taskStore.startTask(task.id)} title="Start">
										▶
									</button>
								{:else if task.status === 'in_progress'}
									<button class="action-btn complete" onclick={() => taskStore.completeTask(task.id)} title="Complete">
										✅
									</button>
								{/if}
								<button class="action-btn remove" onclick={() => taskStore.removeTask(task.id)} title="Remove">
									×
								</button>
							</div>
						</li>
					{/each}
				</ul>

				{#if taskStore.completedTasks.length > 0}
					<button class="clear-btn" onclick={() => taskStore.clearCompleted()}>
						Clear completed
					</button>
				{/if}
			{/if}
		</div>
	{/if}
</div>

<style>
	.task-panel {
		background: rgba(0, 0, 0, 0.3);
		border: 1px solid rgba(130, 111, 214, 0.2);
		border-radius: 8px;
		overflow: hidden;
		margin: 0.5rem;
	}

	.panel-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.625rem 0.75rem;
		background: rgba(130, 111, 214, 0.1);
		cursor: pointer;
		user-select: none;
	}

	.panel-header:hover {
		background: rgba(130, 111, 214, 0.15);
	}

	.header-left {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.header-icon {
		font-size: 0.875rem;
	}

	.header-title {
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: rgba(232, 224, 240, 0.8);
	}

	.badge {
		font-size: 0.625rem;
		padding: 0.125rem 0.375rem;
		border-radius: 9999px;
		font-weight: 600;
	}

	.badge.pending {
		background: rgba(245, 158, 11, 0.2);
		color: #f59e0b;
	}

	.badge.active {
		background: rgba(139, 92, 246, 0.2);
		color: #a78bfa;
	}

	.collapse-btn {
		padding: 0.25rem;
		background: transparent;
		border: none;
		color: rgba(232, 224, 240, 0.5);
		cursor: pointer;
	}

	.panel-content {
		padding: 0.5rem;
	}

	.empty-state {
		text-align: center;
		padding: 1rem;
		color: rgba(232, 224, 240, 0.5);
	}

	.empty-icon {
		font-size: 1.5rem;
		display: block;
		margin-bottom: 0.5rem;
	}

	.empty-state p {
		margin: 0;
		font-size: 0.8125rem;
	}

	.empty-hint {
		font-size: 0.6875rem !important;
		opacity: 0.7;
		margin-top: 0.25rem !important;
	}

	.task-list {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.task-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem;
		border-radius: 6px;
		transition: background 0.15s ease;
	}

	.task-item:hover {
		background: rgba(255, 255, 255, 0.03);
	}

	.task-item.completed,
	.task-item.skipped {
		opacity: 0.5;
	}

	.task-item.completed .task-content {
		text-decoration: line-through;
	}

	.task-status {
		font-size: 0.75rem;
		width: 20px;
		flex-shrink: 0;
	}

	.task-content {
		flex: 1;
		font-size: 0.8125rem;
		color: rgba(232, 224, 240, 0.9);
		cursor: text;
	}

	.task-edit {
		flex: 1;
		background: rgba(0, 0, 0, 0.3);
		border: 1px solid rgba(130, 111, 214, 0.4);
		border-radius: 4px;
		padding: 0.25rem 0.5rem;
		font-size: 0.8125rem;
		color: #e8e0f0;
		outline: none;
	}

	.task-edit:focus {
		border-color: rgba(130, 111, 214, 0.6);
	}

	.task-actions {
		display: flex;
		gap: 0.25rem;
		opacity: 0;
		transition: opacity 0.15s ease;
	}

	.task-item:hover .task-actions {
		opacity: 1;
	}

	.action-btn {
		width: 22px;
		height: 22px;
		padding: 0;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 4px;
		font-size: 0.6875rem;
		cursor: pointer;
		transition: all 0.15s ease;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.action-btn:hover {
		background: rgba(255, 255, 255, 0.1);
	}

	.action-btn.approve:hover {
		background: rgba(34, 197, 94, 0.2);
		border-color: rgba(34, 197, 94, 0.4);
	}

	.action-btn.start:hover {
		background: rgba(139, 92, 246, 0.2);
		border-color: rgba(139, 92, 246, 0.4);
	}

	.action-btn.complete:hover {
		background: rgba(34, 197, 94, 0.2);
		border-color: rgba(34, 197, 94, 0.4);
	}

	.action-btn.skip:hover {
		background: rgba(245, 158, 11, 0.2);
		border-color: rgba(245, 158, 11, 0.4);
	}

	.action-btn.remove:hover {
		background: rgba(239, 68, 68, 0.2);
		border-color: rgba(239, 68, 68, 0.4);
	}

	.clear-btn {
		width: 100%;
		padding: 0.375rem;
		margin-top: 0.5rem;
		background: transparent;
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 4px;
		font-size: 0.6875rem;
		color: rgba(232, 224, 240, 0.5);
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.clear-btn:hover {
		background: rgba(255, 255, 255, 0.05);
		color: rgba(232, 224, 240, 0.8);
	}
</style>
