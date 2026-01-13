<script lang="ts">
	/**
	 * NewsView - Updates, changelog, and announcements
	 */

	interface NewsItem {
		id: string;
		type: 'release' | 'feature' | 'tip' | 'announcement';
		title: string;
		content: string;
		date: Date;
	}

	let news = $state<NewsItem[]>([
		{
			id: '1',
			type: 'release',
			title: 'DevPulse Alpha Launch',
			content: 'Welcome to the first alpha release of DevPulse! This is the beginning of your AI-powered development journey.',
			date: new Date()
		},
		{
			id: '2',
			type: 'feature',
			title: 'Meet Maestro',
			content: 'Maestro is your AI coding companion. Press Ctrl+G anywhere to summon the chat overlay.',
			date: new Date()
		},
		{
			id: '3',
			type: 'tip',
			title: 'Voice Commands',
			content: 'Try the Voice page to interact with Maestro using your voice. Hold Space for push-to-talk.',
			date: new Date()
		}
	]);

	function getTypeIcon(type: NewsItem['type']): string {
		switch (type) {
			case 'release': return '🚀';
			case 'feature': return '✨';
			case 'tip': return '💡';
			case 'announcement': return '📢';
		}
	}

	function getTypeLabel(type: NewsItem['type']): string {
		switch (type) {
			case 'release': return 'Release';
			case 'feature': return 'Feature';
			case 'tip': return 'Tip';
			case 'announcement': return 'Announcement';
		}
	}

	function formatDate(date: Date): string {
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
	}
</script>

<div class="news">
	<header class="news-header">
		<h1>News</h1>
		<p class="subtitle">Updates and announcements</p>
	</header>

	<div class="news-feed">
		{#each news as item (item.id)}
			<article class="news-card glass">
				<div class="news-badge" data-type={item.type}>
					<span class="badge-icon">{getTypeIcon(item.type)}</span>
					<span class="badge-label">{getTypeLabel(item.type)}</span>
				</div>
				<h2 class="news-title">{item.title}</h2>
				<p class="news-content">{item.content}</p>
				<time class="news-date">{formatDate(item.date)}</time>
			</article>
		{/each}

		{#if news.length === 0}
			<div class="empty-state glass">
				<div class="empty-icon">📰</div>
				<p>No news yet. Check back later!</p>
			</div>
		{/if}
	</div>
</div>

<style>
	.news {
		height: 100%;
		padding: 2rem;
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.news-header h1 {
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

	.news-feed {
		flex: 1;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.news-card {
		padding: 1.5rem;
	}

	.news-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.375rem 0.75rem;
		border-radius: 2rem;
		font-size: 0.75rem;
		margin-bottom: 1rem;
	}

	.news-badge[data-type="release"] {
		background: rgba(34, 197, 94, 0.2);
		color: #22c55e;
	}

	.news-badge[data-type="feature"] {
		background: rgba(139, 92, 246, 0.2);
		color: #8b5cf6;
	}

	.news-badge[data-type="tip"] {
		background: rgba(245, 158, 11, 0.2);
		color: #f59e0b;
	}

	.news-badge[data-type="announcement"] {
		background: rgba(59, 130, 246, 0.2);
		color: #3b82f6;
	}

	.badge-icon {
		font-size: 0.875rem;
	}

	.news-title {
		font-size: 1.25rem;
		font-weight: 600;
		margin: 0 0 0.75rem;
	}

	.news-content {
		margin: 0 0 1rem;
		line-height: 1.6;
		color: var(--color-text-secondary);
	}

	.news-date {
		font-size: 0.75rem;
		color: var(--color-text-secondary);
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

	.empty-state p {
		margin: 0;
		color: var(--color-text-secondary);
	}
</style>
