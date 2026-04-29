<!--
	@file /devtools/libsql — LibSQL devtool (charter retrofit)
	@route /devtools/libsql
	@window DevTools (Ctrl+Shift+Z)

	First service devtool retrofitted onto `ServiceDevtoolShell`. Reference
	implementation — every other service devtool will follow this shape.

	Mapping:
	- **Status**    — existing per-database health panel (ping + latency)
	- **Config**    — platform-side LibSQL settings (read-only for now)
	- **Logs**      — placeholder until `libsql_export_logs` lands
	- **Actions**   — placeholder until `libsql_start/stop/restart` land
	- **Tables**    — existing table browser (extra tab, DB selector in-tab)
	- **Console**   — existing SQL console (extra tab, DB selector in-tab)
-->
<script lang="ts">
import { Database, RefreshCw, Table2, Terminal } from "lucide-svelte";
import { onMount } from "svelte";
import { Button } from "$lib/design/components/button/index.js";
import { Spinner } from "$lib/design/components/spinner/index.js";
import { Text } from "$lib/design/components/text/index.js";
import { DATABASE_OPTIONS, libsqlState } from "$lib/domains/infra/libsql/index.js";
import {
	type ExtraTab,
	type HealthBadge,
	ServiceDevtoolShell,
} from "$lib/domains/platform/index.js";
import type { ScopedLogEntry } from "$lib/sys/generated/bindings.js";
import { commands } from "$lib/sys/generated/bindings.js";

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

const extraTabs: ExtraTab[] = [
	{ id: "tables", label: "Tables", Icon: Table2 },
	{ id: "console", label: "Console", Icon: Terminal },
];

/**
 * Auto-load health on first mount. `onMount` (not `$effect`) — the
 * bailout reads `healthLoading`, which `loadHealth()` flips, which
 * would re-fire `$effect`. (See ProjectSwitcher fix for the trap.)
 */
onMount(() => {
	if (!libsqlState.health && !libsqlState.healthLoading) {
		libsqlState.loadHealth();
	}
});

/** Derive the layman-phrased health badge from raw per-database health. */
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
		<div class="space-y-4">
			<div class="flex items-center justify-between">
				<Text size="sm" weight="semibold">Database Health</Text>
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
					Refresh
				</Button>
			</div>

			{#if libsqlState.healthError}
				<div
					class="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400"
				>
					{libsqlState.healthError}
				</div>
			{/if}

			{#if libsqlState.health}
				<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
					{#each libsqlState.health.databases as db}
						<div
							class="p-3 rounded-lg bg-[var(--surface-raised)] border border-[var(--border-subtle)]"
						>
							<div class="flex items-center justify-between mb-2">
								<div class="flex items-center gap-2">
									<Database size={14} class="text-[var(--color-teal-400)]" />
									<Text size="sm" weight="semibold">{db.database}</Text>
								</div>
								<span
									class="inline-block w-2 h-2 rounded-full"
									style="background: {db.reachable
										? 'var(--signal-success)'
										: 'var(--signal-error)'}"
								></span>
							</div>
							<div class="space-y-1 text-xs">
								<div class="flex justify-between">
									<span class="text-[var(--text-secondary)]">Status</span>
									<span
										style="color: {db.reachable
											? 'var(--signal-success)'
											: 'var(--signal-error)'}"
									>
										{db.reachable ? "Reachable" : "Down"}
									</span>
								</div>
								{#if db.reachable}
									<div class="flex justify-between">
										<span class="text-[var(--text-secondary)]">Latency</span>
										<span class="font-mono">
											{db.latency_us >= 1000
												? `${Math.round(db.latency_us / 1000)}ms`
												: `${db.latency_us}\u00b5s`}
										</span>
									</div>
								{/if}
								{#if db.path}
									<div class="flex justify-between">
										<span class="text-[var(--text-secondary)]">Path</span>
										<span class="font-mono text-[10px] truncate max-w-[200px]">
											{db.path}
										</span>
									</div>
								{/if}
								{#if db.error}
									<div class="mt-1 text-red-400 break-all">{db.error}</div>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			{:else if libsqlState.healthLoading}
				<Text size="sm" color="muted">Pinging databases…</Text>
			{:else}
				<Text size="sm" color="muted">Click Refresh to check health.</Text>
			{/if}
		</div>
	{/snippet}

	<!-- ── CONFIG ────────────────────────────────────────────── -->
	{#snippet config()}
		<div class="space-y-3">
			<Text size="sm" color="muted">
				Platform-side LibSQL settings will live here — file paths, retry
				policy, WAL checkpoint cadence. The charter's
				<code>libsql_save_config</code> command lands with the services
				rewire phase.
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
