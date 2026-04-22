<!--
	@file /devtools/telemetry - Telemetry Devtool
	@route /devtools/telemetry
	@window DevTools (Ctrl+Shift+Z)

	Developer-facing telemetry control surface.
	Layman names for lanes, ColdLight presets for visuals.
-->
<script lang="ts">
import { Activity, ArrowLeft, BarChart3, Gauge, RefreshCw, Settings, Zap } from "lucide-svelte";
import { Badge } from "$lib/design/components/badge/index.js";
import { Button } from "$lib/design/components/button/index.js";
import { Callout } from "$lib/design/components/callout/index.js";
import { Card } from "$lib/design/components/card/index.js";
import { Spinner } from "$lib/design/components/spinner/index.js";
import { Stat } from "$lib/design/components/stat/index.js";
import { StatusDot } from "$lib/design/components/status-dot/index.js";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "$lib/design/components/tabs/index.js";
import { Text } from "$lib/design/components/text/index.js";
import {
	formatDurationUs,
	formatRate,
	laneBlurb,
	laneLabel,
	telemetryState,
} from "$lib/domains/infra/telemetry/index.js";

// ── Data loading on tab change ──────────────────────────────
$effect(() => {
	const tab = telemetryState.activeTab;
	if (tab === "overview" || tab === "config") {
		if (!telemetryState.laneConfig && !telemetryState.laneLoading) {
			telemetryState.loadLaneConfig();
		}
	}
	if (tab === "spans" && telemetryState.spans.length === 0 && !telemetryState.spansLoading) {
		telemetryState.loadSpans(undefined, 50);
	}
	if (
		tab === "baselines" &&
		telemetryState.baselines.length === 0 &&
		!telemetryState.baselinesLoading
	) {
		telemetryState.loadBaselines();
	}
});

// ── Span query ──────────────────────────────────────────────
let traceIdInput = $state("");

function handleSpanQuery(): void {
	const id = traceIdInput.trim() || undefined;
	telemetryState.loadSpans(id, id ? undefined : 50);
}

function levelVariant(level: string): "negative" | "notice" | "accent" | "neutral" {
	if (level === "ERROR") return "negative";
	if (level === "WARN") return "notice";
	if (level === "INFO") return "accent";
	return "neutral";
}
</script>

<div class="flex flex-col h-full">
	<!-- Header -->
	<header class="flex items-center gap-3 h-10 px-4 border-b border-[var(--border-subtle)]">
		<a href="/devtools" class="hover:text-[var(--color-teal-400)]">
			<ArrowLeft size={14} />
		</a>
		<Activity size={16} class="text-[var(--color-teal-400)]" />
		<Text size="sm" weight="semibold">Telemetry</Text>
		<Text size="xs">What the platform is doing, right now.</Text>
	</header>

	<!-- Tabs -->
	<Tabs value={telemetryState.activeTab} onValueChange={(v) => telemetryState.setTab(v as typeof telemetryState.activeTab)} preset="default">
		<TabsList class="flex border-b border-[var(--border-subtle)]">
			<TabsTrigger value="overview" class="flex items-center gap-1.5 px-3 py-2 text-xs">
				<Gauge size={14} /> Overview
			</TabsTrigger>
			<TabsTrigger value="spans" class="flex items-center gap-1.5 px-3 py-2 text-xs">
				<Zap size={14} /> Recent Activity
			</TabsTrigger>
			<TabsTrigger value="baselines" class="flex items-center gap-1.5 px-3 py-2 text-xs">
				<BarChart3 size={14} /> Performance
			</TabsTrigger>
			<TabsTrigger value="config" class="flex items-center gap-1.5 px-3 py-2 text-xs">
				<Settings size={14} /> Settings
			</TabsTrigger>
		</TabsList>

		<!-- ═══════ OVERVIEW ═══════ -->
		<TabsContent value="overview" class="flex-1 overflow-y-auto p-4 space-y-4">
			{#if telemetryState.laneLoading}
				<Spinner size="md" tone="accent" label="Loading..." />
			{:else if telemetryState.laneError}
				<Callout variant="error">{telemetryState.laneError}</Callout>
			{:else if telemetryState.laneConfig}
				<!-- Summary stats -->
				<div class="grid grid-cols-3 gap-3">
					<Card preset="glass">
						<Stat
							label="Watched"
							value={telemetryState.enabledLaneCount}
							unit={`/ ${telemetryState.totalLaneCount}`}
							accent="teal"
							size="md"
						/>
					</Card>
					<Card preset="glass">
						<Stat
							label="Verbose logging"
							value={telemetryState.laneConfig.verbose ? "On" : "Off"}
							accent={telemetryState.laneConfig.verbose ? "ember" : "frost"}
							size="md"
						/>
					</Card>
					<Card preset="glass">
						<Stat
							label="Recording history"
							value={telemetryState.laneConfig.persist_to_duckdb ? "On" : "Off"}
							accent={telemetryState.laneConfig.persist_to_duckdb ? "teal" : "frost"}
							size="md"
						/>
					</Card>
				</div>

				<!-- Lane groups -->
				{#each telemetryState.laneGroups as group}
					<div>
						<Text size="sm" weight="semibold">{group.label}</Text>
						<div class="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
							{#each group.lanes as lane}
								<Card preset={lane.enabled ? "glass" : "flat"}>
									<div class="flex items-start gap-2 p-2">
										<StatusDot status={lane.enabled ? "online" : "offline"} size="sm" glow={lane.enabled} />
										<div class="flex-1 min-w-0">
											<Text size="sm" weight="medium">{laneLabel(lane.lane)}</Text>
											<Text size="xs">{laneBlurb(lane.lane)}</Text>
										</div>
									</div>
								</Card>
							{/each}
						</div>
					</div>
				{/each}

				<!-- Quick actions -->
				<div class="flex gap-2 pt-2">
					<Button preset="primary" size="sm" onclick={() => telemetryState.setTab("spans")}>
						See what's happening
					</Button>
					<Button preset="ghost" size="sm" onclick={() => telemetryState.setTab("baselines")}>
						Performance
					</Button>
					<Button preset="ghost" size="sm" onclick={() => telemetryState.setTab("config")}>
						Settings
					</Button>
				</div>
			{/if}
		</TabsContent>

		<!-- ═══════ RECENT ACTIVITY (SPANS) ═══════ -->
		<TabsContent value="spans" class="flex-1 overflow-y-auto p-4 space-y-4">
			<div class="flex items-center gap-2">
				<input
					type="text"
					bind:value={traceIdInput}
					placeholder="Trace ID (leave empty for most recent)"
					class="flex-1 px-3 py-1.5 text-xs bg-[var(--surface-raised)] border border-[var(--border-subtle)] rounded
						focus:outline-none focus:border-[var(--color-teal-600)]"
					onkeydown={(e) => { if (e.key === "Enter") handleSpanQuery(); }}
				/>
				<Button preset="primary" size="sm" onclick={handleSpanQuery}>
					{#if telemetryState.spansLoading}<Spinner size="xs" tone="accent" />{:else}<RefreshCw size={12} />{/if}
					Load
				</Button>
				{#if telemetryState.spans.length > 0}
					<Button preset="ghost" size="sm" onclick={() => telemetryState.clearSpans()}>Clear</Button>
				{/if}
			</div>

			{#if telemetryState.spansLoading}
				<Spinner size="md" tone="accent" label="Reading history..." />
			{:else if telemetryState.spansError}
				<Callout variant="error">{telemetryState.spansError}</Callout>
			{:else if telemetryState.spans.length === 0}
				<Callout variant="info">
					Nothing recorded yet. Use the app for a moment, then come back.
				</Callout>
			{:else}
				<Text size="xs">{telemetryState.spans.length} events</Text>
				<Card preset="flat">
					<table class="w-full text-xs">
						<thead>
							<tr class="border-b border-[var(--border-subtle)]">
								<th class="py-2 px-3 text-left font-medium">What</th>
								<th class="py-2 px-3 text-right font-medium">How long</th>
								<th class="py-2 px-3 text-left font-medium">Level</th>
								<th class="py-2 px-3 text-left font-medium">Trace</th>
							</tr>
						</thead>
						<tbody>
							{#each telemetryState.spans as span}
								<tr class="border-b border-[var(--border-subtle)] hover:bg-[var(--surface-raised)]">
									<td class="py-2 px-3">
										<div class="font-medium">{span.name}</div>
										<div class="text-[10px] opacity-60">{span.target}</div>
									</td>
									<td class="py-2 px-3 text-right font-mono">
										{formatDurationUs(span.duration_us)}
									</td>
									<td class="py-2 px-3">
										<Badge variant={levelVariant(span.level)} size="sm" fillStyle="subtle">
											{span.level}
										</Badge>
									</td>
									<td class="py-2 px-3">
										<button
											class="font-mono text-[10px] hover:text-[var(--color-teal-400)] hover:underline"
											onclick={() => { traceIdInput = span.trace_id; handleSpanQuery(); }}
										>
											{span.trace_id.slice(0, 10)}...
										</button>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</Card>
			{/if}
		</TabsContent>

		<!-- ═══════ PERFORMANCE (BASELINES) ═══════ -->
		<TabsContent value="baselines" class="flex-1 overflow-y-auto p-4 space-y-4">
			<div class="flex items-center justify-between">
				<Text size="sm" weight="semibold">How each part performs</Text>
				<Button preset="ghost" size="sm" onclick={() => telemetryState.loadBaselines()}>
					{#if telemetryState.baselinesLoading}<Spinner size="xs" tone="accent" />{:else}<RefreshCw size={12} />{/if}
					Refresh
				</Button>
			</div>

			{#if telemetryState.baselinesLoading}
				<Spinner size="md" tone="accent" label="Crunching numbers..." />
			{:else if telemetryState.baselinesError}
				<Callout variant="error">{telemetryState.baselinesError}</Callout>
			{:else if telemetryState.baselines.length === 0}
				<Callout variant="info">
					Not enough usage yet to calculate performance baselines. Keep using the app.
				</Callout>
			{:else}
				<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
					{#each telemetryState.baselines as baseline}
						<Card preset="glass">
							<div class="p-3 space-y-2">
								<div class="flex items-center justify-between">
									<Text size="sm" weight="semibold">{laneLabel(baseline.lane)}</Text>
									<Badge variant="neutral" size="sm" fillStyle="subtle">
										{baseline.sample_count} samples
									</Badge>
								</div>
								<Text size="xs">{laneBlurb(baseline.lane)}</Text>

								<div class="grid grid-cols-3 gap-2 pt-2 border-t border-[var(--border-subtle)]">
									<Stat label="Typical" value={formatDurationUs(baseline.p50_us)} size="sm" accent="teal" />
									<Stat label="Slow 5%" value={formatDurationUs(baseline.p95_us)} size="sm" accent="ember" />
									<Stat label="Slowest 1%" value={formatDurationUs(baseline.p99_us)} size="sm" accent="magenta" />
								</div>

								<div class="grid grid-cols-2 gap-2 text-xs pt-1">
									<div>
										<Text size="xs">Cache hit rate</Text>
										<div class="font-mono">{formatRate(baseline.cache_hit_rate)}</div>
									</div>
									<div>
										<Text size="xs">Cold-start rate</Text>
										<div class="font-mono">{formatRate(baseline.cold_start_rate)}</div>
									</div>
								</div>
							</div>
						</Card>
					{/each}
				</div>
			{/if}
		</TabsContent>

		<!-- ═══════ SETTINGS (CONFIG) ═══════ -->
		<TabsContent value="config" class="flex-1 overflow-y-auto p-4 space-y-4">
			{#if telemetryState.laneLoading}
				<Spinner size="md" tone="accent" label="Loading settings..." />
			{:else if telemetryState.laneError}
				<Callout variant="error">{telemetryState.laneError}</Callout>
			{:else if telemetryState.laneConfig}
				<!-- Quick presets -->
				<Card preset="glass">
					<div class="p-3 space-y-2">
						<Text size="sm" weight="semibold">Quick presets</Text>
						<Text size="xs">Pick how much detail to record.</Text>
						<div class="flex items-center gap-2 pt-1">
							<Button preset="ghost" size="sm" onclick={() => telemetryState.applyPreset("off")}>
								Off
							</Button>
							<Button preset="primary" size="sm" onclick={() => telemetryState.applyPreset("standard")}>
								Standard
							</Button>
							<Button preset="ghost" size="sm" onclick={() => telemetryState.applyPreset("debug")}>
								Debug (everything)
							</Button>
						</div>
					</div>
				</Card>

				<!-- Global toggles -->
				<Card preset="glass">
					<div class="p-3 space-y-2">
						<Text size="sm" weight="semibold">Recording options</Text>
						<label class="flex items-center justify-between py-1">
							<div>
								<Text size="sm">Verbose logging</Text>
								<Text size="xs">Also record inputs + outputs (costs disk space).</Text>
							</div>
							<input
								type="checkbox"
								checked={telemetryState.laneConfig.verbose}
								onchange={() => telemetryState.setVerbose(!telemetryState.laneConfig!.verbose)}
								class="accent-[var(--color-teal-400)]"
							/>
						</label>
						<label class="flex items-center justify-between py-1">
							<div>
								<Text size="sm">Keep history</Text>
								<Text size="xs">Save traces so you can review them later.</Text>
							</div>
							<input
								type="checkbox"
								checked={telemetryState.laneConfig.persist_to_duckdb}
								onchange={() => telemetryState.setPersist(!telemetryState.laneConfig!.persist_to_duckdb)}
								class="accent-[var(--color-teal-400)]"
							/>
						</label>
					</div>
				</Card>

				<!-- Per-lane toggles, grouped -->
				{#each telemetryState.laneGroups as group}
					<Card preset="glass">
						<div class="p-3 space-y-1">
							<Text size="sm" weight="semibold">{group.label}</Text>
							{#each group.lanes as lane}
								<label class="flex items-center justify-between py-1.5 cursor-pointer hover:bg-[var(--surface-raised)] rounded px-2">
									<div class="flex items-center gap-2 min-w-0">
										<StatusDot status={lane.enabled ? "online" : "offline"} size="sm" />
										<div class="min-w-0">
											<Text size="sm">{laneLabel(lane.lane)}</Text>
											<Text size="xs">{laneBlurb(lane.lane)}</Text>
										</div>
									</div>
									<input
										type="checkbox"
										checked={lane.enabled}
										onchange={() => telemetryState.toggleLane(lane.lane)}
										class="accent-[var(--color-teal-400)]"
									/>
								</label>
							{/each}
						</div>
					</Card>
				{/each}
			{/if}
		</TabsContent>
	</Tabs>
</div>
