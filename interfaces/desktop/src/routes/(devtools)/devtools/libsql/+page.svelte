<!--
	@file /devtools/libsql - LibSQL Devtool
	@route /devtools/libsql
	@window DevTools (Ctrl+Shift+Z)

	Three-tab relational store inspector:
	- Health: ping system + user databases, show latency + status
	- Tables: table list, row counts per database
	- Console: raw SQL execution with result view
-->
<script lang="ts">
import { ArrowLeft, type Database, HeartPulse, RefreshCw, Table2, Terminal } from "lucide-svelte";
import { Button } from "$lib/design/components/button/index.js";
import { Spinner } from "$lib/design/components/spinner/index.js";
import { Text } from "$lib/design/components/text/index.js";
import { DATABASE_OPTIONS, type LibSqlTab, libsqlState } from "$lib/domains/infra/libsql/index.js";

const tabs: { id: LibSqlTab; label: string; Icon: typeof Database }[] = [
	{ id: "health", label: "Health", Icon: HeartPulse },
	{ id: "tables", label: "Tables", Icon: Table2 },
	{ id: "console", label: "Console", Icon: Terminal },
];

$effect(() => {
	const tab = libsqlState.activeTab;
	if (tab === "health" && !libsqlState.health && !libsqlState.healthLoading) {
		libsqlState.loadHealth();
	}
	if (tab === "tables" && libsqlState.tables.length === 0 && !libsqlState.tablesLoading) {
		libsqlState.loadTables();
	}
});

function handleQuerySubmit(): void {
	libsqlState.executeQuery();
}

function handleKeydown(e: KeyboardEvent): void {
	if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
		handleQuerySubmit();
	}
}
</script>

<div class="flex flex-col h-full bg-[var(--surface-base)] text-[var(--text-primary)]">
	<!-- Header -->
	<header class="flex items-center gap-3 h-10 px-4 border-b border-[var(--border-subtle)]">
		<a href="/devtools" class="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
			<ArrowLeft size={14} />
		</a>
		<Database size={16} class="text-[var(--color-teal-400)]" />
		<Text size="sm" weight="semibold">LibSQL</Text>
		<span class="text-xs text-[var(--text-secondary)]">System + User &middot; SQLite</span>
	</header>

	<!-- Tab bar -->
	<nav class="flex border-b border-[var(--border-subtle)]">
		{#each tabs as tab}
			<button
				class="flex items-center gap-1.5 px-3 py-2 text-xs transition-colors
					{libsqlState.activeTab === tab.id
						? 'text-[var(--color-teal-400)] border-b-2 border-[var(--color-teal-400)]'
						: 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}"
				onclick={() => libsqlState.setTab(tab.id)}
			>
				<tab.Icon size={14} />
				{tab.label}
			</button>
		{/each}

		<div class="ml-auto flex items-center gap-2 px-3">
			<Text size="xs" color="secondary">Database:</Text>
			<select
				class="bg-[var(--surface-raised)] text-xs border border-[var(--border-subtle)] rounded px-2 py-1 text-[var(--text-primary)]"
				value={libsqlState.activeDatabase}
				onchange={(e) => libsqlState.setDatabase((e.target as HTMLSelectElement).value as any)}
			>
				{#each DATABASE_OPTIONS as opt}
					<option value={opt.value}>{opt.label} — {opt.description}</option>
				{/each}
			</select>
		</div>
	</nav>

	<!-- Tab content -->
	<main class="flex-1 overflow-y-auto p-4">

		<!-- HEALTH TAB -->
		{#if libsqlState.activeTab === "health"}
			<div class="space-y-4">
				<div class="flex items-center justify-between">
					<Text size="sm" weight="semibold">Database Health</Text>
					<Button
						preset="ghost"
						size="sm"
						onclick={() => libsqlState.loadHealth()}
						disabled={libsqlState.healthLoading}
					>
						{#if libsqlState.healthLoading}<Spinner size="xs" tone="accent" />{:else}<RefreshCw size={14} />{/if}
						Refresh
					</Button>
				</div>

				{#if libsqlState.healthError}
					<div class="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400">
						{libsqlState.healthError}
					</div>
				{/if}

				{#if libsqlState.health}
					<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
						{#each libsqlState.health.databases as db}
							<div class="p-3 rounded-lg bg-[var(--surface-raised)] border border-[var(--border-subtle)]">
								<div class="flex items-center justify-between mb-2">
									<div class="flex items-center gap-2">
										<Database size={14} class="text-[var(--color-teal-400)]" />
										<Text size="sm" weight="semibold">{db.database}</Text>
									</div>
									<span
										class="inline-block w-2 h-2 rounded-full"
										style="background: {db.reachable ? 'var(--signal-success)' : 'var(--signal-error)'}"
									></span>
								</div>
								<div class="space-y-1 text-xs">
									<div class="flex justify-between">
										<span class="text-[var(--text-secondary)]">Status</span>
										<span style="color: {db.reachable ? 'var(--signal-success)' : 'var(--signal-error)'}">
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
											<span class="font-mono text-[10px] truncate max-w-[200px]">{db.path}</span>
										</div>
									{/if}
									{#if db.error}
										<div class="mt-1 text-red-400 break-all">{db.error}</div>
									{/if}
								</div>
							</div>
						{/each}
					</div>
					<div class="text-xs text-[var(--text-secondary)]">
						{libsqlState.reachableCount}/2 databases reachable
					</div>
				{:else if libsqlState.healthLoading}
					<Text size="sm" color="muted">Pinging databases...</Text>
				{:else}
					<Text size="sm" color="muted">Click Refresh to check health.</Text>
				{/if}
			</div>

		<!-- TABLES TAB -->
		{:else if libsqlState.activeTab === "tables"}
			<div class="space-y-4">
				<div class="flex items-center justify-between">
					<Text size="sm" weight="semibold">
						Tables in {libsqlState.activeDatabase}
					</Text>
					<Button
						preset="ghost"
						size="sm"
						onclick={() => libsqlState.loadTables()}
						disabled={libsqlState.tablesLoading}
					>
						{#if libsqlState.tablesLoading}<Spinner size="xs" tone="accent" />{:else}<RefreshCw size={14} />{/if}
						Refresh
					</Button>
				</div>

				{#if libsqlState.tablesError}
					<div class="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400">
						{libsqlState.tablesError}
					</div>
				{/if}

				{#if libsqlState.tables.length > 0}
					<div class="rounded-lg border border-[var(--border-subtle)] overflow-hidden">
						<table class="w-full text-xs">
							<thead>
								<tr class="bg-[var(--surface-raised)] border-b border-[var(--border-subtle)]">
									<th class="text-left px-3 py-2 font-medium text-[var(--text-secondary)]">Table</th>
									<th class="text-right px-3 py-2 font-medium text-[var(--text-secondary)]">Rows</th>
								</tr>
							</thead>
							<tbody>
								{#each libsqlState.tables as table}
									<tr class="border-b border-[var(--border-subtle)] hover:bg-[var(--surface-raised)]">
										<td class="px-3 py-2 font-mono">{table.name}</td>
										<td class="px-3 py-2 text-right font-mono">{table.row_count}</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{:else if libsqlState.tablesLoading}
					<Text size="sm" color="muted">Loading tables...</Text>
				{:else}
					<Text size="sm" color="muted">Select a database and click Refresh.</Text>
				{/if}
			</div>

		<!-- CONSOLE TAB -->
		{:else if libsqlState.activeTab === "console"}
			<div class="space-y-4">
				<div class="flex items-center gap-2">
					<Text size="sm" weight="semibold">SQL Console</Text>
					<Text size="xs" color="secondary">
						Targeting: {libsqlState.activeDatabase}
					</Text>
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
							{libsqlState.queryLoading ? "Running..." : "Execute"}
						</Button>
					</div>
				</div>

				{#if libsqlState.queryHistory.length > 0}
					<div>
						<Text size="xs" weight="semibold" color="secondary">History</Text>
						<div class="mt-1 flex flex-wrap gap-1">
							{#each libsqlState.queryHistory.slice(0, 8) as q}
								<button
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
					<div class="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400 font-mono break-all">
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
									({libsqlState.queryResult.rows.length} rows)
								{/if}
							</Text>
							<button
								class="text-[10px] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
								onclick={() => libsqlState.clearResult()}
							>
								Clear
							</button>
						</div>
						<pre class="p-3 rounded-lg bg-[var(--surface-raised)] border border-[var(--border-subtle)] text-xs font-mono overflow-auto max-h-80 text-[var(--text-primary)]">{JSON.stringify(libsqlState.queryResult.rows, null, 2)}</pre>
					</div>
				{/if}
			</div>
		{/if}
	</main>
</div>
