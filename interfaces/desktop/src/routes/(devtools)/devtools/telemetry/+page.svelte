<!--
	@file /devtools/telemetry — OTel Telemetry Devtool
	@route /devtools/telemetry
	@window DevTools (Ctrl+Shift+Z)

	Four-tab telemetry inspector:
	- Overview: lane status summary + quick stats
	- Spans: query + browse span traces from DuckDB
	- Baselines: per-lane percentile stats + regression flags
	- Config: lane toggles, presets, persistence settings
-->
<script lang="ts">
import {
	type Activity,
	ArrowLeft,
	BarChart3,
	Gauge,
	RefreshCw,
	Settings,
	Zap,
} from "lucide-svelte";
import { Button } from "$lib/design/components/button/index.js";
import { Text } from "$lib/design/components/text/index.js";
import type { TelemetryTab } from "$lib/domains/infra/telemetry/index.js";
import {
	formatDurationUs,
	formatRate,
	telemetryState,
} from "$lib/domains/infra/telemetry/index.js";

// ── Tab definitions ─────────────────────────────────────────
const tabs: { id: TelemetryTab; label: string; Icon: typeof Activity }[] = [
	{ id: "overview", label: "Overview", Icon: Gauge },
	{ id: "spans", label: "Spans", Icon: Zap },
	{ id: "baselines", label: "Baselines", Icon: BarChart3 },
	{ id: "config", label: "Config", Icon: Settings },
];

// ── Data loading on tab change ──────────────────────────────
$effect(() => {
	const tab = telemetryState.activeTab;
	if (tab === "overview" || tab === "config") {
		if (!telemetryState.laneConfig && !telemetryState.laneLoading) {
			telemetryState.loadLaneConfig();
		}
	}
	if (tab === "spans") {
		if (telemetryState.spans.length === 0 && !telemetryState.spansLoading) {
			telemetryState.loadSpans(undefined, 50);
		}
	}
	if (tab === "baselines") {
		if (telemetryState.baselines.length === 0 && !telemetryState.baselinesLoading) {
			telemetryState.loadBaselines();
		}
	}
});

// ── Span query ──────────────────────────────────────────────
let traceIdInput = $state("");

function handleSpanQuery(): void {
	const id = traceIdInput.trim() || undefined;
	telemetryState.loadSpans(id, id ? undefined : 50);
}
</script>

<div class="flex flex-col h-full bg-[var(--surface-base)] text-[var(--text-primary)]">
	<!-- ── Header ─────────────────────────────────────────────── -->
	<header class="flex items-center gap-3 h-10 px-4 border-b border-[var(--border-subtle)]">
		<a href="/devtools" class="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
			<ArrowLeft size={14} />
		</a>
		<Activity size={16} class="text-[var(--color-teal-400)]" />
		<Text size="sm" weight="semibold">Telemetry</Text>
		<span class="text-xs text-[var(--text-secondary)]">OTel 0.31 + DuckDB</span>
	</header>

	<!-- ── Tab bar ────────────────────────────────────────────── -->
	<nav class="flex border-b border-[var(--border-subtle)]">
		{#each tabs as tab}
			<button
				class="flex items-center gap-1.5 px-3 py-2 text-xs transition-colors
					{telemetryState.activeTab === tab.id
						? 'text-[var(--color-teal-400)] border-b-2 border-[var(--color-teal-400)]'
						: 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}"
				onclick={() => telemetryState.setTab(tab.id)}
			>
				<tab.Icon size={14} />
				{tab.label}
			</button>
		{/each}
	</nav>

	<!-- ── Tab content ────────────────────────────────────────── -->
	<main class="flex-1 overflow-y-auto p-4">

		<!-- ══════════════ OVERVIEW TAB ══════════════ -->
		{#if telemetryState.activeTab === "overview"}
			{#if telemetryState.laneLoading}
				<Text size="sm" color="muted">Loading lane config...</Text>
			{:else if telemetryState.laneError}
				<div class="p-3 rounded-lg border border-[var(--signal-error)] bg-[var(--surface-raised)]">
					<Text size="sm" color="muted">{telemetryState.laneError}</Text>
				</div>
			{:else if telemetryState.laneConfig}
				<!-- Summary cards -->
				<div class="grid grid-cols-3 gap-3 mb-4">
					<div class="p-3 rounded-lg bg-[var(--surface-raised)] border border-[var(--border-subtle)]">
						<Text size="xs" color="secondary">Active Lanes</Text>
						<div class="text-lg font-semibold mt-1">
							{telemetryState.enabledLaneCount}
							<span class="text-xs text-[var(--text-secondary)] font-normal">
								/ {telemetryState.totalLaneCount}
							</span>
						</div>
					</div>
					<div class="p-3 rounded-lg bg-[var(--surface-raised)] border border-[var(--border-subtle)]">
						<Text size="xs" color="secondary">Verbose</Text>
						<div class="text-lg font-semibold mt-1">
							{telemetryState.laneConfig.verbose ? "ON" : "OFF"}
						</div>
					</div>
					<div class="p-3 rounded-lg bg-[var(--surface-raised)] border border-[var(--border-subtle)]">
						<Text size="xs" color="secondary">DuckDB Persist</Text>
						<div class="text-lg font-semibold mt-1">
							{telemetryState.laneConfig.persist_to_duckdb ? "ON" : "OFF"}
						</div>
					</div>
				</div>

				<!-- Lane groups -->
				{#each telemetryState.laneGroups as group}
					<div class="mb-3">
						<Text size="xs" weight="semibold" color="secondary">{group.label}</Text>
						<div class="mt-1 flex flex-wrap gap-2">
							{#each group.lanes as lane}
								<span
									class="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full
										{lane.enabled
											? 'bg-[var(--color-teal-900)] text-[var(--color-teal-300)] border border-[var(--color-teal-700)]'
											: 'bg-[var(--surface-raised)] text-[var(--text-secondary)] border border-[var(--border-subtle)]'}"
								>
									<span class="w-1.5 h-1.5 rounded-full {lane.enabled ? 'bg-[var(--color-teal-400)]' : 'bg-[var(--text-secondary)]'}"></span>
									{lane.lane}
								</span>
							{/each}
						</div>
					</div>
				{/each}

				<!-- Quick actions -->
				<div class="flex gap-2 mt-4">
					<Button preset="ghost" size="sm" onclick={() => telemetryState.setTab("spans")}>
						Browse Spans
					</Button>
					<Button preset="ghost" size="sm" onclick={() => telemetryState.setTab("baselines")}>
						View Baselines
					</Button>
					<Button preset="ghost" size="sm" onclick={() => telemetryState.setTab("config")}>
						Configure
					</Button>
				</div>
			{:else}
				<Text size="sm" color="muted">No telemetry data available.</Text>
			{/if}

		<!-- ══════════════ SPANS TAB ══════════════ -->
		{:else if telemetryState.activeTab === "spans"}
			<!-- Query bar -->
			<div class="flex items-center gap-2 mb-4">
				<input
					type="text"
					bind:value={traceIdInput}
					placeholder="Trace ID (leave empty for recent)"
					class="flex-1 px-3 py-1.5 text-xs bg-[var(--surface-raised)] border border-[var(--border-subtle)] rounded
						text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]
						focus:outline-none focus:border-[var(--color-teal-600)]"
					onkeydown={(e) => { if (e.key === "Enter") handleSpanQuery(); }}
				/>
				<Button preset="ghost" size="sm" onclick={handleSpanQuery}>
					<RefreshCw size={12} />
					Query
				</Button>
				{#if telemetryState.spans.length > 0}
					<Button preset="ghost" size="sm" onclick={() => telemetryState.clearSpans()}>
						Clear
					</Button>
				{/if}
			</div>

			{#if telemetryState.spansLoading}
				<Text size="sm" color="muted">Querying DuckDB...</Text>
			{:else if telemetryState.spansError}
				<div class="p-3 rounded-lg border border-[var(--signal-error)] bg-[var(--surface-raised)]">
					<Text size="sm" color="muted">{telemetryState.spansError}</Text>
				</div>
			{:else if telemetryState.spans.length === 0}
				<Text size="sm" color="muted">No spans found. Run the app to generate trace data.</Text>
			{:else}
				<!-- Span count -->
				<Text size="xs" color="secondary">{telemetryState.spans.length} spans</Text>

				<!-- Span table -->
				<div class="mt-2 overflow-x-auto">
					<table class="w-full text-xs">
						<thead>
							<tr class="border-b border-[var(--border-subtle)] text-[var(--text-secondary)]">
								<th class="py-1.5 px-2 text-left font-medium">Name</th>
								<th class="py-1.5 px-2 text-left font-medium">Target</th>
								<th class="py-1.5 px-2 text-right font-medium">Duration</th>
								<th class="py-1.5 px-2 text-left font-medium">Level</th>
								<th class="py-1.5 px-2 text-left font-medium">Trace ID</th>
							</tr>
						</thead>
						<tbody>
							{#each telemetryState.spans as span}
								<tr class="border-b border-[var(--border-subtle)] hover:bg-[var(--surface-raised)]">
									<td class="py-1.5 px-2 font-mono">{span.name}</td>
									<td class="py-1.5 px-2 text-[var(--text-secondary)] truncate max-w-[200px]">{span.target}</td>
									<td class="py-1.5 px-2 text-right font-mono
										{span.duration_us > 100_000 ? 'text-[var(--signal-warning)]' : 'text-[var(--text-primary)]'}">
										{formatDurationUs(span.duration_us)}
									</td>
									<td class="py-1.5 px-2">
										<span class="px-1.5 py-0.5 rounded text-[10px] font-medium
											{span.level === 'ERROR' ? 'bg-red-900 text-red-300' :
											 span.level === 'WARN' ? 'bg-amber-900 text-amber-300' :
											 span.level === 'INFO' ? 'bg-teal-900 text-teal-300' :
											 'bg-[var(--surface-raised)] text-[var(--text-secondary)]'}">
											{span.level}
										</span>
									</td>
									<td class="py-1.5 px-2 font-mono text-[var(--text-secondary)] truncate max-w-[120px]">
										<button
											class="hover:text-[var(--color-teal-400)] hover:underline"
											onclick={() => { traceIdInput = span.trace_id; handleSpanQuery(); }}
										>
											{span.trace_id.slice(0, 12)}...
										</button>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}

		<!-- ══════════════ BASELINES TAB ══════════════ -->
		{:else if telemetryState.activeTab === "baselines"}
			<div class="flex items-center justify-between mb-4">
				<Text size="sm" weight="semibold">Lane Baselines</Text>
				<Button preset="ghost" size="sm" onclick={() => telemetryState.loadBaselines()}>
					<RefreshCw size={12} />
					Refresh
				</Button>
			</div>

			{#if telemetryState.baselinesLoading}
				<Text size="sm" color="muted">Querying DuckDB...</Text>
			{:else if telemetryState.baselinesError}
				<div class="p-3 rounded-lg border border-[var(--signal-error)] bg-[var(--surface-raised)]">
					<Text size="sm" color="muted">{telemetryState.baselinesError}</Text>
				</div>
			{:else if telemetryState.baselines.length === 0}
				<Text size="sm" color="muted">No baselines computed. Run inference to generate lane traces.</Text>
			{:else}
				<div class="space-y-3">
					{#each telemetryState.baselines as baseline}
						<div class="p-3 rounded-lg bg-[var(--surface-raised)] border border-[var(--border-subtle)]">
							<div class="flex items-center justify-between mb-2">
								<Text size="sm" weight="semibold">{baseline.lane}</Text>
								<Text size="xs" color="secondary">{baseline.sample_count} samples</Text>
							</div>
							<div class="grid grid-cols-3 gap-4 text-xs">
								<div>
									<span class="text-[var(--text-secondary)]">p50</span>
									<span class="ml-1 font-mono">{formatDurationUs(baseline.p50_us)}</span>
								</div>
								<div>
									<span class="text-[var(--text-secondary)]">p95</span>
									<span class="ml-1 font-mono text-[var(--signal-warning)]">{formatDurationUs(baseline.p95_us)}</span>
								</div>
								<div>
									<span class="text-[var(--text-secondary)]">p99</span>
									<span class="ml-1 font-mono text-[var(--signal-error)]">{formatDurationUs(baseline.p99_us)}</span>
								</div>
							</div>
							<div class="grid grid-cols-3 gap-4 text-xs mt-2 pt-2 border-t border-[var(--border-subtle)]">
								<div>
									<span class="text-[var(--text-secondary)]">Queue wait</span>
									<span class="ml-1 font-mono">{formatDurationUs(baseline.avg_queue_wait_us)}</span>
								</div>
								<div>
									<span class="text-[var(--text-secondary)]">Cache hit</span>
									<span class="ml-1 font-mono">{formatRate(baseline.cache_hit_rate)}</span>
								</div>
								<div>
									<span class="text-[var(--text-secondary)]">Cold start</span>
									<span class="ml-1 font-mono">{formatRate(baseline.cold_start_rate)}</span>
								</div>
							</div>
							<div class="text-[10px] text-[var(--text-secondary)] mt-2">
								Computed: {baseline.computed_at}
							</div>
						</div>
					{/each}
				</div>
			{/if}

		<!-- ══════════════ CONFIG TAB ══════════════ -->
		{:else if telemetryState.activeTab === "config"}
			{#if telemetryState.laneLoading}
				<Text size="sm" color="muted">Loading config...</Text>
			{:else if telemetryState.laneError}
				<div class="p-3 rounded-lg border border-[var(--signal-error)] bg-[var(--surface-raised)]">
					<Text size="sm" color="muted">{telemetryState.laneError}</Text>
				</div>
			{:else if telemetryState.laneConfig}
				<!-- Presets -->
				<div class="mb-4">
					<Text size="xs" weight="semibold" color="secondary">Presets</Text>
					<div class="flex items-center gap-2 mt-2">
						<button
							class="px-3 py-1.5 text-xs rounded bg-[var(--surface-raised)] border border-[var(--border-subtle)] hover:border-[var(--color-teal-600)] transition-colors"
							onclick={() => telemetryState.applyPreset("off")}
						>Off</button>
						<button
							class="px-3 py-1.5 text-xs rounded bg-[var(--surface-raised)] border border-[var(--border-subtle)] hover:border-[var(--color-teal-600)] transition-colors"
							onclick={() => telemetryState.applyPreset("standard")}
						>Standard</button>
						<button
							class="px-3 py-1.5 text-xs rounded bg-[var(--surface-raised)] border border-[var(--border-subtle)] hover:border-[var(--color-teal-600)] transition-colors"
							onclick={() => telemetryState.applyPreset("debug")}
						>Debug</button>
					</div>
				</div>

				<!-- Global toggles -->
				<div class="mb-4 p-3 rounded-lg bg-[var(--surface-raised)] border border-[var(--border-subtle)]">
					<Text size="xs" weight="semibold" color="secondary">Global Settings</Text>
					<div class="mt-2 space-y-2">
						<label class="flex items-center justify-between">
							<span class="text-xs">Verbose logging (input/output capture)</span>
							<input
								type="checkbox"
								checked={telemetryState.laneConfig.verbose}
								onchange={() => telemetryState.setVerbose(!telemetryState.laneConfig!.verbose)}
								class="accent-[var(--color-teal-400)]"
							/>
						</label>
						<label class="flex items-center justify-between">
							<span class="text-xs">Persist to DuckDB</span>
							<input
								type="checkbox"
								checked={telemetryState.laneConfig.persist_to_duckdb}
								onchange={() => telemetryState.setPersist(!telemetryState.laneConfig!.persist_to_duckdb)}
								class="accent-[var(--color-teal-400)]"
							/>
						</label>
					</div>
				</div>

				<!-- Per-lane toggles -->
				{#each telemetryState.laneGroups as group}
					<div class="mb-4">
						<Text size="xs" weight="semibold" color="secondary">{group.label}</Text>
						<div class="mt-1 space-y-1">
							{#each group.lanes as lane}
								<label class="flex items-center justify-between px-2 py-1.5 rounded hover:bg-[var(--surface-raised)] cursor-pointer">
									<span class="text-xs font-mono">{lane.lane}</span>
									<input
										type="checkbox"
										checked={lane.enabled}
										onchange={() => telemetryState.toggleLane(lane.lane)}
										class="accent-[var(--color-teal-400)]"
									/>
								</label>
							{/each}
						</div>
					</div>
				{/each}
			{:else}
				<Text size="sm" color="muted">Telemetry not available.</Text>
			{/if}
		{/if}
	</main>
</div>
