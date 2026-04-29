<!--
	@file /devtools/surreal — SurrealDB devtool (charter retrofit)
	@route /devtools/surreal

	Knowledge graph devtool on `ServiceDevtoolShell`. Status holds the
	per-namespace health cards; Config / Logs / Actions wait on the
	services-wired phase; Browser + Console are extras that carry the
	namespace selector inline.
-->
<script lang="ts">
import { Database, Globe, Network, RefreshCw, Terminal } from "lucide-svelte";
import { onMount } from "svelte";
import { Button } from "$lib/design/components/button/index.js";
import { Spinner } from "$lib/design/components/spinner/index.js";
import { Text } from "$lib/design/components/text/index.js";
import { NAMESPACE_OPTIONS, surrealState } from "$lib/domains/infra/surreal/index.js";
import {
	type ExtraTab,
	type HealthBadge,
	ServiceDevtoolShell,
} from "$lib/domains/platform/index.js";
import type { ScopedLogEntry } from "$lib/sys/generated/bindings.js";
import { commands } from "$lib/sys/generated/bindings.js";

let logEntries = $state<ScopedLogEntry[]>([]);
let logLoading = $state(false);
let logError = $state<string | null>(null);

async function loadLogs(): Promise<void> {
	logLoading = true;
	logError = null;
	try {
		const r = await commands.queryScopedLog("devtools.surreal", 100);
		if (r.status === "error") throw new Error(r.error);
		logEntries = r.data;
	} catch (e) {
		logError = e instanceof Error ? e.message : String(e);
	} finally {
		logLoading = false;
	}
}

const extraTabs: ExtraTab[] = [
	{ id: "browser", label: "Browser", Icon: Database },
	{ id: "console", label: "Console", Icon: Terminal },
];

// One-shot mount load. The bailout reads `health` + `healthLoading`
// reactively — `$effect` would re-fire when `loadHealth()` mutates them.
// `onMount` doesn't track reads. (See ProjectSwitcher fix.)
onMount(() => {
	if (!surrealState.health && !surrealState.healthLoading) {
		surrealState.loadHealth();
	}
});

const badge = $derived<HealthBadge>(
	surrealState.healthLoading
		? { state: "starting", label: "Checking…" }
		: surrealState.healthError
			? { state: "down", label: "Unreachable" }
			: surrealState.health
				? surrealState.reachableCount === surrealState.health.namespaces.length
					? { state: "up", label: "3/3 namespaces reachable" }
					: surrealState.reachableCount > 0
						? {
								state: "degraded",
								label: `${surrealState.reachableCount}/${surrealState.health.namespaces.length} reachable`,
							}
						: { state: "down", label: "No namespaces reachable" }
				: { state: "unknown", label: "Not checked yet" },
);

function handleQuerySubmit(): void {
	surrealState.executeQuery();
}

function handleKeydown(e: KeyboardEvent): void {
	if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
		handleQuerySubmit();
	}
}
</script>

<ServiceDevtoolShell
	title="SurrealDB"
	description="3 namespaces · SurrealKV"
	icon={Network}
	axis="stores"
	accent="violet"
	health={badge}
	{extraTabs}
>
	{#snippet status()}
		<div class="space-y-4">
			<div class="flex items-center justify-between">
				<Text size="sm" weight="semibold">Namespace Health</Text>
				<Button
					preset="ghost"
					size="sm"
					onclick={() => surrealState.loadHealth()}
					disabled={surrealState.healthLoading}
				>
					{#if surrealState.healthLoading}
						<Spinner size="xs" tone="accent" />
					{:else}
						<RefreshCw size={14} />
					{/if}
					Refresh
				</Button>
			</div>

			{#if surrealState.healthError}
				<div class="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400">
					{surrealState.healthError}
				</div>
			{/if}

			{#if surrealState.health}
				<div class="text-xs text-[var(--text-secondary)]">
					Storage:
					<span class="font-mono">{surrealState.health.storage_path}/surreal/devpulse</span>
				</div>

				<div class="grid grid-cols-1 md:grid-cols-3 gap-3">
					{#each surrealState.health.namespaces as ns}
						<div
							class="p-3 rounded-lg bg-[var(--surface-raised)] border border-[var(--border-subtle)]"
						>
							<div class="flex items-center justify-between mb-2">
								<div class="flex items-center gap-2">
									<Globe size={14} class="text-[var(--color-teal-400)]" />
									<Text size="sm" weight="semibold">{ns.namespace}</Text>
								</div>
								<span
									class="inline-block w-2 h-2 rounded-full"
									style="background: {ns.reachable
										? 'var(--signal-success)'
										: 'var(--signal-error)'}"
								></span>
							</div>
							<div class="space-y-1 text-xs">
								<div class="flex justify-between">
									<span class="text-[var(--text-secondary)]">Database</span>
									<span class="font-mono">{ns.database}</span>
								</div>
								<div class="flex justify-between">
									<span class="text-[var(--text-secondary)]">Status</span>
									<span
										style="color: {ns.reachable
											? 'var(--signal-success)'
											: 'var(--signal-error)'}"
									>
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
			{:else if surrealState.healthLoading}
				<Text size="sm" color="muted">Pinging namespaces…</Text>
			{:else}
				<Text size="sm" color="muted">Click Refresh to check health.</Text>
			{/if}
		</div>
	{/snippet}

	{#snippet config()}
		<div class="space-y-3">
			{#if surrealState.health}
				<div class="space-y-2">
					<Text size="xs" weight="bold" color="muted">Storage</Text>
					<div class="rounded p-2 font-mono text-xs" style="background: var(--surface-base); border: 1px solid var(--border-subtle);">
						{surrealState.health.storage_path}
					</div>
				</div>

				<div class="space-y-2">
					<Text size="xs" weight="bold" color="muted">Namespaces ({surrealState.health.namespaces.length})</Text>
					<div class="space-y-1">
						{#each surrealState.health.namespaces as ns}
							<div class="flex items-center justify-between rounded px-2 py-1 text-xs font-mono" style="background: var(--surface-base); border: 1px solid var(--border-subtle);">
								<span>{ns.namespace}/{ns.database}</span>
								<span class={ns.reachable ? "text-[var(--signal-success)]" : "text-[var(--signal-error)]"}>
									{ns.reachable ? "\u2713" : "\u2717"}
								</span>
							</div>
						{/each}
					</div>
				</div>

				<Text size="xs" color="muted">
					TODO(reality-gap 2026-04-21): live config edits
					(namespace add/remove, credential rotation) wire up with
					<code>surrealdb_save_config</code>. Today, settings are
					boot-only from <span class="font-mono">platform.default.toml</span>.
				</Text>
			{:else}
				<Text size="sm" color="muted">Click Status → Refresh to load config.</Text>
			{/if}
		</div>
	{/snippet}

	{#snippet logs()}
		<div class="space-y-3">
			<div class="flex items-center justify-between">
				<Text size="sm" weight="semibold">
					Scoped log — <span class="font-mono text-xs">devtools.surreal</span>
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

	{#snippet extra(tabId: string)}
		{#if tabId === "browser"}
			{@render browserBody()}
		{:else if tabId === "console"}
			{@render consoleBody()}
		{/if}
	{/snippet}
</ServiceDevtoolShell>

{#snippet browserBody()}
	<div class="space-y-4">
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-2">
				<Text size="sm" weight="semibold">Tables in {surrealState.activeNamespace}</Text>
				<select
					class="bg-[var(--surface-raised)] text-xs border border-[var(--border-subtle)] rounded px-2 py-1 text-[var(--text-primary)]"
					value={surrealState.activeNamespace}
					onchange={(e) =>
						surrealState.setNamespace(
							(e.target as HTMLSelectElement)
								.value as (typeof NAMESPACE_OPTIONS)[number]["value"],
						)}
				>
					{#each NAMESPACE_OPTIONS as opt}
						<option value={opt.value}>{opt.label}</option>
					{/each}
				</select>
			</div>
			<Button
				preset="ghost"
				size="sm"
				onclick={() => surrealState.loadTables()}
				disabled={surrealState.browserLoading}
			>
				{#if surrealState.browserLoading}
					<Spinner size="xs" tone="accent" />
				{:else}
					<RefreshCw size={14} />
				{/if}
				Refresh
			</Button>
		</div>

		{#if surrealState.browserError}
			<div class="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400">
				{surrealState.browserError}
			</div>
		{/if}

		{#if surrealState.stats}
			<div class="flex gap-4 text-xs text-[var(--text-secondary)]">
				<span>{surrealState.stats.table_count} tables</span>
				<span>{surrealState.stats.total_records} total records</span>
				<span class="font-mono">
					{surrealState.stats.namespace}/{surrealState.stats.database}
				</span>
			</div>

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

			{#if surrealState.kvEntries.length > 0}
				<div class="mt-4">
					<Text size="xs" weight="semibold" color="secondary">
						KV Store ({surrealState.kvEntries.length} keys)
					</Text>
					<div class="mt-2 rounded-lg border border-[var(--border-subtle)] overflow-hidden">
						<table class="w-full text-xs">
							<thead>
								<tr class="bg-[var(--surface-raised)] border-b border-[var(--border-subtle)]">
									<th class="text-left px-3 py-2 font-medium text-[var(--text-secondary)]">
										Key
									</th>
									<th class="text-right px-3 py-2 font-medium text-[var(--text-secondary)]">
										Size
									</th>
								</tr>
							</thead>
							<tbody>
								{#each surrealState.kvEntries as entry}
									<tr
										class="border-b border-[var(--border-subtle)] hover:bg-[var(--surface-raised)]"
									>
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
			<Text size="sm" color="muted">Loading tables…</Text>
		{:else}
			<Text size="sm" color="muted">Select a namespace and click Refresh.</Text>
		{/if}
	</div>
{/snippet}

{#snippet consoleBody()}
	<div class="space-y-4">
		<div class="flex items-center gap-2">
			<Text size="sm" weight="semibold">SurrealQL Console</Text>
			<Text size="xs" color="secondary">Targeting: {surrealState.activeNamespace}</Text>
			<select
				class="bg-[var(--surface-raised)] text-xs border border-[var(--border-subtle)] rounded px-2 py-1 text-[var(--text-primary)]"
				value={surrealState.activeNamespace}
				onchange={(e) =>
					surrealState.setNamespace(
						(e.target as HTMLSelectElement)
							.value as (typeof NAMESPACE_OPTIONS)[number]["value"],
					)}
			>
				{#each NAMESPACE_OPTIONS as opt}
					<option value={opt.value}>{opt.label}</option>
				{/each}
			</select>
		</div>

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
					{surrealState.queryLoading ? "Running…" : "Execute"}
				</Button>
			</div>
		</div>

		{#if surrealState.queryHistory.length > 0}
			<div>
				<Text size="xs" weight="semibold" color="secondary">History</Text>
				<div class="mt-1 flex flex-wrap gap-1">
					{#each surrealState.queryHistory.slice(0, 8) as q}
						<button
							type="button"
							class="px-2 py-0.5 text-[10px] font-mono rounded bg-[var(--surface-raised)] border border-[var(--border-subtle)] hover:border-[var(--color-teal-600)] truncate max-w-[200px]"
							onclick={() => surrealState.setQueryFromHistory(q)}
						>
							{q}
						</button>
					{/each}
				</div>
			</div>
		{/if}

		{#if surrealState.queryError}
			<div
				class="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400 font-mono break-all"
			>
				{surrealState.queryError}
			</div>
		{/if}

		{#if surrealState.queryResult !== null}
			<div>
				<div class="flex items-center justify-between mb-1">
					<Text size="xs" weight="semibold" color="secondary">Result</Text>
					<button
						type="button"
						class="text-[10px] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
						onclick={() => surrealState.clearResult()}
					>
						Clear
					</button>
				</div>
				<pre
					class="p-3 rounded-lg bg-[var(--surface-raised)] border border-[var(--border-subtle)] text-xs font-mono overflow-auto max-h-80 text-[var(--text-primary)]">{JSON.stringify(surrealState.queryResult, null, 2)}</pre>
			</div>
		{/if}
	</div>
{/snippet}
