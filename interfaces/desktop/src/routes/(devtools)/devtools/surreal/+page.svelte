<!--
	@file /devtools/surreal - SurrealDB Devtool
	@route /devtools/surreal
	@window DevTools (Ctrl+Shift+Z)

	Three-tab knowledge graph inspector:
	- Health: ping all 3 namespaces, show latency + status
	- Browser: table list, record counts, KV entries per namespace
	- Console: raw SurrealQL execution with JSON result view
-->
<script lang="ts">
import {
	ArrowLeft,
	Database,
	Globe,
	HeartPulse,
	type Network,
	RefreshCw,
	Terminal,
} from "lucide-svelte";
import { Button } from "$lib/design/components/button/index.js";
import { Spinner } from "$lib/design/components/spinner/index.js";
import { Text } from "$lib/design/components/text/index.js";
import {
	NAMESPACE_OPTIONS,
	type SurrealTab,
	surrealState,
} from "$lib/domains/infra/surreal/index.js";

// ── Tab definitions ─────────────────────────────────────────
const tabs: { id: SurrealTab; label: string; Icon: typeof Network }[] = [
	{ id: "health", label: "Health", Icon: HeartPulse },
	{ id: "browser", label: "Browser", Icon: Database },
	{ id: "console", label: "Console", Icon: Terminal },
];

// ── Data loading on tab change ──────────────────────────────
$effect(() => {
	const tab = surrealState.activeTab;
	if (tab === "health" && !surrealState.health && !surrealState.healthLoading) {
		surrealState.loadHealth();
	}
	if (tab === "browser" && surrealState.tables.length === 0 && !surrealState.browserLoading) {
		surrealState.loadTables();
	}
});

// ── Console submit ──────────────────────────────────────────
function handleQuerySubmit(): void {
	surrealState.executeQuery();
}

function handleKeydown(e: KeyboardEvent): void {
	if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
		handleQuerySubmit();
	}
}
</script>

<div class="flex flex-col h-full bg-[var(--surface-base)] text-[var(--text-primary)]">
	<!-- ── Header ─────────────────────────────────────────────── -->
	<header class="flex items-center gap-3 h-10 px-4 border-b border-[var(--border-subtle)]">
		<a href="/devtools" class="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
			<ArrowLeft size={14} />
		</a>
		<Network size={16} class="text-[var(--color-teal-400)]" />
		<Text size="sm" weight="semibold">SurrealDB</Text>
		<span class="text-xs text-[var(--text-secondary)]">3 namespaces &middot; SurrealKV</span>
	</header>

	<!-- ── Tab bar ────────────────────────────────────────────── -->
	<nav class="flex border-b border-[var(--border-subtle)]">
		{#each tabs as tab}
			<button
				class="flex items-center gap-1.5 px-3 py-2 text-xs transition-colors
					{surrealState.activeTab === tab.id
						? 'text-[var(--color-teal-400)] border-b-2 border-[var(--color-teal-400)]'
						: 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}"
				onclick={() => surrealState.setTab(tab.id)}
			>
				<tab.Icon size={14} />
				{tab.label}
			</button>
		{/each}

		<!-- Namespace selector (right-aligned) -->
		<div class="ml-auto flex items-center gap-2 px-3">
			<Text size="xs" color="secondary">Namespace:</Text>
			<select
				class="bg-[var(--surface-raised)] text-xs border border-[var(--border-subtle)] rounded px-2 py-1 text-[var(--text-primary)]"
				value={surrealState.activeNamespace}
				onchange={(e) => surrealState.setNamespace((e.target as HTMLSelectElement).value as any)}
			>
				{#each NAMESPACE_OPTIONS as opt}
					<option value={opt.value}>{opt.label} — {opt.description}</option>
				{/each}
			</select>
		</div>
	</nav>

	<!-- ── Tab content ────────────────────────────────────────── -->
	<main class="flex-1 overflow-y-auto p-4">

		<!-- HEALTH TAB -->
		{#if surrealState.activeTab === "health"}
			<div class="space-y-4">
				<div class="flex items-center justify-between">
					<Text size="sm" weight="semibold">Namespace Health</Text>
					<Button
						preset="ghost"
						size="sm"
						onclick={() => surrealState.loadHealth()}
						disabled={surrealState.healthLoading}
					>
						{#if surrealState.healthLoading}<Spinner size="xs" tone="accent" />{:else}<RefreshCw size={14} />{/if}
						Refresh
					</Button>
				</div>

				{#if surrealState.healthError}
					<div class="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400">
						{surrealState.healthError}
					</div>
				{/if}

				{#if surrealState.health}
					<!-- Storage path -->
					<div class="text-xs text-[var(--text-secondary)]">
						Storage: <span class="font-mono">{surrealState.health.storage_path}/surreal/devpulse</span>
					</div>

					<!-- Namespace cards -->
					<div class="grid grid-cols-1 md:grid-cols-3 gap-3">
						{#each surrealState.health.namespaces as ns}
							<div class="p-3 rounded-lg bg-[var(--surface-raised)] border border-[var(--border-subtle)]">
								<div class="flex items-center justify-between mb-2">
									<div class="flex items-center gap-2">
										<Globe size={14} class="text-[var(--color-teal-400)]" />
										<Text size="sm" weight="semibold">{ns.namespace}</Text>
									</div>
									<span
										class="inline-block w-2 h-2 rounded-full"
										style="background: {ns.reachable ? 'var(--signal-success)' : 'var(--signal-error)'}"
									></span>
								</div>
								<div class="space-y-1 text-xs">
									<div class="flex justify-between">
										<span class="text-[var(--text-secondary)]">Database</span>
										<span class="font-mono">{ns.database}</span>
									</div>
									<div class="flex justify-between">
										<span class="text-[var(--text-secondary)]">Status</span>
										<span style="color: {ns.reachable ? 'var(--signal-success)' : 'var(--signal-error)'}">
											{ns.reachable ? "Reachable" : "Down"}
										</span>
									</div>
									{#if ns.reachable}
										<div class="flex justify-between">
											<span class="text-[var(--text-secondary)]">Latency</span>
											<span class="font-mono">
												{ns.latency_us >= 1000
													? `${Math.round(ns.latency_us / 1000)}ms`
													: `${ns.latency_us}\u00b5s`}
											</span>
										</div>
									{/if}
									{#if ns.error}
										<div class="mt-1 text-red-400 break-all">{ns.error}</div>
									{/if}
								</div>
							</div>
						{/each}
					</div>

					<!-- Summary -->
					<div class="text-xs text-[var(--text-secondary)]">
						{surrealState.reachableCount}/3 namespaces reachable
					</div>
				{:else if surrealState.healthLoading}
					<Text size="sm" color="muted">Pinging namespaces...</Text>
				{:else}
					<Text size="sm" color="muted">Click Refresh to check health.</Text>
				{/if}
			</div>

		<!-- BROWSER TAB -->
		{:else if surrealState.activeTab === "browser"}
			<div class="space-y-4">
				<div class="flex items-center justify-between">
					<Text size="sm" weight="semibold">
						Tables in {surrealState.activeNamespace}
					</Text>
					<Button
						preset="ghost"
						size="sm"
						onclick={() => surrealState.loadTables()}
						disabled={surrealState.browserLoading}
					>
						{#if surrealState.browserLoading}<Spinner size="xs" tone="accent" />{:else}<RefreshCw size={14} />{/if}
						Refresh
					</Button>
				</div>

				{#if surrealState.browserError}
					<div class="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400">
						{surrealState.browserError}
					</div>
				{/if}

				{#if surrealState.stats}
					<!-- Stats summary -->
					<div class="flex gap-4 text-xs text-[var(--text-secondary)]">
						<span>{surrealState.stats.table_count} tables</span>
						<span>{surrealState.stats.total_records} total records</span>
						<span class="font-mono">{surrealState.stats.namespace}/{surrealState.stats.database}</span>
					</div>

					<!-- Table list -->
					<div class="rounded-lg border border-[var(--border-subtle)] overflow-hidden">
						<table class="w-full text-xs">
							<thead>
								<tr class="bg-[var(--surface-raised)] border-b border-[var(--border-subtle)]">
									<th class="text-left px-3 py-2 font-medium text-[var(--text-secondary)]">Table</th>
									<th class="text-right px-3 py-2 font-medium text-[var(--text-secondary)]">Records</th>
								</tr>
							</thead>
							<tbody>
								{#each surrealState.tables as table}
									<tr class="border-b border-[var(--border-subtle)] hover:bg-[var(--surface-raised)]">
										<td class="px-3 py-2 font-mono">{table.name}</td>
										<td class="px-3 py-2 text-right font-mono">{table.record_count}</td>
									</tr>
								{/each}
								{#if surrealState.tables.length === 0}
									<tr>
										<td colspan="2" class="px-3 py-4 text-center text-[var(--text-secondary)]">
											No tables found
										</td>
									</tr>
								{/if}
							</tbody>
						</table>
					</div>

					<!-- KV entries -->
					{#if surrealState.kvEntries.length > 0}
						<div class="mt-4">
							<Text size="xs" weight="semibold" color="secondary">KV Store ({surrealState.kvEntries.length} keys)</Text>
							<div class="mt-2 rounded-lg border border-[var(--border-subtle)] overflow-hidden">
								<table class="w-full text-xs">
									<thead>
										<tr class="bg-[var(--surface-raised)] border-b border-[var(--border-subtle)]">
											<th class="text-left px-3 py-2 font-medium text-[var(--text-secondary)]">Key</th>
											<th class="text-right px-3 py-2 font-medium text-[var(--text-secondary)]">Size</th>
										</tr>
									</thead>
									<tbody>
										{#each surrealState.kvEntries as entry}
											<tr class="border-b border-[var(--border-subtle)] hover:bg-[var(--surface-raised)]">
												<td class="px-3 py-2 font-mono">{entry.key}</td>
												<td class="px-3 py-2 text-right font-mono">{entry.value_size}B</td>
											</tr>
										{/each}
									</tbody>
								</table>
							</div>
						</div>
					{/if}
				{:else if surrealState.browserLoading}
					<Text size="sm" color="muted">Loading tables...</Text>
				{:else}
					<Text size="sm" color="muted">Select a namespace and click Refresh.</Text>
				{/if}
			</div>

		<!-- CONSOLE TAB -->
		{:else if surrealState.activeTab === "console"}
			<div class="space-y-4">
				<div class="flex items-center gap-2">
					<Text size="sm" weight="semibold">SurrealQL Console</Text>
					<Text size="xs" color="secondary">
						Targeting: {surrealState.activeNamespace}
					</Text>
				</div>

				<!-- Query input -->
				<div class="relative">
					<textarea
						class="w-full h-28 p-3 rounded-lg bg-[var(--surface-raised)] border border-[var(--border-subtle)] text-xs font-mono text-[var(--text-primary)] resize-y focus:border-[var(--color-teal-500)] focus:outline-none"
						placeholder="SELECT * FROM kv LIMIT 10;"
						bind:value={surrealState.queryInput}
						onkeydown={handleKeydown}
					></textarea>
					<div class="absolute bottom-2 right-2 flex items-center gap-2">
						<span class="text-[10px] text-[var(--text-secondary)]">Ctrl+Enter to run</span>
						<Button
							preset="default"
							size="sm"
							onclick={handleQuerySubmit}
							disabled={surrealState.queryLoading || !surrealState.queryInput.trim()}
						>
							{surrealState.queryLoading ? "Running..." : "Execute"}
						</Button>
					</div>
				</div>

				<!-- Query history -->
				{#if surrealState.queryHistory.length > 0}
					<div>
						<Text size="xs" weight="semibold" color="secondary">History</Text>
						<div class="mt-1 flex flex-wrap gap-1">
							{#each surrealState.queryHistory.slice(0, 8) as q}
								<button
									class="px-2 py-0.5 text-[10px] font-mono rounded bg-[var(--surface-raised)] border border-[var(--border-subtle)] hover:border-[var(--color-teal-600)] truncate max-w-[200px]"
									onclick={() => surrealState.setQueryFromHistory(q)}
								>
									{q}
								</button>
							{/each}
						</div>
					</div>
				{/if}

				<!-- Query error -->
				{#if surrealState.queryError}
					<div class="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400 font-mono break-all">
						{surrealState.queryError}
					</div>
				{/if}

				<!-- Query result -->
				{#if surrealState.queryResult !== null}
					<div>
						<div class="flex items-center justify-between mb-1">
							<Text size="xs" weight="semibold" color="secondary">Result</Text>
							<button
								class="text-[10px] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
								onclick={() => surrealState.clearResult()}
							>
								Clear
							</button>
						</div>
						<pre class="p-3 rounded-lg bg-[var(--surface-raised)] border border-[var(--border-subtle)] text-xs font-mono overflow-auto max-h-80 text-[var(--text-primary)]">{JSON.stringify(surrealState.queryResult, null, 2)}</pre>
					</div>
				{/if}
			</div>
		{/if}
	</main>
</div>
