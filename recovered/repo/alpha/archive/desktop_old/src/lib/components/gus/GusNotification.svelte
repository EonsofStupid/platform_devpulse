<script lang="ts">
	import { slide, fade, fly } from 'svelte/transition';
	import { elasticOut } from 'svelte/easing';
	import { createEventDispatcher } from 'svelte';

	export let repoName: string;
	export let commitMessage: string;
	export let simpleSummary: string;
	export let detailedSummary: string = '';
	export let technicalDetails: string = '';
	export let timestamp: Date = new Date();

	const dispatch = createEventDispatcher();

	let expanded = 0; // 0 = simple, 1 = detailed, 2 = technical

	$: emoji = simpleSummary.startsWith('✅')
		? '✅'
		: simpleSummary.startsWith('⚠️')
			? '⚠️'
			: simpleSummary.startsWith('🛡️')
				? '🛡️'
				: '🔍';

	$: statusColor =
		emoji === '✅'
			? 'from-green-500/20 to-green-600/20 border-green-500/30'
			: emoji === '⚠️'
				? 'from-yellow-500/20 to-yellow-600/20 border-yellow-500/30'
				: emoji === '🛡️'
					? 'from-red-500/20 to-red-600/20 border-red-500/30'
					: 'from-blue-500/20 to-blue-600/20 border-blue-500/30';

	function toggleExpand() {
		if (expanded === 0 && detailedSummary) {
			expanded = 1;
		} else if (expanded === 1 && technicalDetails) {
			expanded = 2;
		} else {
			expanded = 0;
		}
	}

	function formatTime(date: Date): string {
		const now = new Date();
		const diff = now.getTime() - date.getTime();
		const minutes = Math.floor(diff / 60000);
		if (minutes < 1) return 'just now';
		if (minutes < 60) return `${minutes}m ago`;
		const hours = Math.floor(minutes / 60);
		if (hours < 24) return `${hours}h ago`;
		return `${Math.floor(hours / 24)}d ago`;
	}
</script>

<div
	class="gus-notification relative overflow-hidden rounded-xl border bg-gradient-to-br backdrop-blur-lg {statusColor} p-4 shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]"
	in:fly={{ y: 20, duration: 400, easing: elasticOut }}
	out:fade={{ duration: 200 }}
>
	<!-- Header -->
	<div class="flex items-start gap-3">
		<div class="text-4xl animate-bounce-subtle">{emoji}</div>
		<div class="flex-1 min-w-0">
			<div class="flex items-center gap-2 mb-1">
				<h3 class="font-semibold text-white truncate">{repoName}</h3>
				<span class="text-xs text-gray-400">{formatTime(timestamp)}</span>
			</div>
			<p class="text-sm text-gray-300 truncate mb-2">{commitMessage}</p>

			<!-- Layer 1: Simple Summary -->
			<div class="text-white font-medium mb-2">{simpleSummary}</div>

			<!-- Layer 2: Detailed Summary (expandable) -->
			{#if expanded >= 1}
				<div
					class="mt-3 p-3 bg-black/20 rounded-lg border border-white/10"
					transition:slide={{ duration: 300 }}
				>
					<div class="text-sm text-gray-200 whitespace-pre-line">{detailedSummary}</div>
				</div>
			{/if}

			<!-- Layer 3: Technical Details (expandable) -->
			{#if expanded === 2}
				<div
					class="mt-3 p-3 bg-black/30 rounded-lg border border-white/10 font-mono text-xs"
					transition:slide={{ duration: 300 }}
				>
					<pre class="text-gray-300 overflow-x-auto">{technicalDetails}</pre>
				</div>
			{/if}

			<!-- Expand Button -->
			{#if detailedSummary || technicalDetails}
				<button
					on:click={toggleExpand}
					class="mt-3 text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
				>
					{#if expanded === 0}
						<span>Show details</span>
						<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
						</svg>
					{:else if expanded === 1 && technicalDetails}
						<span>Show technical</span>
						<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
						</svg>
					{:else}
						<span>Hide details</span>
						<svg class="w-3 h-3 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
						</svg>
					{/if}
				</button>
			{/if}
		</div>
	</div>
</div>

<style>
	@keyframes bounce-subtle {
		0%,
		100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-4px);
		}
	}

	.animate-bounce-subtle {
		animation: bounce-subtle 2s ease-in-out infinite;
	}

	.gus-notification {
		animation: glow 3s ease-in-out infinite;
	}

	@keyframes glow {
		0%,
		100% {
			box-shadow:
				0 0 20px rgba(59, 130, 246, 0.1),
				0 0 40px rgba(59, 130, 246, 0.05);
		}
		50% {
			box-shadow:
				0 0 30px rgba(59, 130, 246, 0.2),
				0 0 60px rgba(59, 130, 246, 0.1);
		}
	}
</style>
