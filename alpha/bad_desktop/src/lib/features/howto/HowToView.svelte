<script lang="ts">
	/**
	 * HowToView - Guides and documentation
	 */

	interface Guide {
		id: string;
		title: string;
		description: string;
		category: 'getting-started' | 'features' | 'advanced' | 'troubleshooting';
		icon: string;
	}

	const guides: Guide[] = [
		{
			id: '1',
			title: 'Getting Started',
			description: 'Learn the basics of DevPulse and Maestro',
			category: 'getting-started',
			icon: '🚀'
		},
		{
			id: '2',
			title: 'Chat with Maestro',
			description: 'How to use the AI chat overlay effectively',
			category: 'features',
			icon: '💬'
		},
		{
			id: '3',
			title: 'Voice Commands',
			description: 'Control DevPulse with your voice',
			category: 'features',
			icon: '🎤'
		},
		{
			id: '4',
			title: 'Screen Capture',
			description: 'Use the Gallery for screenshots with AI analysis',
			category: 'features',
			icon: '📸'
		},
		{
			id: '5',
			title: 'Keyboard Shortcuts',
			description: 'Master the hotkeys for faster workflow',
			category: 'advanced',
			icon: '⌨️'
		},
		{
			id: '6',
			title: 'P2P Connections',
			description: 'Connect with friends for collaboration',
			category: 'advanced',
			icon: '👥'
		}
	];

	let activeGuide = $state<Guide | null>(null);
	let searchQuery = $state('');

	const filteredGuides = $derived(
		guides.filter(g => 
			g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
			g.description.toLowerCase().includes(searchQuery.toLowerCase())
		)
	);

	function openGuide(guide: Guide) {
		activeGuide = guide;
	}

	function closeGuide() {
		activeGuide = null;
	}
</script>

<div class="howto">
	<header class="howto-header">
		<h1>How-to Guides</h1>
		<p class="subtitle">Learn to use DevPulse</p>
	</header>

	<div class="search-box glass">
		<span class="search-icon">🔍</span>
		<input 
			type="text" 
			placeholder="Search guides..." 
			bind:value={searchQuery}
		/>
	</div>

	{#if activeGuide}
		<div class="guide-detail glass">
			<button class="back-btn" onclick={closeGuide}>
				← Back to guides
			</button>
			<div class="guide-content">
				<div class="guide-icon-large">{activeGuide.icon}</div>
				<h2>{activeGuide.title}</h2>
				<p>{activeGuide.description}</p>
				<div class="guide-body">
					<p>Detailed guide content coming soon...</p>
				</div>
			</div>
		</div>
	{:else}
		<div class="guides-grid">
			{#each filteredGuides as guide (guide.id)}
				<button class="guide-card glass" onclick={() => openGuide(guide)}>
					<span class="guide-icon">{guide.icon}</span>
					<h3 class="guide-title">{guide.title}</h3>
					<p class="guide-desc">{guide.description}</p>
				</button>
			{/each}

			{#if filteredGuides.length === 0}
				<div class="empty-state glass">
					<p>No guides match "{searchQuery}"</p>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.howto {
		height: 100%;
		padding: 2rem;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.howto-header h1 {
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

	.search-box {
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

	.guides-grid {
		flex: 1;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: 1rem;
		overflow-y: auto;
	}

	.guide-card {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		padding: 1.5rem;
		text-align: left;
		border: none;
		color: var(--color-text-primary);
		cursor: pointer;
		transition: all 0.2s;
	}

	.guide-card:hover {
		background: rgba(255, 255, 255, 0.1);
		transform: translateY(-2px);
	}

	.guide-icon {
		font-size: 2rem;
		margin-bottom: 1rem;
	}

	.guide-title {
		font-size: 1.125rem;
		font-weight: 500;
		margin: 0 0 0.5rem;
	}

	.guide-desc {
		margin: 0;
		font-size: 0.875rem;
		color: var(--color-text-secondary);
		line-height: 1.5;
	}

	.guide-detail {
		flex: 1;
		padding: 1.5rem;
		overflow-y: auto;
	}

	.back-btn {
		background: none;
		border: none;
		color: var(--color-text-secondary);
		cursor: pointer;
		padding: 0.5rem 0;
		margin-bottom: 1rem;
		transition: color 0.2s;
	}

	.back-btn:hover {
		color: var(--color-text-primary);
	}

	.guide-content {
		max-width: 600px;
	}

	.guide-icon-large {
		font-size: 3rem;
		margin-bottom: 1rem;
	}

	.guide-content h2 {
		font-size: 1.5rem;
		margin: 0 0 0.5rem;
	}

	.guide-content > p {
		color: var(--color-text-secondary);
		margin: 0 0 2rem;
	}

	.guide-body {
		line-height: 1.6;
	}

	.guide-body p {
		color: var(--color-text-secondary);
		font-style: italic;
	}

	.empty-state {
		grid-column: 1 / -1;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 3rem;
		text-align: center;
	}

	.empty-state p {
		margin: 0;
		color: var(--color-text-secondary);
	}
</style>
