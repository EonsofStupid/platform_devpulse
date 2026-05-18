<!--
	@file LibsqlDevtool.svelte
	@module @devpulse/devtools/system/datastores/libsql

	LibSQL devtool — relational store (system + user databases). Wraps
	`ServiceDevtoolShell` with the standard 5 tabs (Status / Config /
	Logs / Actions / Debug) plus extras (Tables browser, SQL console).

	LibSQL is in-process (no managed sidecar), so Actions verbs are
	limited to refresh + maintenance operations. Config is read-only —
	the SSOT lives in `[services.system.libsql]` of `platform.toml`.
-->
<script lang="ts">
import { Database, Hammer, Play, RefreshCw, Table2, Terminal } from "lucide-svelte";
import { onMount } from "svelte";
import { Button } from "$lib/design/components/button/index.js";
import { Spinner } from "$lib/design/components/spinner/index.js";
import { Text } from "$lib/design/components/text/index.js";
import { type ExtraTab, type HealthBadge, ServiceDevtoolShell } from "$lib/devtools/index.js";
import { EmptyStatePoster, StoreHeroCard } from "$lib/devtools/system/datastores/_shared/index.js";
import { DATABASE_OPTIONS, libsqlState } from "$lib/domains/infra/libsql/index.js";
import { commands, type ScopedLogEntry } from "$lib/sys/generated/bindings.js";
import LibsqlHero from "./LibsqlHero.svelte";

// ── Scoped log state ─────────────────────────────────────
let logEntries = $state<ScopedLogEntry[]>([]);
let logLoading = $state(false);
let logError = $state<string | null>(null);

async function loadLogs(): Promise<void> {
	logLoading = true;
	logError = null;
	try {
		const r = await commands.queryScopedLog("devtools.libsql", 100);
		if (r.status === "error") throw new Error(r.error);
		logEntries = r.data;
	} catch (e) {
		logError = e instanceof Error ? e.message : String(e);
	} finally {
		logLoading = false;
	}
}

// ── Debug probe state ────────────────────────────────────
let probeRunning = $state(false);
let probeLastResult = $state<string | null>(null);

async function runSanityProbe(): Promise<void> {
	probeRunning = true;
	probeLastResult = null;
	try {
		// SELECT 1 against the current database — confirms the connection
		// is alive and the SQL surface answers.
		libsqlState.queryInput = "SELECT 1 AS probe;";
		await libsqlState.executeQuery();
		probeLastResult = libsqlState.queryError ? `error: ${libsqlState.queryError}` : "ok";
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
	if (!libsqlState.health && !libsqlState.healthLoading) {
		libsqlState.loadHealth();
	}
});

// Hero-state derivation. libSQL is multi-database, so "up" means every
// database is reachable; "degraded" means some-but-not-all are; "down"
// means none. Latency on the hero is the average across reachable DBs
// so a single slow DB doesn't dominate the readout — per-DB breakdown
// still lives in the grid below for diagnosis.
type StoreHealth = "up" | "starting" | "degraded" | "down" | "unknown";
const heroState = $derived<StoreHealth>(
	libsqlState.healthLoading
		? "starting"
		: libsqlState.healthError
			? "down"
			: libsqlState.health
				? libsqlState.health.databases.length === 0
					? "unknown"
					: libsqlState.reachableCount === libsqlState.health.databases.length
						? "up"
						: libsqlState.reachableCount > 0
							? "degraded"
							: "down"
				: "unknown",
);
const heroLatencyMs = $derived(
	(() => {
		const reachable = libsqlState.health?.databases.filter((d) => d.reachable) ?? [];
		if (reachable.length === 0) return null;
		const totalUs = reachable.reduce((sum, d) => sum + (d.latency_us ?? 0), 0);
		return totalUs / reachable.length / 1000;
	})(),
);
const heroHealthLabel = $derived(
	libsqlState.healthLoading
		? "Probing…"
		: libsqlState.healthError
			? "Unreachable"
			: libsqlState.health
				? libsqlState.reachableCount === libsqlState.health.databases.length
					? `${libsqlState.reachableCount} reachable`
					: libsqlState.reachableCount > 0
						? `${libsqlState.reachableCount}/${libsqlState.health.databases.length} reachable`
						: "All down"
				: "Not probed yet",
);
let activityTick = $state(0);
$effect(() => {
	if (libsqlState.health) {
		activityTick = activityTick + 1;
	}
});

const badge = $derived<HealthBadge>(
	libsqlState.healthLoading
		? { state: "starting", label: "Checking…" }
		: libsqlState.healthError
			? { state: "down", label: "Unreachable" }
			: libsqlState.health
				? libsqlState.reachableCount === libsqlState.health.databases.length
					? { state: "up", label: `${libsqlState.reachableCount} databases reachable` }
					: libsqlState.reachableCount > 0
						? {
								state: "degraded",
								label: `${libsqlState.reachableCount}/${libsqlState.health.databases.length} reachable`,
							}
						: { state: "down", label: "No databases reachable" }
				: { state: "unknown", label: "Not checked yet" },
);

function handleQuerySubmit(): void {
	libsqlState.executeQuery();
}

function handleKeydown(event: KeyboardEvent): void {
	if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
		handleQuerySubmit();
	}
}
</script>

<ServiceDevtoolShell
	infoTerm="libSQL"
	title="LibSQL"
	description="System + User relational store · SQLite"
	icon={Database}
	axis="stores"
	accent="blue"
	health={badge}
	{extraTabs}
>
	<!-- ── STATUS ────────────────────────────────────────────── -->
	{#snippet status()}
		<div class="space-y-3">
			<StoreHeroCard
				icon={Database}
				name="libSQL"
				purpose="Relational rows — system + user state, project notes, every persistent fact Clyffy keeps"
				health={heroState}
				latencyMs={heroLatencyMs}
				healthLabel={heroHealthLabel}
				{activityTick}
				accentVar="--accent-cyan"
			>
				<LibsqlHero state={heroState} />
			</StoreHeroCard>

			<div class="flex items-center justify-end gap-2">
				<Button
					preset="ghost"
					size="sm"
					onclick={() => libsqlState.loadHealth()}
					disabled={libsqlState.healthLoading}
				>
					{#if libsqlState.healthLoading}
						<Spinner size="xs" tone="accent" />
					{:else}
						<RefreshCw size={14} />
					{/if}
					Re-probe
				</Button>
			</div>

			{#if libsqlState.healthError}
				<div class="rounded-lg p-3" style="background: color-mix(in oklch, var(--signal-error) 10%, transparent); border: 1px solid color-mix(in oklch, var(--signal-error) 30%, transparent);">
					<Text size="xs" weight="semibold" class="block mb-1" style="color: var(--signal-error);">
						Probe failed
					</Text>
					<Text size="xs" color="muted">{libsqlState.healthError}</Text>
				</div>
			{/if}

			{#if libsqlState.health && libsqlState.health.databases.length > 0}
				<div class="rounded-lg p-3" style="background: var(--surface-raised); border: 1px solid var(--border-subtle);">
					<Text size="xs" weight="semibold" class="block mb-2" color="muted">
						Per-database breakdown
					</Text>
					<div class="grid grid-cols-1 md:grid-cols-2 gap-2">
						{#each libsqlState.health.databases as db (db.database)}
							<div class="flex flex-col gap-1 rounded p-2" style="background: var(--surface-base); border: 1px solid var(--border-soft);">
								<div class="flex items-center justify-between gap-2">
									<div class="flex items-center gap-2 min-w-0">
										<span
											class="inline-block w-2 h-2 rounded-full flex-shrink-0"
											style="background: {db.reachable ? 'var(--signal-success)' : 'var(--signal-error)'};"
										></span>
										<Text size="xs" weight="semibold" class="truncate">{db.database}</Text>
									</div>
									<div class="flex items-center gap-2 flex-shrink-0">
										{#if db.reachable}
											<Text size="xs" color="muted" class="font-mono">
												{db.latency_us >= 1000
													? `${Math.round(db.latency_us / 1000)}ms`
													: `${db.latency_us}µs`}
											</Text>
										{:else}
											<Text size="xs" style="color: var(--signal-error);">Down</Text>
										{/if}
									</div>
								</div>
								{#if db.error}
									<Text size="xs" class="break-all" style="color: var(--signal-error);">
										{db.error}
									</Text>
								{/if}
							</div>
						{/each}
					</div>
				</div>
			{:else if !libsqlState.health && !libsqlState.healthLoading}
				<EmptyStatePoster
					icon={Database}
					title="Probe libSQL to see its state"
					hint="Each database file lives at the path declared in platform.toml. If they're missing, the first probe surfaces the path here."
					logTarget="libsql.lifecycle"
					accentVar="--accent-cyan"
				/>
			{/if}
		</div>
	{/snippet}

	<!-- ── CONFIG ────────────────────────────────────────────── -->
	{#snippet config()}
		<div class="space-y-3">
			<Text size="sm" color="muted">
				LibSQL configuration is read-only here. The SSOT for file paths,
				retry policy, and WAL checkpoint cadence lives in
				<code>[services.system.libsql]</code> of
				<code>platform.toml</code>. Edit the TOML and restart the platform
				to apply changes.
			</Text>
			<Text size="sm" color="muted">
				The charter's <code>libsql_save_config</code> command will land
				with the services-rewire phase; once it's wired, this tab gains
				editable controls.
			</Text>
		</div>
	{/snippet}

	<!-- ── LOGS ──────────────────────────────────────────────── -->
	{#snippet logs()}
		<div class="space-y-3">
			<div class="flex items-center justify-between">
				<Text size="sm" weight="semibold">
					Scoped log — <span class="font-mono text-xs">devtools.libsql</span>
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

	<!-- ── ACTIONS ───────────────────────────────────────────── -->
	{#snippet actions()}
		<div class="space-y-4">
			<Text size="sm" color="muted">
				LibSQL is in-process (no managed sidecar), so there's no
				start/stop. Actions here trigger refresh + maintenance on the
				current connections.
			</Text>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
				<div
					class="p-3 rounded-lg bg-[var(--surface-raised)] border border-[var(--border-subtle)]"
				>
					<Text size="sm" weight="semibold">Refresh health</Text>
					<Text size="xs" color="muted" class="block mb-2">
						Re-ping every database and reload latency.
					</Text>
					<Button
						preset="default"
						size="sm"
						onclick={() => libsqlState.loadHealth()}
						disabled={libsqlState.healthLoading}
					>
						{#if libsqlState.healthLoading}
							<Spinner size="xs" tone="accent" />
						{:else}
							<RefreshCw size={14} />
						{/if}
						Re-ping
					</Button>
				</div>

				<div
					class="p-3 rounded-lg bg-[var(--surface-raised)] border border-[var(--border-subtle)]"
				>
					<Text size="sm" weight="semibold">Reload tables</Text>
					<Text size="xs" color="muted" class="block mb-2">
						Refresh the table catalog for the active database.
					</Text>
					<Button
						preset="default"
						size="sm"
						onclick={() => libsqlState.loadTables()}
						disabled={libsqlState.tablesLoading}
					>
						{#if libsqlState.tablesLoading}
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

	<!-- ── DEBUG ─────────────────────────────────────────────── -->
	{#snippet debug()}
		<div class="space-y-4">
			<Text size="sm" color="muted">
				Power-user probes. The sanity probe runs <code>SELECT 1</code>
				against the active database via the same path the app uses, so
				a failure here points to the connection layer, not your query.
			</Text>

			<div class="p-3 rounded-lg bg-[var(--surface-raised)] border border-[var(--border-subtle)]">
				<div class="flex items-center justify-between mb-2">
					<Text size="sm" weight="semibold">Sanity probe</Text>
					<Button
						preset="default"
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
					Active database
				</Text>
				<div class="text-xs font-mono">{libsqlState.activeDatabase}</div>
				<Text size="xs" color="muted" class="block mt-1">
					Switch via the selector in Tables / Console; the probe uses
					whichever database is active there.
				</Text>
			</div>
		</div>
	{/snippet}

	<!-- ── EXTRA TABS: dispatched by id ────────────────────────── -->
	{#snippet extra(tabId: string)}
		{#if tabId === "tables"}
			{@render tablesBody()}
		{:else if tabId === "console"}
			{@render consoleBody()}
		{/if}
	{/snippet}
</ServiceDevtoolShell>

<!-- Snippets hoisted to module scope so the shell's `extra` dispatcher
	can forward by id. Each body auto-loads its data via $effect when
	the relevant tab first becomes active (via tabId changes). -->
{#snippet tablesBody()}
	<div class="space-y-4">
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-2">
				<Text size="sm" weight="semibold">
					Tables in {libsqlState.activeDatabase}
				</Text>
				<select
					class="bg-[var(--surface-raised)] text-xs border border-[var(--border-subtle)] rounded px-2 py-1 text-[var(--text-primary)]"
					value={libsqlState.activeDatabase}
					onchange={(e) =>
						libsqlState.setDatabase(
							(e.target as HTMLSelectElement)
								.value as (typeof DATABASE_OPTIONS)[number]["value"],
						)}
				>
					{#each DATABASE_OPTIONS as opt}
						<option value={opt.value}>{opt.label}</option>
					{/each}
				</select>
			</div>
			<Button
				preset="ghost"
				size="sm"
				onclick={() => libsqlState.loadTables()}
				disabled={libsqlState.tablesLoading}
			>
				{#if libsqlState.tablesLoading}
					<Spinner size="xs" tone="accent" />
				{:else}
					<RefreshCw size={14} />
				{/if}
				Refresh
			</Button>
		</div>

		{#if libsqlState.tablesError}
			<div
				class="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400"
			>
				{libsqlState.tablesError}
			</div>
		{/if}

		{#if libsqlState.tables.length > 0}
			<div class="rounded-lg border border-[var(--border-subtle)] overflow-hidden">
				<table class="w-full text-xs">
					<thead>
						<tr class="bg-[var(--surface-raised)] border-b border-[var(--border-subtle)]">
							<th class="text-left px-3 py-2 font-medium text-[var(--text-secondary)]">
								Table
							</th>
							<th class="text-right px-3 py-2 font-medium text-[var(--text-secondary)]">
								Rows
							</th>
						</tr>
					</thead>
					<tbody>
						{#each libsqlState.tables as table}
							<tr
								class="border-b border-[var(--border-subtle)] hover:bg-[var(--surface-raised)]"
							>
								<td class="px-3 py-2 font-mono">{table.name}</td>
								<td class="px-3 py-2 text-right font-mono">{table.row_count}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{:else if libsqlState.tablesLoading}
			<Text size="sm" color="muted">Loading tables…</Text>
		{:else}
			<Text size="sm" color="muted">Click Refresh to load tables.</Text>
		{/if}
	</div>
{/snippet}

{#snippet consoleBody()}
	<div class="space-y-4">
		<div class="flex items-center gap-2">
			<Text size="sm" weight="semibold">SQL Console</Text>
			<select
				class="bg-[var(--surface-raised)] text-xs border border-[var(--border-subtle)] rounded px-2 py-1 text-[var(--text-primary)]"
				value={libsqlState.activeDatabase}
				onchange={(e) =>
					libsqlState.setDatabase(
						(e.target as HTMLSelectElement)
							.value as (typeof DATABASE_OPTIONS)[number]["value"],
					)}
			>
				{#each DATABASE_OPTIONS as opt}
					<option value={opt.value}>{opt.label}</option>
				{/each}
			</select>
		</div>

		<div class="relative">
			<textarea
				class="w-full h-28 p-3 rounded-lg bg-[var(--surface-raised)] border border-[var(--border-subtle)] text-xs font-mono text-[var(--text-primary)] resize-y focus:border-[var(--color-teal-500)] focus:outline-none"
				placeholder="SELECT * FROM sessions LIMIT 10;"
				bind:value={libsqlState.queryInput}
				onkeydown={handleKeydown}
			></textarea>
			<div class="absolute bottom-2 right-2 flex items-center gap-2">
				<span class="text-[10px] text-[var(--text-secondary)]">Ctrl+Enter to run</span>
				<Button
					preset="default"
					size="sm"
					onclick={handleQuerySubmit}
					disabled={libsqlState.queryLoading || !libsqlState.queryInput.trim()}
				>
					{libsqlState.queryLoading ? "Running…" : "Execute"}
				</Button>
			</div>
		</div>

		{#if libsqlState.queryHistory.length > 0}
			<div>
				<Text size="xs" weight="semibold" color="secondary">History</Text>
				<div class="mt-1 flex flex-wrap gap-1">
					{#each libsqlState.queryHistory.slice(0, 8) as q}
						<button
							type="button"
							class="px-2 py-0.5 text-[10px] font-mono rounded bg-[var(--surface-raised)] border border-[var(--border-subtle)] hover:border-[var(--color-teal-600)] truncate max-w-[200px]"
							onclick={() => libsqlState.setQueryFromHistory(q)}
						>
							{q}
						</button>
					{/each}
				</div>
			</div>
		{/if}

		{#if libsqlState.queryError}
			<div
				class="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400 font-mono break-all"
			>
				{libsqlState.queryError}
			</div>
		{/if}

		{#if libsqlState.queryResult !== null}
			<div>
				<div class="flex items-center justify-between mb-1">
					<Text size="xs" weight="semibold" color="secondary">
						Result
						{#if libsqlState.queryResult.rows_affected > 0}
							({libsqlState.queryResult.rows_affected} rows affected)
						{:else}
							({libsqlState.queryResult.row_count} rows)
						{/if}
					</Text>
					<button
						type="button"
						class="text-[10px] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
						onclick={() => libsqlState.clearResult()}
					>
						Clear
					</button>
				</div>
				<pre
					class="p-3 rounded-lg bg-[var(--surface-raised)] border border-[var(--border-subtle)] text-xs font-mono overflow-auto max-h-80 text-[var(--text-primary)]">{JSON.stringify(JSON.parse(libsqlState.queryResult.rows_json), null, 2)}</pre>
			</div>
		{/if}
	</div>
{/snippet}
