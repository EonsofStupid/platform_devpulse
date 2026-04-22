<!--
	@file /devtools/telemetry - Telemetry devtool
	@route /devtools/telemetry
	@window DevTools (Ctrl+Shift+Z)

	Layman-friendly control panel for the full OTel pipeline:
	- Status: exporter health, storage location, session files, rows recorded
	- Config: what gets recorded (lanes, verbose, history), quick presets
	- Logs: recent activity feed (DuckDB span_traces, live)
	- Actions: reveal folder, reload data, clear view
	- Activity: richer span browser (extra tab)
	- Performance: per-lane percentile baselines (extra tab)

	Every number on this page is read live from Rust. No mocks. No placeholders.
-->
<script lang="ts">
import { Activity, BarChart3, Folder, Gauge, RefreshCw, Zap } from "lucide-svelte";
import { Badge } from "$lib/design/components/badge/index.js";
import { Button } from "$lib/design/components/button/index.js";
import { Callout } from "$lib/design/components/callout/index.js";
import { Card } from "$lib/design/components/card/index.js";
import { Spinner } from "$lib/design/components/spinner/index.js";
import { Stat } from "$lib/design/components/stat/index.js";
import { StatusDot } from "$lib/design/components/status-dot/index.js";
import { Text } from "$lib/design/components/text/index.js";
import {
	formatBytes,
	formatDurationUs,
	formatRate,
	formatTimestamp,
	formatUptime,
	laneBlurb,
	laneLabel,
	telemetryState,
} from "$lib/domains/infra/telemetry/index.js";
import {
	type ExtraTab,
	type HealthBadge,
	ServiceDevtoolShell,
} from "$lib/domains/platform/index.js";

// ── Extra tabs (per-service) ────────────────────────────────
const extraTabs: ExtraTab[] = [
	{ id: "activity", label: "Activity", Icon: Zap },
	{ id: "performance", label: "Performance", Icon: BarChart3 },
];

// ── Auto-load on mount ──────────────────────────────────────
$effect(() => {
	if (!telemetryState.pipeline && !telemetryState.pipelineLoading) {
		telemetryState.refreshStatus();
	}
	if (!telemetryState.laneConfig && !telemetryState.laneLoading) {
		telemetryState.loadLaneConfig();
	}
});

// Live uptime tick — updates every second so the Status panel feels alive.
let now = $state(Date.now());
$effect(() => {
	const id = setInterval(() => {
		now = Date.now();
	}, 1000);
	return () => clearInterval(id);
});

const uptimeMs = $derived(
	telemetryState.pipeline ? now - Number(telemetryState.pipeline.started_at_ms) : 0,
);

// Health badge for the shell header.
const badge = $derived<HealthBadge>(
	telemetryState.pipelineLoading
		? { state: "starting", label: "Checking..." }
		: telemetryState.pipelineError
			? { state: "down", label: "Telemetry unavailable" }
			: telemetryState.pipeline?.exporter_installed
				? { state: "up", label: "Recording" }
				: telemetryState.pipeline
					? { state: "starting", label: "Warming up" }
					: { state: "unknown", label: "Not checked yet" },
);

// ── Span query (logs tab) ──────────────────────────────────
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

// Load activity spans when the activity tab becomes visible (first visit).
$effect(() => {
	if (telemetryState.spans.length === 0 && !telemetryState.spansLoading) {
		// Kick a recent load so Activity tab has data on first open.
		telemetryState.loadSpans(undefined, 50);
	}
});

// Load baselines lazily too.
$effect(() => {
	if (telemetryState.baselines.length === 0 && !telemetryState.baselinesLoading) {
		telemetryState.loadBaselines();
	}
});
</script>

<ServiceDevtoolShell
	title="Telemetry"
	description="OTel pipeline — traces, spans, baselines"
	icon={Activity}
	axis="runtime"
	health={badge}
	{extraTabs}
>
	<!-- ══════════════════ STATUS ══════════════════ -->
	{#snippet status()}
		<div class="space-y-4">
			{#if telemetryState.pipelineLoading && !telemetryState.pipeline}
				<Spinner size="md" tone="accent" label="Reading pipeline state..." />
			{:else if telemetryState.pipelineError}
				<Callout variant="error">{telemetryState.pipelineError}</Callout>
			{:else if telemetryState.pipeline}
				<!-- Top row: identity + exporter state -->
				<div class="flex items-center justify-between">
					<Text size="sm" weight="semibold">Pipeline</Text>
					<Button
						preset="ghost"
						size="sm"
						onclick={() => telemetryState.refreshStatus()}
						disabled={telemetryState.pipelineLoading}
					>
						{#if telemetryState.pipelineLoading}
							<Spinner size="xs" tone="accent" />
						{:else}
							<RefreshCw size={14} />
						{/if}
						Refresh
					</Button>
				</div>

				<div class="grid grid-cols-1 md:grid-cols-3 gap-3">
					<Card preset="glass">
						<div class="p-3 space-y-1">
							<Text size="xs" weight="semibold">Recording</Text>
							<div class="flex items-center gap-2">
								<StatusDot
									status={telemetryState.pipeline.exporter_installed ? "online" : "starting"}
									size="sm"
									glow={telemetryState.pipeline.exporter_installed}
								/>
								<Text size="sm" weight="medium">
									{telemetryState.pipeline.exporter_installed ? "Yes" : "Warming up"}
								</Text>
							</div>
							<Text size="xs">
								{telemetryState.pipeline.exporter_installed
									? "Traces are being saved to disk."
									: "Spans are held in memory until the exporter finishes starting."}
							</Text>
						</div>
					</Card>

					<Card preset="glass">
						<Stat
							label="Uptime"
							value={formatUptime(uptimeMs)}
							accent="teal"
							size="md"
						/>
					</Card>

					<Card preset="glass">
						<Stat
							label="Watched lanes"
							value={telemetryState.enabledLaneCount}
							unit={`/ ${telemetryState.totalLaneCount}`}
							accent="teal"
							size="md"
						/>
					</Card>
				</div>

				<!-- Service identity -->
				<Card preset="glass">
					<div class="p-3 space-y-2">
						<Text size="sm" weight="semibold">Service identity</Text>
						<div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
							<div class="flex justify-between">
								<Text size="xs">Version</Text>
								<span class="font-mono">{telemetryState.pipeline.service_version}</span>
							</div>
							<div class="flex justify-between">
								<Text size="xs">Session id</Text>
								<span class="font-mono text-[10px] truncate max-w-[200px]">
									{telemetryState.pipeline.session_id}
								</span>
							</div>
							<div class="flex justify-between">
								<Text size="xs">Started</Text>
								<span class="font-mono text-[10px]">
									{formatTimestamp(Number(telemetryState.pipeline.started_at_ms))}
								</span>
							</div>
							<div class="flex justify-between">
								<Text size="xs">Exporter installed</Text>
								<span class="font-mono text-[10px]">
									{telemetryState.pipeline.exporter_installed_at_ms
										? formatTimestamp(Number(telemetryState.pipeline.exporter_installed_at_ms))
										: "—"}
								</span>
							</div>
						</div>
					</div>
				</Card>

				<!-- Storage -->
				<Card preset="glass">
					<div class="p-3 space-y-2">
						<div class="flex items-center justify-between">
							<Text size="sm" weight="semibold">Storage</Text>
							<Button preset="ghost" size="sm" onclick={() => telemetryState.revealFolder()}>
								<Folder size={14} />
								Reveal
							</Button>
						</div>

						{#if telemetryState.pipeline.telemetry_dir}
							<div class="flex justify-between text-xs">
								<Text size="xs">Folder</Text>
								<span class="font-mono text-[10px] truncate max-w-[360px]">
									{telemetryState.pipeline.telemetry_dir}
								</span>
							</div>
						{/if}
						{#if telemetryState.pipeline.current_session_file}
							<div class="flex justify-between text-xs">
								<Text size="xs">Current file</Text>
								<span class="font-mono text-[10px] truncate max-w-[360px]">
									{telemetryState.pipeline.current_session_file}
								</span>
							</div>
						{/if}
						{#if telemetryState.pipeline.keep_sessions != null}
							<div class="flex justify-between text-xs">
								<Text size="xs">Keep last</Text>
								<Badge variant="neutral" size="sm" fillStyle="subtle">
									{telemetryState.pipeline.keep_sessions} sessions
								</Badge>
							</div>
						{/if}
						<div class="flex justify-between text-xs">
							<Text size="xs">Disk usage</Text>
							<span class="font-mono">{formatBytes(telemetryState.totalSessionBytes)}</span>
						</div>
					</div>
				</Card>

				<!-- DuckDB stats -->
				{#if telemetryState.rowCounts}
					<Card preset="glass">
						<div class="p-3 space-y-2">
							<Text size="sm" weight="semibold">Recorded to database</Text>
							<div class="grid grid-cols-3 gap-3">
								<Stat
									label="Events"
									value={Number(telemetryState.rowCounts.span_traces).toLocaleString()}
									size="sm"
									accent="teal"
								/>
								<Stat
									label="Lane runs"
									value={Number(telemetryState.rowCounts.lane_traces).toLocaleString()}
									size="sm"
									accent="teal"
								/>
								<Stat
									label="Baselines"
									value={Number(telemetryState.rowCounts.lane_baselines).toLocaleString()}
									size="sm"
									accent="teal"
								/>
							</div>
						</div>
					</Card>
				{/if}

				<!-- Session files -->
				<Card preset="glass">
					<div class="p-3 space-y-2">
						<div class="flex items-center justify-between">
							<Text size="sm" weight="semibold">Session files</Text>
							<Button
								preset="ghost"
								size="sm"
								onclick={() => telemetryState.loadSessions()}
								disabled={telemetryState.sessionsLoading}
							>
								{#if telemetryState.sessionsLoading}
									<Spinner size="xs" tone="accent" />
								{:else}
									<RefreshCw size={14} />
								{/if}
								Reload
							</Button>
						</div>

						{#if telemetryState.sessionsError}
							<Callout variant="error">{telemetryState.sessionsError}</Callout>
						{:else if telemetryState.sessions.length === 0}
							<Text size="xs">
								No files yet. They appear once the exporter writes its first batch.
							</Text>
						{:else}
							<table class="w-full text-xs">
								<thead>
									<tr class="border-b border-[var(--border-subtle)]">
										<th class="text-left py-1.5">File</th>
										<th class="text-right py-1.5">Size</th>
										<th class="text-left py-1.5">Modified</th>
										<th class="text-right py-1.5">State</th>
									</tr>
								</thead>
								<tbody>
									{#each telemetryState.sessions as file}
										<tr class="border-b border-[var(--border-subtle)]">
											<td class="py-1.5 font-mono text-[10px] truncate max-w-[260px]">
												{file.name}
											</td>
											<td class="py-1.5 text-right font-mono">
												{formatBytes(Number(file.size_bytes))}
											</td>
											<td class="py-1.5 text-[10px]">
												{formatTimestamp(Number(file.modified_ms))}
											</td>
											<td class="py-1.5 text-right">
												{#if file.is_current}
													<Badge variant="positive" size="sm" fillStyle="subtle">Live</Badge>
												{:else}
													<Badge variant="neutral" size="sm" fillStyle="subtle">Rotated</Badge>
												{/if}
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						{/if}
					</div>
				</Card>
			{/if}
		</div>
	{/snippet}

	<!-- ══════════════════ CONFIG ══════════════════ -->
	{#snippet config()}
		<div class="space-y-4">
			{#if telemetryState.laneLoading && !telemetryState.laneConfig}
				<Spinner size="md" tone="accent" label="Loading..." />
			{:else if telemetryState.laneError}
				<Callout variant="error">{telemetryState.laneError}</Callout>
			{:else if telemetryState.laneConfig}
				<!-- Quick presets -->
				<Card preset="glass">
					<div class="p-3 space-y-2">
						<Text size="sm" weight="semibold">Quick presets</Text>
						<Text size="xs">
							Pick how much detail to record. "Standard" is good for most sessions.
						</Text>
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

				<!-- Global toggles — GUARDRAILED -->
				<Card preset="glass">
					<div class="p-3 space-y-3">
						<Text size="sm" weight="semibold">Recording options</Text>

						<label class="flex items-start justify-between gap-3 py-1">
							<div class="min-w-0">
								<Text size="sm">Verbose logging</Text>
								<Text size="xs">
									Also saves inputs + outputs. Helpful for debugging but uses more disk.
								</Text>
							</div>
							<input
								type="checkbox"
								checked={telemetryState.laneConfig.verbose}
								onchange={() => telemetryState.setVerbose(!telemetryState.laneConfig!.verbose)}
								class="accent-[var(--color-teal-400)] mt-1"
							/>
						</label>

						{#if telemetryState.laneConfig.verbose}
							<Callout variant="warning">
								Verbose mode records the actual content of prompts and replies.
								Only leave it on while you're debugging.
							</Callout>
						{/if}

						<label class="flex items-start justify-between gap-3 py-1">
							<div class="min-w-0">
								<Text size="sm">Keep history</Text>
								<Text size="xs">
									Save traces so you can review the Activity and Performance tabs later.
								</Text>
							</div>
							<input
								type="checkbox"
								checked={telemetryState.laneConfig.persist_to_duckdb}
								onchange={() => telemetryState.setPersist(!telemetryState.laneConfig!.persist_to_duckdb)}
								class="accent-[var(--color-teal-400)] mt-1"
							/>
						</label>

						{#if !telemetryState.laneConfig.persist_to_duckdb}
							<Callout variant="info">
								History is off. The Activity and Performance tabs won't fill up
								until you turn this back on.
							</Callout>
						{/if}
					</div>
				</Card>

				<!-- Per-lane toggles, grouped -->
				{#each telemetryState.laneGroups as group}
					<Card preset="glass">
						<div class="p-3 space-y-1">
							<Text size="sm" weight="semibold">{group.label}</Text>
							{#each group.lanes as lane}
								<label class="flex items-center justify-between gap-3 py-1.5 cursor-pointer hover:bg-[var(--surface-raised)] rounded px-2">
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
		</div>
	{/snippet}

	<!-- ══════════════════ LOGS ══════════════════ -->
	{#snippet logs()}
		<div class="space-y-3">
			<div class="flex items-center gap-2">
				<input
					type="text"
					bind:value={traceIdInput}
					placeholder="Trace ID (leave empty for most recent)"
					class="flex-1 px-3 py-1.5 text-xs bg-[var(--surface-raised)] border border-[var(--border-subtle)] rounded
						focus:outline-none focus:border-[var(--color-teal-600)]"
					onkeydown={(e) => {
						if (e.key === "Enter") handleSpanQuery();
					}}
				/>
				<Button preset="primary" size="sm" onclick={handleSpanQuery}>
					{#if telemetryState.spansLoading}<Spinner size="xs" tone="accent" />{:else}<RefreshCw size={12} />{/if}
					Load
				</Button>
				{#if telemetryState.spans.length > 0}
					<Button preset="ghost" size="sm" onclick={() => telemetryState.clearSpans()}>
						Clear
					</Button>
				{/if}
			</div>

			{#if telemetryState.spansLoading && telemetryState.spans.length === 0}
				<Spinner size="md" tone="accent" label="Reading history..." />
			{:else if telemetryState.spansError}
				<Callout variant="error">{telemetryState.spansError}</Callout>
			{:else if telemetryState.spans.length === 0}
				<Callout variant="info">
					No activity yet. Use the app for a moment, then come back.
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
										{formatDurationUs(Number(span.duration_us))}
									</td>
									<td class="py-2 px-3">
										<Badge variant={levelVariant(span.level)} size="sm" fillStyle="subtle">
											{span.level}
										</Badge>
									</td>
									<td class="py-2 px-3">
										<button
											type="button"
											class="font-mono text-[10px] hover:text-[var(--color-teal-400)] hover:underline"
											onclick={() => {
												traceIdInput = span.trace_id;
												handleSpanQuery();
											}}
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
		</div>
	{/snippet}

	<!-- ══════════════════ ACTIONS ══════════════════ -->
	{#snippet actions()}
		<div class="space-y-3">
			<Card preset="glass">
				<div class="p-3 space-y-2">
					<Text size="sm" weight="semibold">Storage</Text>
					<Text size="xs">
						Open the folder holding your OTLP JSONL session files in your
						system file manager.
					</Text>
					<div class="pt-1">
						<Button
							preset="primary"
							size="sm"
							onclick={() => telemetryState.revealFolder()}
							disabled={!telemetryState.pipeline?.telemetry_dir}
						>
							<Folder size={14} />
							Open telemetry folder
						</Button>
					</div>
				</div>
			</Card>

			<Card preset="glass">
				<div class="p-3 space-y-2">
					<Text size="sm" weight="semibold">Reload data</Text>
					<Text size="xs">
						Force a fresh read of the pipeline state, DuckDB row counts,
						and rotating session files.
					</Text>
					<div class="flex gap-2 pt-1">
						<Button
							preset="primary"
							size="sm"
							onclick={() => telemetryState.refreshStatus()}
							disabled={telemetryState.pipelineLoading}
						>
							{#if telemetryState.pipelineLoading}
								<Spinner size="xs" tone="accent" />
							{:else}
								<RefreshCw size={14} />
							{/if}
							Refresh pipeline status
						</Button>
						<Button
							preset="ghost"
							size="sm"
							onclick={() => telemetryState.loadRowCounts()}
							disabled={telemetryState.rowCountsLoading}
						>
							Refresh row counts
						</Button>
					</div>
				</div>
			</Card>

			<Card preset="glass">
				<div class="p-3 space-y-2">
					<Text size="sm" weight="semibold">Rotation</Text>
					<Text size="xs">
						Rotation runs automatically at app start — old session files
						beyond the limit are deleted. Changing the retention limit
						requires an app restart for now.
					</Text>
				</div>
			</Card>
		</div>
	{/snippet}

	<!-- ══════════════════ EXTRA TABS ══════════════════ -->
	{#snippet extra(tabId: string)}
		{#if tabId === "activity"}
			{@render activityBody()}
		{:else if tabId === "performance"}
			{@render performanceBody()}
		{/if}
	{/snippet}
</ServiceDevtoolShell>

<!-- Activity tab: richer span browser. Same data source as Logs but with a -->
<!-- larger canvas + grouping if we add it later.                           -->
{#snippet activityBody()}
	<div class="space-y-3">
		<div class="flex items-center justify-between">
			<div>
				<Text size="sm" weight="semibold">Recent activity</Text>
				<Text size="xs">
					Every significant action the platform has taken, newest first.
				</Text>
			</div>
			<Button
				preset="ghost"
				size="sm"
				onclick={() => telemetryState.loadSpans(undefined, 100)}
			>
				{#if telemetryState.spansLoading}
					<Spinner size="xs" tone="accent" />
				{:else}
					<RefreshCw size={14} />
				{/if}
				Load latest 100
			</Button>
		</div>

		{#if telemetryState.spansError}
			<Callout variant="error">{telemetryState.spansError}</Callout>
		{:else if telemetryState.spans.length === 0}
			<Callout variant="info">
				No activity yet. Use the app for a moment, then come back.
			</Callout>
		{:else}
			<Card preset="flat">
				<table class="w-full text-xs">
					<thead>
						<tr class="border-b border-[var(--border-subtle)]">
							<th class="py-2 px-3 text-left">What</th>
							<th class="py-2 px-3 text-right">Duration</th>
							<th class="py-2 px-3 text-left">Level</th>
							<th class="py-2 px-3 text-left">Trace</th>
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
									{formatDurationUs(Number(span.duration_us))}
								</td>
								<td class="py-2 px-3">
									<Badge variant={levelVariant(span.level)} size="sm" fillStyle="subtle">
										{span.level}
									</Badge>
								</td>
								<td class="py-2 px-3 font-mono text-[10px]">
									{span.trace_id.slice(0, 12)}...
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</Card>
		{/if}
	</div>
{/snippet}

<!-- Performance tab: per-lane percentile baselines. -->
{#snippet performanceBody()}
	<div class="space-y-3">
		<div class="flex items-center justify-between">
			<div>
				<Text size="sm" weight="semibold">How each part performs</Text>
				<Text size="xs">
					Typical + slow-tail timings for every lane with enough samples.
				</Text>
			</div>
			<Button
				preset="ghost"
				size="sm"
				onclick={() => telemetryState.loadBaselines()}
				disabled={telemetryState.baselinesLoading}
			>
				{#if telemetryState.baselinesLoading}
					<Spinner size="xs" tone="accent" />
				{:else}
					<RefreshCw size={14} />
				{/if}
				Refresh
			</Button>
		</div>

		{#if telemetryState.baselinesError}
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
								<div class="min-w-0">
									<Text size="sm" weight="semibold">{laneLabel(baseline.lane)}</Text>
									<Text size="xs">{laneBlurb(baseline.lane)}</Text>
								</div>
								<Badge variant="neutral" size="sm" fillStyle="subtle">
									{baseline.sample_count} samples
								</Badge>
							</div>

							<div class="grid grid-cols-3 gap-2 pt-2 border-t border-[var(--border-subtle)]">
								<Stat
									label="Typical"
									value={formatDurationUs(Number(baseline.p50_us))}
									size="sm"
									accent="teal"
								/>
								<Stat
									label="Slow 5%"
									value={formatDurationUs(Number(baseline.p95_us))}
									size="sm"
									accent="ember"
								/>
								<Stat
									label="Slowest 1%"
									value={formatDurationUs(Number(baseline.p99_us))}
									size="sm"
									accent="magenta"
								/>
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
	</div>
{/snippet}
