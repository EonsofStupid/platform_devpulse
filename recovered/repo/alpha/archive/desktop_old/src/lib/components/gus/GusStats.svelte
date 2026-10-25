<script lang="ts">
	import { onMount } from 'svelte';
	import { fade, scale } from 'svelte/transition';
	import { elasticOut } from 'svelte/easing';

	export let protectedRepos: number = 0;
	export let blockedThisWeek: number = 0;
	export let approvedThisWeek: number = 0;
	export let currentStreak: number = 0;

	let mounted = false;

	onMount(() => {
		mounted = true;
	});

	$: protectionRate = approvedThisWeek + blockedThisWeek > 0
		? Math.round((approvedThisWeek / (approvedThisWeek + blockedThisWeek)) * 100)
		: 100;
</script>

{#if mounted}
	<div
		class="gus-stats grid grid-cols-2 gap-4"
		in:fade={{ duration: 400, delay: 200 }}
	>
		<!-- Protected Repos -->
		<div
			class="stat-card bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30 rounded-xl p-4 backdrop-blur-lg"
			in:scale={{ duration: 400, delay: 300, easing: elasticOut }}
		>
			<div class="flex items-center justify-between mb-2">
				<span class="text-2xl">🛡️</span>
				<div class="text-3xl font-bold text-blue-400 animate-count-up">
					{protectedRepos}
				</div>
			</div>
			<p class="text-xs text-gray-300">Protected Repos</p>
		</div>

		<!-- Blocked This Week -->
		<div
			class="stat-card bg-gradient-to-br from-red-500/20 to-red-600/20 border border-red-500/30 rounded-xl p-4 backdrop-blur-lg"
			in:scale={{ duration: 400, delay: 400, easing: elasticOut }}
		>
			<div class="flex items-center justify-between mb-2">
				<span class="text-2xl">🚫</span>
				<div class="text-3xl font-bold text-red-400 animate-count-up">
					{blockedThisWeek}
				</div>
			</div>
			<p class="text-xs text-gray-300">Blocked This Week</p>
		</div>

		<!-- Approved This Week -->
		<div
			class="stat-card bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/30 rounded-xl p-4 backdrop-blur-lg"
			in:scale={{ duration: 400, delay: 500, easing: elasticOut }}
		>
			<div class="flex items-center justify-between mb-2">
				<span class="text-2xl">✅</span>
				<div class="text-3xl font-bold text-green-400 animate-count-up">
					{approvedThisWeek}
				</div>
			</div>
			<p class="text-xs text-gray-300">Approved This Week</p>
		</div>

		<!-- Current Streak -->
		<div
			class="stat-card bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 rounded-xl p-4 backdrop-blur-lg relative overflow-hidden"
			in:scale={{ duration: 400, delay: 600, easing: elasticOut }}
		>
			{#if currentStreak >= 7}
				<div class="absolute inset-0 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 animate-pulse"></div>
			{/if}
			<div class="relative flex items-center justify-between mb-2">
				<span class="text-2xl">🔥</span>
				<div class="text-3xl font-bold text-purple-400 animate-count-up">
					{currentStreak}
				</div>
			</div>
			<p class="text-xs text-gray-300">Day Streak</p>
		</div>

		<!-- Protection Rate (Full Width) -->
		<div
			class="col-span-2 bg-gradient-to-br from-gray-700/20 to-gray-800/20 border border-gray-600/30 rounded-xl p-4 backdrop-blur-lg"
			in:scale={{ duration: 400, delay: 700, easing: elasticOut }}
		>
			<div class="flex items-center justify-between mb-3">
				<span class="text-sm text-gray-300">Protection Rate</span>
				<span class="text-2xl font-bold text-white">{protectionRate}%</span>
			</div>
			<div class="w-full bg-gray-700/50 rounded-full h-3 overflow-hidden">
				<div
					class="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-1000 ease-out"
					style="width: {protectionRate}%"
				></div>
			</div>
			<p class="text-xs text-gray-400 mt-2 text-center">
				{#if protectionRate === 100}
					Perfect score! 🎉
				{:else if protectionRate >= 90}
					Excellent protection! 🌟
				{:else if protectionRate >= 75}
					Good job! Keep it up! 💪
				{:else}
					Gus is working hard for you! 🛡️
				{/if}
			</p>
		</div>
	</div>
{/if}

<style>
	@keyframes count-up {
		from {
			opacity: 0;
			transform: scale(0.5);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}

	.animate-count-up {
		animation: count-up 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
	}

	.stat-card {
		transition: all 0.3s ease;
	}

	.stat-card:hover {
		transform: translateY(-4px);
		box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
	}
</style>
