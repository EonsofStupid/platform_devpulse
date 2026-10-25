<script lang="ts">
	import { page } from '$app/stores';
	import { signalStore } from '$lib/stores/signals.svelte';

	const navItems = [
		{ href: '/dashboard', label: 'Dashboard', icon: '📊' },
		{ href: '/signals', label: 'Signals', icon: '📡' },
		{ href: '/models', label: 'Models', icon: '🤖' },
		{ href: '/agents', label: 'Sub-Agents', icon: '🤝' },
		{ href: '/roti', label: 'ROTI', icon: '📈' },
		{ href: '/pipeline', label: 'Pipeline', icon: '⚡' },
		{ href: '/config', label: 'Config', icon: '⚙️' },
		{ href: '/analytics', label: 'Analytics', icon: '📉' },
		{ href: '/persona', label: 'Persona', icon: '👤' },
		{ href: '/rumination', label: 'Rumination', icon: '🧠' },
		{ href: '/voice', label: 'Voice', icon: '🎤' },
		{ href: '/background', label: 'Background', icon: '🔧' },
		{ href: '/chat', label: 'Chat', icon: '💬' }
	];

	function isActive(href: string): boolean {
		const pathname = $page.url.pathname;
		if (pathname === '/' || pathname === '/dashboard') {
			return href === '/dashboard';
		}
		return pathname.startsWith(href);
	}
</script>

<aside class="w-64 h-screen glass-dark flex flex-col border-r border-white/10">
	<!-- Logo -->
	<div class="p-6 border-b border-white/10">
		<h1 class="text-xl font-bold text-white">DevPulse Lab</h1>
		<p class="text-sm text-gray-500 mt-1">Internal Observatory</p>
	</div>

	<!-- Navigation -->
	<nav class="flex-1 p-4 space-y-1">
		{#each navItems as item}
			<a href={item.href} class="nav-item" class:active={isActive(item.href)}>
				<span class="text-lg">{item.icon}</span>
				<span>{item.label}</span>
				{#if item.href === '/signals' && signalStore.connected}
					<span class="ml-auto status-dot status-healthy"></span>
				{/if}
			</a>
		{/each}
	</nav>

	<!-- Status Footer -->
	<div class="p-4 border-t border-white/10">
		<div class="flex items-center gap-2 text-sm text-gray-500">
			{#if signalStore.connected}
				<span class="status-dot status-healthy"></span>
				<span>Connected</span>
			{:else}
				<span class="status-dot status-offline"></span>
				<span>Disconnected</span>
			{/if}
		</div>
	</div>
</aside>
