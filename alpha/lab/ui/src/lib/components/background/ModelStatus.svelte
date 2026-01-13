<script lang="ts">
	import { backgroundStore } from "$lib/stores/background.svelte";
	import {
		formatMemory,
		formatLoadTime,
		getStatusBadgeClass,
		type LoadState,
	} from "$lib/api/background";

	const typeIcons: Record<string, string> = {
		llm: "🧠",
		embedder: "📊",
		reranker: "⚖️",
		voice_tts: "🔊",
		voice_stt: "🎤",
	};

	function getStatusColor(status: LoadState): string {
		switch (status) {
			case "loaded":
				return "bg-green-500";
			case "loading":
				return "bg-amber-500 animate-pulse";
			case "failed":
				return "bg-red-500";
			case "skipped":
				return "bg-gray-500";
			default:
				return "bg-gray-600";
		}
	}

	function getStatusText(status: LoadState): string {
		switch (status) {
			case "loaded":
				return "Loaded";
			case "loading":
				return "Loading...";
			case "failed":
				return "Failed";
			case "skipped":
				return "Skipped";
			case "not_loaded":
				return "Not Loaded";
			default:
				return "Unknown";
		}
	}
</script>

<div class="glass p-4">
	<div class="flex items-center justify-between mb-3">
		<h3 class="text-sm font-medium text-gray-400">Models</h3>
		<div class="flex items-center gap-2 text-xs">
			<span
				class="w-2 h-2 rounded-full {backgroundStore.health ===
				'healthy'
					? 'bg-green-500'
					: backgroundStore.health === 'loading'
						? 'bg-amber-500 animate-pulse'
						: 'bg-red-500'}"
			></span>
			<span class="text-gray-500">{backgroundStore.health}</span>
		</div>
	</div>

	{#if backgroundStore.models.length === 0}
		<div class="text-center text-gray-500 py-4">
			{#if backgroundStore.loading}
				<div class="animate-pulse">Loading models...</div>
			{:else}
				No models registered
			{/if}
		</div>
	{:else}
		<div class="space-y-2">
			{#each backgroundStore.models as model (model.name)}
				<div
					class="flex items-center gap-3 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
				>
					<!-- Status indicator -->
					<div
						class="w-2 h-2 rounded-full {getStatusColor(
							model.status,
						)}"
					></div>

					<!-- Icon -->
					<span class="text-lg"
						>{typeIcons[
							model.name.toLowerCase().includes("embed")
								? "embedder"
								: model.name.toLowerCase().includes("rerank")
									? "reranker"
									: model.name
												.toLowerCase()
												.includes("llm") ||
										  model.name
												.toLowerCase()
												.includes("vl")
										? "llm"
										: model.name
													.toLowerCase()
													.includes("tts")
											? "voice_tts"
											: model.name
														.toLowerCase()
														.includes("whisper") ||
												  model.name
														.toLowerCase()
														.includes("stt")
												? "voice_stt"
												: "llm"
						]}</span
					>

					<!-- Model info -->
					<div class="flex-1 min-w-0">
						<div class="flex items-center gap-2">
							<span class="text-sm text-white truncate"
								>{model.name}</span
							>
						</div>
						<div
							class="flex items-center gap-2 text-xs text-gray-500"
						>
							<span>{getStatusText(model.status)}</span>
							{#if model.device}
								<span class="text-blue-400"
									>• {model.device}</span
								>
							{/if}
							{#if model.load_time_ms}
								<span
									>• {formatLoadTime(
										model.load_time_ms,
									)}</span
								>
							{/if}
						</div>
					</div>

					<!-- Memory -->
					{#if model.loaded && model.memory_mb > 0}
						<span class="mono text-xs text-accent-purple">
							{formatMemory(model.memory_mb)}
						</span>
					{:else if model.status === "failed"}
						<span
							class="text-xs text-red-400"
							title={model.error ?? "Unknown error"}>Error</span
						>
					{:else}
						<span class="text-xs text-gray-600">-</span>
					{/if}
				</div>
			{/each}
		</div>

		<!-- Memory Summary -->
		<div class="mt-3 pt-3 border-t border-white/10 space-y-1">
			<div class="flex justify-between text-sm">
				<span class="text-gray-400">VRAM Usage</span>
				<span class="mono text-accent-purple">
					{formatMemory(backgroundStore.totalVramMb)}
				</span>
			</div>
			<div class="flex justify-between text-sm">
				<span class="text-gray-400">RAM Usage</span>
				<span class="mono text-accent-blue">
					{formatMemory(backgroundStore.totalRamMb)}
				</span>
			</div>
		</div>
	{/if}

	<!-- Error display -->
	{#if backgroundStore.error}
		<div
			class="mt-3 p-2 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-xs"
		>
			{backgroundStore.error}
		</div>
	{/if}
</div>
