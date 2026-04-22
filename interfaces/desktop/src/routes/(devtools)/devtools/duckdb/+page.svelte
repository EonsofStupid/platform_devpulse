<!--
	@file /devtools/duckdb — DuckDB devtool (charter retrofit)
	@route /devtools/duckdb

	Analytics engine devtool on `ServiceDevtoolShell`. Mirrors the libsql
	retrofit: Status uses the existing health panel; Config / Logs /
	Actions wait on the services-wired phase; Tables + Console are extras.
-->
<script lang="ts">
import { BarChart3, RefreshCw, Table2, Terminal } from "lucide-svelte";
import { Button } from "$lib/design/components/button/index.js";
import { Spinner } from "$lib/design/components/spinner/index.js";
import { Text } from "$lib/design/components/text/index.js";
import { duckdbState } from "$lib/domains/infra/duckdb/index.js";
import {
	type ExtraTab,
	type HealthBadge,
	ServiceDevtoolShell,
} from "$lib/domains/platform/index.js";

const extraTabs: ExtraTab[] = [
	{ id: "tables", label: "Tables", Icon: Table2 },
	{ id: "console", label: "Console", Icon: Terminal },
];

$effect(() => {
	if (!duckdbState.health && !duckdbState.healthLoading) {
		duckdbState.loadHealth();
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
	title="DuckDB"
	description="Analytics engine · OLAP"
	icon={BarChart3}
	axis="stores"
	health={badge}
	{extraTabs}
>
	{#snippet status()}
		<div class="space-y-4">
			<div class="flex items-center justify-between">
				<Text size="sm" weight="semibold">Analytics Engine Health</Text>
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
					Refresh
				</Button>
			</div>

			{#if duckdbState.healthError}
				<div class="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400">
					{duckdbState.healthError}
				</div>
			{/if}

			{#if duckdbState.health}
				<div class="p-3 rounded-lg bg-[var(--surface-raised)] border border-[var(--border-subtle)]">
					<div class="flex items-center justify-between mb-2">
						<div class="flex items-center gap-2">
							<BarChart3 size={14} class="text-[var(--color-purple-400)]" />
							<Text size="sm" weight="semibold">analytics.duckdb</Text>
						</div>
						<span
							class="inline-block w-2 h-2 rounded-full"
							style="background: {duckdbState.health.reachable
								? 'var(--signal-success)'
								: 'var(--signal-error)'}"
						></span>
					</div>
					<div class="space-y-1 text-xs">
						<div class="flex justify-between">
							<span class="text-[var(--text-secondary)]">Status</span>
							<span
								style="color: {duckdbState.health.reachable
									? 'var(--signal-success)'
									: 'var(--signal-error)'}"
							>
								{duckdbState.health.reachable ? "Reachable" : "Down"}
							</span>
						</div>
						{#if duckdbState.health.reachable}
							<div class="flex justify-between">
								<span class="text-[var(--text-secondary)]">Latency</span>
								<span class="font-mono">
									{duckdbState.health.latency_us >= 1000
										? `${Math.round(duckdbState.health.latency_us / 1000)}ms`
										: `${duckdbState.health.latency_us}\u00b5s`}
								</span>
							</div>
						{/if}
						{#if duckdbState.health.path}
							<div class="flex justify-between">
								<span class="text-[var(--text-secondary)]">Path</span>
								<span class="font-mono text-[10px]">{duckdbState.health.path}</span>
							</div>
						{/if}
						{#if duckdbState.health.error}
							<div class="mt-1 text-red-400 break-all">{duckdbState.health.error}</div>
						{/if}
					</div>
				</div>
			{:else if duckdbState.healthLoading}
				<Text size="sm" color="muted">Pinging DuckDB…</Text>
			{:else}
				<Text size="sm" color="muted">Click Refresh to check health.</Text>
			{/if}
		</div>
	{/snippet}

	{#snippet config()}
		<Text size="sm" color="muted">
			DuckDB settings will live here — data path, bundled extensions, memory
			limits. Wires up once <code>duckdb_save_config</code> lands.
		</Text>
	{/snippet}

	{#snippet logs()}
		<Text size="sm" color="muted">
			DuckDB log export wires up with <code>duckdb_export_logs</code>.
		</Text>
	{/snippet}

	{#snippet actions()}
		<div class="space-y-2">
			<Text size="sm" color="muted">
				Start / stop / restart wire up with <code>duckdb_start</code> /
				<code>duckdb_stop</code> / <code>duckdb_restart</code>.
			</Text>
			<div class="flex gap-2 opacity-50">
				<Button preset="default" size="sm" disabled>Start</Button>
				<Button preset="default" size="sm" disabled>Stop</Button>
				<Button preset="default" size="sm" disabled>Restart</Button>
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
					preset="default"
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
