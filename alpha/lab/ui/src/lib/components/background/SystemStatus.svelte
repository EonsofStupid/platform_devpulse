<script lang="ts">
	import { backgroundStore } from "$lib/stores/background.svelte";
	import {
		formatMemory,
		formatLoadTime,
		type LoadState,
	} from "$lib/api/background";

	const componentIcons: Record<string, string> = {
		database: "💾",
		analytics: "📊",
		embedder: "📐",
		reranker: "⚖️",
		llm: "🧠",
		voice_tts: "🔊",
		voice_stt: "🎤",
		rro: "🔍",
	};

	const healthColors: Record<string, string> = {
		healthy: "text-green-400",
		degraded: "text-amber-400",
		loading: "text-blue-400",
		error: "text-red-400",
		unknown: "text-gray-400",
	};

	const healthBg: Record<string, string> = {
		healthy: "bg-green-500",
		degraded: "bg-amber-500",
		loading: "bg-blue-500 animate-pulse",
		error: "bg-red-500",
		unknown: "bg-gray-500",
	};

	function getStatusBg(status: LoadState): string {
		switch (status) {
			case "loaded":
				return "bg-green-500/20 border-green-500/30";
			case "loading":
				return "bg-blue-500/20 border-blue-500/30";
			case "failed":
				return "bg-red-500/20 border-red-500/30";
			case "skipped":
				return "bg-gray-500/20 border-gray-500/30";
			default:
				return "bg-white/5 border-white/10";
		}
	}

	function getStatusDot(status: LoadState): string {
		switch (status) {
			case "loaded":
				return "bg-green-500";
			case "loading":
				return "bg-blue-500 animate-pulse";
			case "failed":
				return "bg-red-500";
			case "skipped":
				return "bg-gray-500";
			default:
				return "bg-gray-600";
		}
	}

	function getStatusLabel(status: LoadState): string {
		switch (status) {
			case "loaded":
				return "Ready";
			case "loading":
				return "Loading";
			case "failed":
				return "Failed";
			case "skipped":
				return "Skipped";
			case "not_loaded":
				return "Pending";
			default:
				return "Unknown";
		}
	}
</script>

<div class="glass p-6">
	<!-- Header -->
	<div class="flex items-center justify-between mb-6">
		<div>
			<h2 class="text-lg font-semibold text-white">System Status</h2>
			<p class="text-sm text-gray-500">DevPulse Infrastructure</p>
		</div>
		<div class="flex items-center gap-3">
			<div class="text-right">
				<div class="text-xs text-gray-500">Uptime</div>
				<div class="mono text-sm text-white">
					{backgroundStore.uptime}
				</div>
			</div>
			<div
				class="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5"
			>
				<span
					class="w-2.5 h-2.5 rounded-full {healthBg[
						backgroundStore.health
					]}"
				></span>
				<span
					class="text-sm font-medium {healthColors[
						backgroundStore.health
					]} capitalize"
				>
					{backgroundStore.health}
				</span>
			</div>
		</div>
	</div>

	<!-- Memory Overview -->
	<div class="grid grid-cols-2 gap-4 mb-6">
		<div
			class="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20"
		>
			<div class="text-xs text-gray-400 mb-1">VRAM Usage</div>
			<div class="text-2xl font-bold text-purple-400">
				{formatMemory(backgroundStore.totalVramMb)}
			</div>
		</div>
		<div class="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
			<div class="text-xs text-gray-400 mb-1">RAM Usage</div>
			<div class="text-2xl font-bold text-blue-400">
				{formatMemory(backgroundStore.totalRamMb)}
			</div>
		</div>
	</div>

	<!-- Components Grid -->
	<h3 class="text-sm font-medium text-gray-400 mb-3">Components</h3>
	{#if backgroundStore.components.length === 0}
		<div class="text-center text-gray-500 py-8">
			{#if backgroundStore.loading}
				<div class="animate-pulse">Loading system status...</div>
			{:else}
				No components registered
			{/if}
		</div>
	{:else}
		<div class="grid grid-cols-2 gap-3">
			{#each backgroundStore.components as component (component.id)}
				<div
					class="p-3 rounded-lg border {getStatusBg(
						component.status,
					)} transition-all hover:scale-[1.02]"
				>
					<div class="flex items-start gap-3">
						<!-- Icon -->
						<span class="text-2xl"
							>{componentIcons[component.id] ?? "⚙️"}</span
						>

						<!-- Info -->
						<div class="flex-1 min-w-0">
							<div class="flex items-center gap-2 mb-1">
								<span
									class="text-sm font-medium text-white truncate"
								>
									{component.name}
								</span>
							</div>

							<!-- Status row -->
							<div class="flex items-center gap-2">
								<span
									class="w-1.5 h-1.5 rounded-full {getStatusDot(
										component.status,
									)}"
								></span>
								<span class="text-xs text-gray-400"
									>{getStatusLabel(component.status)}</span
								>
								{#if component.device}
									<span class="text-xs text-blue-400"
										>• {component.device}</span
									>
								{/if}
							</div>

							<!-- Details -->
							{#if component.status === "loaded"}
								<div
									class="flex items-center gap-3 mt-1 text-xs text-gray-500"
								>
									{#if component.memory_mb > 0}
										<span
											>{formatMemory(
												component.memory_mb,
											)}</span
										>
									{/if}
									{#if component.load_time_ms}
										<span
											>{formatLoadTime(
												component.load_time_ms,
											)}</span
										>
									{/if}
								</div>
							{:else if component.status === "failed" && component.error}
								<div
									class="mt-1 text-xs text-red-400 truncate"
									title={component.error}
								>
									{component.error}
								</div>
							{/if}
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}

	<!-- Error display -->
	{#if backgroundStore.error}
		<div
			class="mt-4 p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-sm"
		>
			<div class="font-medium mb-1">Connection Error</div>
			<div class="text-xs">{backgroundStore.error}</div>
		</div>
	{/if}
</div>
