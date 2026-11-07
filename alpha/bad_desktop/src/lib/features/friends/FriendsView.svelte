<script lang="ts">
	/**
	 * FriendsView - P2P social connections
	 * Features: Friend list, P2P chat, file sharing, collaboration
	 */

	interface Friend {
		id: string;
		name: string;
		status: 'online' | 'offline' | 'away';
		avatar?: string;
		lastSeen?: Date;
	}

	let friends = $state<Friend[]>([]);
	let searchQuery = $state('');

	const filteredFriends = $derived(
		friends.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
	);

	const onlineFriends = $derived(friends.filter(f => f.status === 'online'));

	function getStatusColor(status: Friend['status']): string {
		switch (status) {
			case 'online': return '#22c55e';
			case 'away': return '#f59e0b';
			case 'offline': return '#6b7280';
		}
	}

	function addFriend() {
		// TODO: Open add friend dialog
	}
</script>

<div class="friends">
	<header class="friends-header">
		<h1>Friends</h1>
		<p class="subtitle">P2P connections</p>
	</header>

	<div class="friends-toolbar">
		<div class="search-box glass">
			<span class="search-icon">🔍</span>
			<input 
				type="text" 
				placeholder="Search friends..." 
				bind:value={searchQuery}
			/>
		</div>
		<button class="add-btn glass" onclick={addFriend}>
			<span>➕</span>
			Add Friend
		</button>
	</div>

	<div class="friends-stats glass">
		<div class="stat">
			<span class="stat-value">{friends.length}</span>
			<span class="stat-label">Total</span>
		</div>
		<div class="stat">
			<span class="stat-value online">{onlineFriends.length}</span>
			<span class="stat-label">Online</span>
		</div>
	</div>

	<div class="friends-list">
		{#each filteredFriends as friend (friend.id)}
			<div class="friend-card glass">
				<div class="friend-avatar">
					{friend.avatar || friend.name[0].toUpperCase()}
					<span 
						class="status-dot" 
						style="background: {getStatusColor(friend.status)}"
					></span>
				</div>
				<div class="friend-info">
					<span class="friend-name">{friend.name}</span>
					<span class="friend-status">{friend.status}</span>
				</div>
				<div class="friend-actions">
					<button class="action-btn" title="Message">💬</button>
					<button class="action-btn" title="Call">📞</button>
					<button class="action-btn" title="Share">📤</button>
				</div>
			</div>
		{/each}

		{#if friends.length === 0}
			<div class="empty-state glass">
				<div class="empty-icon">👥</div>
				<h3>No friends yet</h3>
				<p>Add friends to collaborate and share directly with P2P connections.</p>
				<button class="cta-btn" onclick={addFriend}>
					Add Your First Friend
				</button>
			</div>
		{:else if filteredFriends.length === 0}
			<div class="empty-state glass">
				<p>No friends match "{searchQuery}"</p>
			</div>
		{/if}
	</div>
</div>

<style>
	.friends {
		height: 100%;
		padding: 2rem;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.friends-header h1 {
		font-size: 2rem;
		font-weight: 600;
		margin: 0;
	}

	.subtitle {
		color: var(--color-text-secondary);
		margin: 0.5rem 0 0;
	}

	.glass {
		background: rgba(255, 255, 255, 0.05);
		backdrop-filter: blur(10px);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 0.75rem;
	}

	.friends-toolbar {
		display: flex;
		gap: 1rem;
	}

	.search-box {
		flex: 1;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0 1rem;
	}

	.search-icon {
		opacity: 0.5;
	}

	.search-box input {
		flex: 1;
		background: none;
		border: none;
		color: var(--color-text-primary);
		font-size: 0.875rem;
		padding: 0.75rem 0;
		outline: none;
	}

	.search-box input::placeholder {
		color: var(--color-text-secondary);
	}

	.add-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0 1.25rem;
		border: none;
		color: var(--color-text-primary);
		cursor: pointer;
		transition: all 0.2s;
	}

	.add-btn:hover {
		background: rgba(255, 255, 255, 0.1);
	}

	.friends-stats {
		display: flex;
		gap: 2rem;
		padding: 1rem 1.5rem;
	}

	.stat {
		display: flex;
		flex-direction: column;
	}

	.stat-value {
		font-size: 1.5rem;
		font-weight: 600;
	}

	.stat-value.online {
		color: #22c55e;
	}

	.stat-label {
		font-size: 0.75rem;
		color: var(--color-text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.friends-list {
		flex: 1;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.friend-card {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem 1.25rem;
		cursor: pointer;
		transition: all 0.2s;
	}

	.friend-card:hover {
		background: rgba(255, 255, 255, 0.1);
	}

	.friend-avatar {
		position: relative;
		width: 48px;
		height: 48px;
		background: linear-gradient(135deg, #8b5cf6, #6366f1);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 600;
		font-size: 1.25rem;
	}

	.status-dot {
		position: absolute;
		bottom: 2px;
		right: 2px;
		width: 12px;
		height: 12px;
		border-radius: 50%;
		border: 2px solid var(--color-bg-primary);
	}

	.friend-info {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.friend-name {
		font-weight: 500;
	}

	.friend-status {
		font-size: 0.75rem;
		color: var(--color-text-secondary);
		text-transform: capitalize;
	}

	.friend-actions {
		display: flex;
		gap: 0.25rem;
		opacity: 0;
		transition: opacity 0.2s;
	}

	.friend-card:hover .friend-actions {
		opacity: 1;
	}

	.action-btn {
		width: 36px;
		height: 36px;
		background: rgba(255, 255, 255, 0.1);
		border: none;
		border-radius: 0.5rem;
		cursor: pointer;
		transition: all 0.2s;
	}

	.action-btn:hover {
		background: rgba(255, 255, 255, 0.2);
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 4rem 2rem;
		text-align: center;
	}

	.empty-icon {
		font-size: 4rem;
		margin-bottom: 1rem;
	}

	.empty-state h3 {
		margin: 0 0 0.5rem;
		font-size: 1.25rem;
	}

	.empty-state p {
		margin: 0 0 1.5rem;
		color: var(--color-text-secondary);
		max-width: 300px;
	}

	.cta-btn {
		padding: 0.75rem 1.5rem;
		background: linear-gradient(135deg, #8b5cf6, #6366f1);
		border: none;
		border-radius: 0.5rem;
		color: white;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
	}

	.cta-btn:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
	}
</style>
