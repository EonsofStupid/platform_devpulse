<script lang="ts">
	/**
	 * MediaView - Audio/video playback and management
	 * Features: Audio playback, voice recordings, video preview
	 */

	interface MediaItem {
		id: string;
		type: 'audio' | 'video';
		name: string;
		duration: number;
		timestamp: Date;
	}

	let mediaItems = $state<MediaItem[]>([]);
	let activeMedia = $state<MediaItem | null>(null);
	let isPlaying = $state(false);

	function formatDuration(seconds: number): string {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	}

	function formatDate(date: Date): string {
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
	}

	function playMedia(item: MediaItem) {
		activeMedia = item;
		isPlaying = true;
	}

	function togglePlayback() {
		isPlaying = !isPlaying;
	}
</script>

<div class="media">
	<header class="media-header">
		<h1>Media</h1>
		<p class="subtitle">Recordings and playback</p>
	</header>

	{#if activeMedia}
		<div class="now-playing glass">
			<div class="player-info">
				<span class="player-type">{activeMedia.type === 'audio' ? '🎵' : '🎬'}</span>
				<div class="player-details">
					<span class="player-name">{activeMedia.name}</span>
					<span class="player-duration">{formatDuration(activeMedia.duration)}</span>
				</div>
			</div>
			<div class="player-controls">
				<button class="control-btn">⏮️</button>
				<button class="control-btn play" onclick={togglePlayback}>
					{isPlaying ? '⏸️' : '▶️'}
				</button>
				<button class="control-btn">⏭️</button>
			</div>
			<div class="player-progress">
				<div class="progress-bar">
					<div class="progress-fill" style="width: 30%"></div>
				</div>
			</div>
		</div>
	{/if}

	<div class="media-tabs">
		<button class="tab active">All</button>
		<button class="tab">Voice</button>
		<button class="tab">Video</button>
	</div>

	<div class="media-list">
		{#each mediaItems as item (item.id)}
			<div 
				class="media-item glass" 
				onclick={() => playMedia(item)} 
				onkeydown={(e) => e.key === 'Enter' && playMedia(item)}
				role="button" 
				tabindex="0"
			>
				<span class="media-icon">{item.type === 'audio' ? '🎵' : '🎬'}</span>
				<div class="media-info">
					<span class="media-name">{item.name}</span>
					<span class="media-meta">
						{formatDuration(item.duration)} • {formatDate(item.timestamp)}
					</span>
				</div>
				<span class="play-btn">▶️</span>
			</div>
		{/each}

		{#if mediaItems.length === 0}
			<div class="empty-state glass">
				<div class="empty-icon">🎧</div>
				<h3>No media yet</h3>
				<p>Voice recordings and media files will appear here.</p>
			</div>
		{/if}
	</div>
</div>

<style>
	.media {
		height: 100%;
		padding: 2rem;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.media-header h1 {
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

	.now-playing {
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.player-info {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.player-type {
		font-size: 2rem;
	}

	.player-details {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.player-name {
		font-weight: 500;
	}

	.player-duration {
		font-size: 0.75rem;
		color: var(--color-text-secondary);
	}

	.player-controls {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1rem;
	}

	.control-btn {
		width: 44px;
		height: 44px;
		background: rgba(255, 255, 255, 0.1);
		border: none;
		border-radius: 50%;
		font-size: 1.25rem;
		cursor: pointer;
		transition: all 0.2s;
	}

	.control-btn:hover {
		background: rgba(255, 255, 255, 0.2);
	}

	.control-btn.play {
		width: 56px;
		height: 56px;
		background: linear-gradient(135deg, #8b5cf6, #6366f1);
	}

	.player-progress {
		padding: 0 0.5rem;
	}

	.progress-bar {
		height: 4px;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 2px;
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		background: #8b5cf6;
		border-radius: 2px;
		transition: width 0.1s;
	}

	.media-tabs {
		display: flex;
		gap: 0.5rem;
	}

	.tab {
		padding: 0.5rem 1rem;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 2rem;
		color: var(--color-text-secondary);
		cursor: pointer;
		transition: all 0.2s;
	}

	.tab:hover {
		background: rgba(255, 255, 255, 0.1);
		color: var(--color-text-primary);
	}

	.tab.active {
		background: rgba(139, 92, 246, 0.2);
		border-color: rgba(139, 92, 246, 0.3);
		color: var(--color-text-primary);
	}

	.media-list {
		flex: 1;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.media-item {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem 1.25rem;
		text-align: left;
		border: none;
		color: var(--color-text-primary);
		cursor: pointer;
		transition: all 0.2s;
	}

	.media-item:hover {
		background: rgba(255, 255, 255, 0.1);
	}

	.media-icon {
		font-size: 1.5rem;
	}

	.media-info {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.media-name {
		font-weight: 500;
	}

	.media-meta {
		font-size: 0.75rem;
		color: var(--color-text-secondary);
	}

	.play-btn {
		width: 36px;
		height: 36px;
		background: rgba(255, 255, 255, 0.1);
		border: none;
		border-radius: 50%;
		cursor: pointer;
		opacity: 0;
		transition: all 0.2s;
	}

	.media-item:hover .play-btn {
		opacity: 1;
	}

	.play-btn:hover {
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
		margin: 0;
		color: var(--color-text-secondary);
	}
</style>
