<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { fade, fly, scale } from 'svelte/transition';
	import { elasticOut, backOut } from 'svelte/easing';

	const dispatch = createEventDispatcher();

	let step: 'connect' | 'select' | 'protect' | 'done' = 'connect';
	let selectedRepo: string | null = null;
	let protectionRules = {
		blockSecrets: true,
		blockLargeFiles: true,
		warnDrift: true,
		requireDocSync: false
	};

	// Mock repos for demo
	const repos = [
		{ name: 'cooking-blog', adapter: 'Lovable', lastUpdate: 'yesterday' },
		{ name: 'my-saas-app', adapter: 'Bolt', lastUpdate: '3 days ago' },
		{ name: 'portfolio-site', adapter: 'Replit', lastUpdate: '2 weeks ago' }
	];

	function handleConnect() {
		// TODO: Actual OAuth flow
		setTimeout(() => {
			step = 'select';
		}, 800);
	}

	function handleSelectRepo(repoName: string) {
		selectedRepo = repoName;
		setTimeout(() => {
			step = 'protect';
		}, 300);
	}

	function handleActivate() {
		// TODO: Actually enable protection via engine.github.enable_protection()
		setTimeout(() => {
			step = 'done';
			dispatch('protected', { repo: selectedRepo, rules: protectionRules });
		}, 1000);
	}

	function handleClose() {
		dispatch('close');
	}
</script>

<div class="wizard-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" in:fade={{ duration: 200 }}>
	<div
		class="wizard-modal relative w-full max-w-2xl bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden"
		in:scale={{ duration: 400, easing: elasticOut }}
	>
		<!-- Close Button -->
		<button
			on:click={handleClose}
			class="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10"
		>
			<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
			</svg>
		</button>

		<!-- Progress Indicator -->
		<div class="absolute top-0 left-0 right-0 h-1 bg-gray-700">
			<div
				class="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500 ease-out"
				style="width: {step === 'connect' ? '25%' : step === 'select' ? '50%' : step === 'protect' ? '75%' : '100%'}"
			></div>
		</div>

		<div class="p-8 pt-12">
			{#if step === 'connect'}
				<div in:fly={{ y: 20, duration: 400, easing: backOut }}>
					<div class="text-center mb-8">
						<div class="text-6xl mb-4 animate-bounce-subtle">🛡️</div>
						<h2 class="text-3xl font-bold text-white mb-2">Protect Your Code</h2>
						<p class="text-gray-400">Connect your GitHub account to get started</p>
					</div>

					<button
						on:click={handleConnect}
						class="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl flex items-center justify-center gap-3"
					>
						<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
							<path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
						</svg>
						<span>Sign in with GitHub</span>
					</button>

					<p class="text-xs text-gray-500 text-center mt-4">
						We'll help protect your code automatically.<br />No terminal or config files needed.
					</p>
				</div>
			{:else if step === 'select'}
				<div in:fly={{ y: 20, duration: 400, easing: backOut }}>
					<h2 class="text-2xl font-bold text-white mb-2">Select Repository</h2>
					<p class="text-gray-400 mb-6">Choose which repo Gus should protect</p>

					<div class="space-y-3 max-h-96 overflow-y-auto">
						{#each repos as repo}
							<button
								on:click={() => handleSelectRepo(repo.name)}
								class="w-full text-left p-4 bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700 hover:border-blue-500 rounded-xl transition-all duration-300 group"
							>
								<div class="flex items-center justify-between">
									<div class="flex-1">
										<div class="font-semibold text-white group-hover:text-blue-400 transition-colors">
											{repo.name}
										</div>
										<div class="text-sm text-gray-400">
											{repo.adapter} • {repo.lastUpdate}
										</div>
									</div>
									<svg class="w-5 h-5 text-gray-600 group-hover:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
									</svg>
								</div>
							</button>
						{/each}
					</div>
				</div>
			{:else if step === 'protect'}
				<div in:fly={{ y: 20, duration: 400, easing: backOut }}>
					<h2 class="text-2xl font-bold text-white mb-2">Protection Settings</h2>
					<p class="text-gray-400 mb-6">What should Gus watch for in <span class="text-blue-400">{selectedRepo}</span>?</p>

					<div class="space-y-4 mb-8">
						<label class="flex items-center gap-3 p-4 bg-gray-800/50 border border-gray-700 rounded-xl cursor-pointer hover:border-blue-500 transition-all">
							<input type="checkbox" bind:checked={protectionRules.blockSecrets} class="w-5 h-5 accent-blue-500" />
							<div>
								<div class="font-semibold text-white">Block secrets & API keys</div>
								<div class="text-sm text-gray-400">Prevent accidental credential leaks</div>
							</div>
						</label>

						<label class="flex items-center gap-3 p-4 bg-gray-800/50 border border-gray-700 rounded-xl cursor-pointer hover:border-blue-500 transition-all">
							<input type="checkbox" bind:checked={protectionRules.blockLargeFiles} class="w-5 h-5 accent-blue-500" />
							<div>
								<div class="font-semibold text-white">Block large files (>5MB)</div>
								<div class="text-sm text-gray-400">Keep your repo fast and clean</div>
							</div>
						</label>

						<label class="flex items-center gap-3 p-4 bg-gray-800/50 border border-gray-700 rounded-xl cursor-pointer hover:border-yellow-500 transition-all">
							<input type="checkbox" bind:checked={protectionRules.warnDrift} class="w-5 h-5 accent-yellow-500" />
							<div>
								<div class="font-semibold text-white">Warn about code drift</div>
								<div class="text-sm text-gray-400">AI straying from your patterns</div>
							</div>
						</label>

						<label class="flex items-center gap-3 p-4 bg-gray-800/50 border border-gray-700 rounded-xl cursor-pointer hover:border-green-500 transition-all">
							<input type="checkbox" bind:checked={protectionRules.requireDocSync} class="w-5 h-5 accent-green-500" />
							<div>
								<div class="font-semibold text-white">Require docs updates</div>
								<div class="text-sm text-gray-400">Keep documentation in sync</div>
							</div>
						</label>
					</div>

					<div class="border-t border-gray-700 pt-6">
						<p class="text-sm text-gray-400 mb-4">🔒 Protect main branch?</p>
						<div class="space-y-2 mb-6">
							<label class="flex items-center gap-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg cursor-pointer">
								<input type="radio" name="protection" checked class="w-4 h-4 accent-blue-500" />
								<span class="text-white">Yes, protect it (recommended)</span>
							</label>
							<label class="flex items-center gap-3 p-3 bg-gray-800/30 border border-gray-700 rounded-lg cursor-pointer">
								<input type="radio" name="protection" class="w-4 h-4 accent-gray-500" />
								<span class="text-gray-400">No, just warn me</span>
							</label>
						</div>
					</div>

					<button
						on:click={handleActivate}
						class="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl"
					>
						Activate Protection
					</button>
				</div>
			{:else if step === 'done'}
				<div in:scale={{ duration: 600, easing: elasticOut }} class="text-center py-8">
					<div class="text-8xl mb-6 animate-bounce-in">✅</div>
					<h2 class="text-3xl font-bold text-white mb-3">You're Protected!</h2>
					<p class="text-gray-400 mb-8">
						Gus is now watching <span class="text-green-400">{selectedRepo}</span>.<br />
						You'll see updates right here when commits happen.
					</p>

					<div class="bg-gray-800/50 border border-gray-700 rounded-xl p-6 mb-8 text-left">
						<p class="text-sm font-semibold text-white mb-3">What happens now?</p>
						<ul class="space-y-2 text-sm text-gray-300">
							<li class="flex items-start gap-2">
								<span class="text-blue-400">1.</span>
								<span>When you (or Lovable/Bolt) push code, Gus checks it automatically</span>
							</li>
							<li class="flex items-start gap-2">
								<span class="text-blue-400">2.</span>
								<span>You'll see ✅ or ⚠️ notifications here</span>
							</li>
							<li class="flex items-start gap-2">
								<span class="text-blue-400">3.</span>
								<span>Problems get caught before they cause issues</span>
							</li>
						</ul>
					</div>

					<button
						on:click={handleClose}
						class="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold py-3 px-8 rounded-xl transition-all duration-300 transform hover:scale-105"
					>
						Go to Dashboard
					</button>
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
	@keyframes bounce-subtle {
		0%, 100% { transform: translateY(0); }
		50% { transform: translateY(-8px); }
	}

	@keyframes bounce-in {
		0% { transform: scale(0); opacity: 0; }
		50% { transform: scale(1.2); }
		100% { transform: scale(1); opacity: 1; }
	}

	.animate-bounce-subtle {
		animation: bounce-subtle 2s ease-in-out infinite;
	}

	.animate-bounce-in {
		animation: bounce-in 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
	}
</style>
