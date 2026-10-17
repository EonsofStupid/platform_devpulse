<!--
	@file DuckdbDevtool.svelte
	@module @devpulse/devtools/system/datastores/duckdb

	DuckDB devtool — analytics engine (OLAP). Wraps `ServiceDevtoolShell`
	with the standard 5 tabs (Status / Config / Logs / Actions / Debug)
	plus extras (Tables, Console).

	DuckDB is in-process (no managed sidecar). Actions cover refresh +
	maintenance. Config is read-only — SSOT lives in
	`[services.system.duckdb]` of `platform.toml`.
-->
<script lang="ts">
import { BarChart3, Hammer, Play, RefreshCw, Table2, Terminal } from "lucide-svelte";
import { onMount } from "svelte";
import { Button } from "$lib/design/components/button/index.js";
import { Spinner } from "$lib/design/components/spinner/index.js";
import { Text } from "$lib/design/components/text/index.js";
import { type ExtraTab, type HealthBadge, ServiceDevtoolShell } from "$lib/devtools/index.js";
import { EmptyStatePoster, StoreHeroCard } from "$lib/devtools/system/datastores/_shared/index.js";
import { duckdbState } from "$lib/domains/infra/duckdb/index.js";
import { commands, type ScopedLogEntry } from "$lib/sys/generated/bindings.js";
import DuckdbHero from "./DuckdbHero.svelte";

let logEntries = $state<ScopedLogEntry[]>([]);
let logLoading = $state(false);
let logError = $state<string | null>(null);

async function loadLogs(): Promise<void> {
	logLoading = true;
	logError = null;
	try {
		const r = await commands.queryScopedLog("devtools.duckdb", 100);
		if (r.status === "error") throw new Error(r.error);
		logEntries = r.data;
	} catch (e) {
		logError = e instanceof Error ? e.message : String(e);
	} finally {
		logLoading = false;
	}
}

let probeRunning = $state(false);
let probeLastResult = $state<string | null>(null);

async function runSanityProbe(): Promise<void> {
	probeRunning = true;
	probeLastResult = null;
	try {
		duckdbState.queryInput = "SELECT 1 AS probe;";
		await duckdbState.executeQuery();
		probeLastResult = duckdbState.queryError ? `error: ${duckdbState.queryError}` : "ok";
	} catch (e) {
		probeLastResult = `error: ${e instanceof Error ? e.message : String(e)}`;
	} finally {
		probeRunning = false;
	}
}

const extraTabs: ExtraTab[] = [
	{ id: "tables", label: "Tables", Icon: Table2 },
	{ id: "console", label: "Console", Icon: Terminal },
];

onMount(() => {
	if (!duckdbState.health && !duckdbState.healthLoading) {
		duckdbState.loadHealth();
	}
});

// Map duckdbState into the unified HealthSignal vocabulary used by
// StoreHeroCard. Keeps the badge-and-hero pair in sync — same state
// driving both the top-of-shell health pill and the hero card's
// breathing dot.
type StoreHealth = "up" | "starting" | "degraded" | "down" | "unknown";
const heroState = $derived<StoreHealth>(
	duckdbState.healthLoading
		? "starting"
		: duckdbState.healthError
			? "down"
			: duckdbState.health
				? duckdbState.health.reachable
					? "up"
					: "down"
				: "unknown",
);
const heroLatencyMs = $derived(
	duckdbState.health?.reachable && duckdbState.health?.latency_us !== undefined
		? duckdbState.health.latency_us / 1000
		: null,
);
const heroHealthLabel = $derived(
	duckdbState.healthLoading
		? "Probing…"
		: duckdbState.healthError
			? "Unreachable"
			: duckdbState.health?.reachable
				? "Online"
				: duckdbState.health
					? "Down"
					: "Not probed yet",
);
// Activity tick — bump each time the health probe completes so the
// LiveActivityPulse blips on every successful round-trip.
let activityTick = $state(0);
$effect(() => {
	if (duckdbState.health) {
		activityTick = activityTick + 1;
	}
});

const badge = $derived<HealthBadge>(
	duckdbState.healthLoading
		? { state: "starting", label: "Checking…" }
		: duckdbState.healthError
			? { state: "down", label: "Unreachable" }
			: duckdbState.health
				? duckdbState.health.reachable
					? { state: "up", label: "Running" }
					: { state: "down", label: "Down" }
				: { state: "unknown", label: "Not checked yet" },
);

function handleQuerySubmit(): void {
	duckdbState.executeQuery();
}

function handleKeydown(e: KeyboardEvent): void {
	if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
		handleQuerySubmit();
	}
}
</script>

<ServiceDevtoolShell
	health={badge}
	{extraTabs}
>
	{#snippet status()}
		<div class="space-y-3">
			<StoreHeroCard
				icon={BarChart3}
				name="DuckDB"
				purpose="Columnar analytics engine — fast aggregates over local + warehouse data"
				health={heroState}
				latencyMs={heroLatencyMs}
				healthLabel={heroHealthLabel}
				{activityTick}
				accentVar="--accent-amber"
			>
				<DuckdbHero state={heroState} />
			</StoreHeroCard>

			<div class="flex items-center justify-end gap-2">
				<Button
					preset="ghost"
					size="sm"
					onclick={() => duckdbState.loadHealth()}
					disabled={duckdbState.healthLoading}
				>
					{#if duckdbState.healthLoading}
						<Spinner size="xs" tone="accent" />
					{:else}
						<RefreshCw size={14} />
					{/if}
					Re-probe
				</Button>
			</div>

			{#if duckdbState.healthError}
				<div class="rounded-lg p-3" style="background: color-mix(in oklch, var(--signal-error) 10%, transparent); border: 1px solid color-mix(in oklch, var(--signal-error) 30%, transparent);">
					<Text size="xs" weight="semibold" class="block mb-1" style="color: var(--signal-error);">
						Probe failed
					</Text>
					<Text size="xs" color="muted">{duckdbState.healthError}</Text>
				</div>
			{/if}

			{#if duckdbState.health && (duckdbState.health.path || duckdbState.health.error)}
				<div class="rounded-lg p-3" style="background: var(--surface-raised); border: 1px solid var(--border-subtle);">
					<Text size="xs" weight="semibold" class="block mb-2" color="muted">Diagnostics</Text>
					<div class="space-y-1 text-xs">
						{#if duckdbState.health.path}
							<div class="flex justify-between gap-2">
								<span style="color: var(--text-secondary);">Data file</span>
								<span class="font-mono text-[10px] truncate" title={duckdbState.health.path}>{duckdbState.health.path}</span>
							</div>
						{/if}
						{#if duckdbState.health.error}
							<div class="mt-1 break-all" style="color: var(--signal-error);">{duckdbState.health.error}</div>
						{/if}
					</div>
				</div>
			{:else if !duckdbState.health && !duckdbState.healthLoading}
				<EmptyStatePoster
					icon={BarChart3}
					title="Probe DuckDB to see its state"
					hint="The engine is in-process — first probe is usually instant. If it stays down, the data file may be missing."
					logTarget="duckdb.lifecycle"
					accentVar="--accent-amber"
				/>
			{/if}
		</div>
	{/snippet}

	{#snippet config()}
		<div class="space-y-3">
			<Text size="sm" color="muted">
				DuckDB configuration is read-only here. The SSOT for data path,
				bundled extensions, and memory limits lives in
				<code>[services.system.duckdb]</code> of
				<code>platform.toml</code>. Edit the TOML and restart the platform
				to apply changes.
			</Text>
			<Text size="sm" color="muted">
				Editable controls land with <code>duckdb_save_config</code> in
				the services-rewire phase.
			</Text>
		</div>
	{/snippet}

	{#snippet logs()}
		<div class="space-y-3">
			<div class="flex items-center justify-between">
				<Text size="sm" weight="semibold">
					Scoped log — <span class="font-mono text-xs">devtools.duckdb</span>
				</Text>
				<Button preset="ghost" size="sm" onclick={loadLogs} disabled={logLoading}>
					{#if logLoading}
						<Spinner size="xs" tone="accent" />
					{:else}
						Refresh
					{/if}
				</Button>
			</div>

			{#if logError}
				<div class="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400">
					{logError}
				</div>
			{/if}

			{#if logEntries.length > 0}
				<div class="rounded-lg border border-[var(--border-subtle)] overflow-hidden max-h-80 overflow-y-auto">
					<table class="w-full text-xs">
						<thead class="sticky top-0 bg-[var(--surface-raised)]">
							<tr class="border-b border-[var(--border-subtle)]">
								<th class="text-left px-2 py-1 font-medium text-[var(--text-secondary)]">Time</th>
								<th class="text-left px-2 py-1 font-medium text-[var(--text-secondary)]">Level</th>
								<th class="text-left px-2 py-1 font-medium text-[var(--text-secondary)]">Message</th>
							</tr>
						</thead>
						<tbody>
							{#each logEntries as line (line.timestamp + line.message)}
								<tr class="border-b border-[var(--border-subtle)]">
									<td class="px-2 py-1 font-mono text-[10px] text-[var(--text-secondary)]">{line.timestamp.slice(11, 19)}</td>
									<td class="px-2 py-1 font-mono text-[10px]">{line.level}</td>
									<td class="px-2 py-1 break-all">{line.message}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{:else if logLoading}
				<Text size="sm" color="muted">Loading…</Text>
			{:else}
				<Text size="sm" color="muted">
					No entries — click Refresh to tail the current session log.
				</Text>
			{/if}
		</div>
	{/snippet}

	{#snippet actions()}
		<div class="space-y-4">
			<Text size="sm" color="muted">
				DuckDB is in-process (no managed sidecar), so there's no
				start/stop. Actions trigger refresh + reload on the existing
				connection.
			</Text>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
				<div class="p-3 rounded-lg bg-[var(--surface-raised)] border border-[var(--border-subtle)]">
					<Text size="sm" weight="semibold">Refresh health</Text>
					<Text size="xs" color="muted" class="block mb-2">
						Re-ping the analytics engine and reload latency.
					</Text>
					<Button
						preset="primary"
						size="sm"
						onclick={() => duckdbState.loadHealth()}
						disabled={duckdbState.healthLoading}
					>
						{#if duckdbState.healthLoading}
							<Spinner size="xs" tone="accent" />
						{:else}
							<RefreshCw size={14} />
						{/if}
						Re-ping
					</Button>
				</div>

				<div class="p-3 rounded-lg bg-[var(--surface-raised)] border border-[var(--border-subtle)]">
					<Text size="sm" weight="semibold">Reload tables</Text>
					<Text size="xs" color="muted" class="block mb-2">
						Refresh the table catalog.
					</Text>
					<Button
						preset="primary"
						size="sm"
						onclick={() => duckdbState.loadTables()}
						disabled={duckdbState.tablesLoading}
					>
						{#if duckdbState.tablesLoading}
							<Spinner size="xs" tone="accent" />
						{:else}
							<Table2 size={14} />
						{/if}
						Reload tables
					</Button>
				</div>
			</div>
		</div>
	{/snippet}

	{#snippet debug()}
		<div class="space-y-4">
			<Text size="sm" color="muted">
				Power-user probes. The sanity probe runs <code>SELECT 1</code>
				against DuckDB via the same path the app uses, so a failure here
				points to the connection layer, not your query.
			</Text>

			<div class="p-3 rounded-lg bg-[var(--surface-raised)] border border-[var(--border-subtle)]">
				<div class="flex items-center justify-between mb-2">
					<Text size="sm" weight="semibold">Sanity probe</Text>
					<Button
						preset="primary"
						size="sm"
						onclick={runSanityProbe}
						disabled={probeRunning}
					>
						{#if probeRunning}
							<Spinner size="xs" tone="accent" />
						{:else}
							<Play size={14} />
						{/if}
						Run
					</Button>
				</div>
				{#if probeLastResult}
					<div
						class="text-xs font-mono"
						style="color: {probeLastResult === 'ok'
							? 'var(--signal-success)'
							: 'var(--signal-error)'}"
					>
						Last result: {probeLastResult}
					</div>
				{/if}
			</div>

			<div class="p-3 rounded-lg bg-[var(--surface-raised)] border border-[var(--border-subtle)]">
				<Text size="sm" weight="semibold" class="block mb-2">
					<Hammer size={14} class="inline" />
					Connection state
				</Text>
				<div class="text-xs font-mono">
					{duckdbState.health?.reachable ? "alive" : "down or unchecked"}
				</div>
				<Text size="xs" color="muted" class="block mt-1">
					DuckDB lives in-process; this status reflects the last health
					ping rather than a long-lived connection.
				</Text>
			</div>
		</div>
	{/snippet}

	{#snippet extra(tabId: string)}
		{#if tabId === "tables"}
			{@render tablesBody()}
		{:else if tabId === "console"}
			{@render consoleBody()}
		{/if}
	{/snippet}
</ServiceDevtoolShell>

{#snippet tablesBody()}
	<div class="space-y-4">
		<div class="flex items-center justify-between">
			<Text size="sm" weight="semibold">Analytics Tables</Text>
			<Button
				preset="ghost"
				size="sm"
				onclick={() => duckdbState.loadTables()}
				disabled={duckdbState.tablesLoading}
			>
				{#if duckdbState.tablesLoading}
					<Spinner size="xs" tone="accent" />
				{:else}
					<RefreshCw size={14} />
				{/if}
				Refresh
			</Button>
		</div>

		{#if duckdbState.tablesError}
			<div class="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400">
				{duckdbState.tablesError}
			</div>
		{/if}

		{#if duckdbState.tables.length > 0}
			<div class="rounded-lg border border-[var(--border-subtle)] overflow-hidden">
				<table class="w-full text-xs">
					<thead>
						<tr class="bg-[var(--surface-raised)] border-b border-[var(--border-subtle)]">
							<th class="text-left px-3 py-2 font-medium text-[var(--text-secondary)]">Table</th>
							<th class="text-right px-3 py-2 font-medium text-[var(--text-secondary)]">Rows</th>
						</tr>
					</thead>
					<tbody>
						{#each duckdbState.tables as table}
							<tr class="border-b border-[var(--border-subtle)] hover:bg-[var(--surface-raised)]">
								<td class="px-3 py-2 font-mono">{table.name}</td>
								<td class="px-3 py-2 text-right font-mono">{table.row_count}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{:else if duckdbState.tablesLoading}
			<Text size="sm" color="muted">Loading tables…</Text>
		{:else}
			<Text size="sm" color="muted">Click Refresh to list tables.</Text>
		{/if}
	</div>
{/snippet}

{#snippet consoleBody()}
	<div class="space-y-4">
		<div class="flex items-center gap-2">
			<Text size="sm" weight="semibold">DuckDB Console</Text>
			<Text size="xs" color="secondary">OLAP queries</Text>
		</div>

		<div class="relative">
			<textarea
				class="w-full h-28 p-3 rounded-lg bg-[var(--surface-raised)] border border-[var(--border-subtle)] text-xs font-mono text-[var(--text-primary)] resize-y focus:border-[var(--color-purple-500)] focus:outline-none"
				placeholder="SELECT * FROM span_traces ORDER BY start_time DESC LIMIT 20;"
				bind:value={duckdbState.queryInput}
				onkeydown={handleKeydown}
			></textarea>
			<div class="absolute bottom-2 right-2 flex items-center gap-2">
				<span class="text-[10px] text-[var(--text-secondary)]">Ctrl+Enter to run</span>
				<Button
					preset="primary"
					size="sm"
					onclick={handleQuerySubmit}
					disabled={duckdbState.queryLoading || !duckdbState.queryInput.trim()}
				>
					{duckdbState.queryLoading ? "Running…" : "Execute"}
				</Button>
			</div>
		</div>

		{#if duckdbState.queryHistory.length > 0}
			<div>
				<Text size="xs" weight="semibold" color="secondary">History</Text>
				<div class="mt-1 flex flex-wrap gap-1">
					{#each duckdbState.queryHistory.slice(0, 8) as q}
						<button
							type="button"
							class="px-2 py-0.5 text-[10px] font-mono rounded bg-[var(--surface-raised)] border border-[var(--border-subtle)] hover:border-[var(--color-purple-600)] truncate max-w-[200px]"
							onclick={() => duckdbState.setQueryFromHistory(q)}
						>
							{q}
						</button>
					{/each}
				</div>
			</div>
		{/if}

		{#if duckdbState.queryError}
			<div
				class="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400 font-mono break-all"
			>
				{duckdbState.queryError}
			</div>
		{/if}

		{#if duckdbState.queryResult !== null}
			<div>
				<div class="flex items-center justify-between mb-1">
					<Text size="xs" weight="semibold" color="secondary">
						Result ({duckdbState.queryResult.row_count} rows)
					</Text>
					<button
						type="button"
						class="text-[10px] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
						onclick={() => duckdbState.clearResult()}
					>
						Clear
					</button>
				</div>
				<pre
					class="p-3 rounded-lg bg-[var(--surface-raised)] border border-[var(--border-subtle)] text-xs font-mono overflow-auto max-h-80 text-[var(--text-primary)]">{JSON.stringify(JSON.parse(duckdbState.queryResult.rows_json), null, 2)}</pre>
			</div>
		{/if}
	</div>
{/snippet}
