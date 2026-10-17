<!--
	@file SurrealdbDevtool.svelte
	@module @devpulse/devtools/system/datastores/surrealdb

	Unified SurrealDB surface. The previous split into a surreal page and
	a separate sidecar page was the overlap the user banned in
	the locked memory `feedback_command_naming_convention.md` —
	"surrealdb is surrealdb, no `_sidecar` decorator at any layer."
	The two devtools are folded into one tabbed shell here:

	  Status   — sidecar runtime + namespace health (the headline
	             "is my graph store working" view)
	  Config   — sidecar overrides (port, binary, creds, log level);
	             persists to `user/surreal.toml`
	  Logs     — `devtools.surreal` scoped log tail
	  Process  — port-bump diagnostics + binary path (deeper sidecar
	             inspection that doesn't belong on the headline tab)
	  Browser  — tables in the active namespace
	  Console  — ad-hoc SurrealQL execution

	Surreal is boot-time critical (graph stores depend on it), so the
	devtool deliberately does NOT expose start/stop/restart actions —
	config saves take effect on the next app launch. The Process tab
	makes that constraint visible.
-->
<script lang="ts">
import { Database, Globe, Network, RefreshCw, ServerCog, Terminal } from "lucide-svelte";
import { onMount } from "svelte";
import { Badge } from "$lib/design/components/badge/index.js";
import { Button } from "$lib/design/components/button/index.js";
import { Spinner } from "$lib/design/components/spinner/index.js";
import { Text } from "$lib/design/components/text/index.js";
import {
	type ExtraTab,
	type HealthBadge,
	ScopedLogPanel,
	ServiceDevtoolShell,
} from "$lib/devtools/index.js";
import { EmptyStatePoster, StoreHeroCard } from "$lib/devtools/system/datastores/_shared/index.js";
import {
	NAMESPACE_OPTIONS,
	surrealSidecarState as surrealdbSidecar,
	surrealState,
} from "$lib/domains/infra/surreal/index.js";
import SurrealdbHero from "./SurrealdbHero.svelte";

// ── Mount ─────────────────────────────────────────────────
// `onMount`, not `$effect`: each load*() reads + writes a *Loading
// flag, which `$effect` would track and re-trigger on. (Same trap
// caught earlier in ProjectSwitcher's 1300+ refresh() loop.)
onMount(() => {
	void surrealdbSidecar.loadStatus();
	void surrealdbSidecar.loadHealth();
	void surrealdbSidecar.loadConfig();
	if (!surrealState.health && !surrealState.healthLoading) {
		void surrealState.loadHealth();
	}
});

// ── Tabs ──────────────────────────────────────────────────
const extraTabs: ExtraTab[] = [
	{ id: "process", label: "Process", Icon: ServerCog },
	{ id: "browser", label: "Browser", Icon: Database },
	{ id: "console", label: "Console", Icon: Terminal },
];

// ── Hero state ────────────────────────────────────────────
// Sidecar liveness gates the hero state — if the process isn't up,
// nothing else matters. Once running, hero state tracks namespace
// reachability so a partial graph (e.g. 2/3 namespaces) reads as
// "degraded" with the visual matching the badge.
type StoreHealth = "up" | "starting" | "degraded" | "down" | "unknown";
const heroState = $derived<StoreHealth>(
	surrealdbSidecar.healthLoading
		? "starting"
		: surrealdbSidecar.health?.state === "down" || surrealdbSidecar.health?.state === "stopped"
			? "down"
			: surrealState.healthLoading
				? "starting"
				: surrealState.healthError
					? "degraded"
					: surrealState.health
						? surrealState.health.namespaces.length === 0
							? "unknown"
							: surrealState.reachableCount === surrealState.health.namespaces.length
								? "up"
								: surrealState.reachableCount > 0
									? "degraded"
									: "down"
						: "unknown",
);
const heroLatencyMs = $derived(
	(() => {
		const reachable = surrealState.health?.namespaces.filter((n) => n.reachable) ?? [];
		if (reachable.length === 0) return null;
		const totalUs = reachable.reduce((sum, n) => sum + (n.latency_us ?? 0), 0);
		return totalUs / reachable.length / 1000;
	})(),
);
const heroHealthLabel = $derived(
	surrealdbSidecar.healthLoading
		? "Booting…"
		: surrealdbSidecar.health?.state === "down" || surrealdbSidecar.health?.state === "stopped"
			? "Sidecar stopped"
			: surrealState.healthLoading
				? "Probing namespaces"
				: surrealState.health
					? surrealState.reachableCount === surrealState.health.namespaces.length
						? `${surrealState.reachableCount} namespaces alive`
						: `${surrealState.reachableCount}/${surrealState.health.namespaces.length} reachable`
					: "Not probed yet",
);

// ── Unified health badge ──────────────────────────────────
// Sidecar liveness gates everything — if the process isn't up, the
// namespace count is irrelevant. Once the sidecar is up, the badge
// reports namespace reachability so a degraded graph store surfaces
// even when the process is technically running.
const badge = $derived<HealthBadge>(
	surrealdbSidecar.healthLoading
		? { state: "starting", label: "Checking sidecar…" }
		: surrealdbSidecar.health?.state === "down" || surrealdbSidecar.health?.state === "stopped"
			? { state: "down", label: "Sidecar not running" }
			: surrealState.healthLoading
				? { state: "starting", label: "Checking namespaces…" }
				: surrealState.healthError
					? { state: "degraded", label: "Namespace probe failed" }
					: surrealState.health
						? surrealState.reachableCount === surrealState.health.namespaces.length
							? {
									state: "up",
									label: `${surrealState.reachableCount}/${surrealState.health.namespaces.length} namespaces reachable`,
								}
							: surrealState.reachableCount > 0
								? {
										state: "degraded",
										label: `${surrealState.reachableCount}/${surrealState.health.namespaces.length} reachable`,
									}
								: { state: "down", label: "No namespaces reachable" }
						: { state: "unknown", label: "Not checked yet" },
);

// SurrealDB is now embedded (kv-surrealkv) — no port / binary /
// credentials to override. `SurrealUserConfig` is reserved as
// `Record<string, never>` for future tuning knobs; until they
// land the Config tab renders a flat "no overrides" panel.

// ── Console handlers ──────────────────────────────────────
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
	health={badge}
	{extraTabs}
>
	<!-- ── STATUS ────────────────────────────────────────── -->
	<!-- Combines sidecar runtime state + namespace reachability cards -->
	{#snippet status()}
		<div class="space-y-5">
			<!-- Sidecar runtime block -->
			<div>
				<div class="flex items-center justify-between mb-2">
					<Text size="sm" weight="semibold">Runtime</Text>
					<Button
						preset="ghost"
						size="sm"
						onclick={() => {
							void surrealdbSidecar.loadStatus();
							void surrealdbSidecar.loadHealth();
						}}
						disabled={surrealdbSidecar.healthLoading}
					>
						{#if surrealdbSidecar.healthLoading}
							<Spinner size="xs" tone="accent" />
						{:else}
							<RefreshCw size={14} />
						{/if}
						Refresh
					</Button>
				</div>

				{#if surrealdbSidecar.statusError}
					<div class="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400">
						{surrealdbSidecar.statusError}
					</div>
				{/if}

				{#if surrealdbSidecar.status}
					<div class="p-3 rounded-lg bg-[var(--surface-raised)] border border-[var(--border-subtle)]">
						<div class="flex items-center justify-between mb-2">
							<div class="flex items-center gap-2">
								<Database size={14} class="text-[var(--color-teal-400)]" />
								<Text size="sm" weight="semibold">surreal</Text>
								{#if surrealdbSidecar.status.running}
									{#if surrealdbSidecar.status.managed}
										<Badge variant="positive" size="sm">Embedded</Badge>
									{:else}
										<Badge variant="neutral" size="sm">Attached</Badge>
									{/if}
								{:else}
									<Badge variant="neutral" size="sm">Stopped</Badge>
								{/if}
							</div>
							<span
								class="inline-block w-2 h-2 rounded-full"
								style="background: {surrealdbSidecar.running
									? 'var(--signal-success)'
									: 'var(--signal-error)'}"
							></span>
						</div>

						<div class="space-y-1 text-xs">
							{#if surrealdbSidecar.status.running}
								<div class="flex justify-between">
									<span class="text-[var(--text-secondary)]">Backend</span>
									<span class="font-mono">{surrealdbSidecar.status.backend}</span>
								</div>
								<div class="flex justify-between">
									<span class="text-[var(--text-secondary)]">Data path</span>
									<span class="font-mono break-all">{surrealdbSidecar.status.dataPath}</span>
								</div>
							{:else}
								<Text size="xs" color="muted">
									Embedded store not initialized — check boot log at
									<code>.userdata/logs/boot.log</code>.
								</Text>
							{/if}
						</div>
					</div>
				{/if}
			</div>

			<!-- Namespaces hero + per-namespace breakdown -->
			<div class="space-y-3">
				<StoreHeroCard
					purpose="Graph + document multi-model — persona, projects, agents linked across namespaces"
					health={heroState}
					latencyMs={heroLatencyMs}
					healthLabel={heroHealthLabel}
					activityTick={surrealState.healthChecks}
				>
					<SurrealdbHero state={heroState} />
				</StoreHeroCard>

				<div class="flex items-center justify-between gap-2">
					{#if surrealState.health?.storage_path}
						<Text size="xs" color="muted">
							Storage:
							<span class="font-mono">{surrealState.health.storage_path}/surreal/devpulse</span>
						</Text>
					{:else}
						<span></span>
					{/if}
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
						Re-probe
					</Button>
				</div>

				{#if surrealState.healthError}
					<div class="rounded-lg p-3" style="background: color-mix(in oklch, var(--signal-error) 10%, transparent); border: 1px solid color-mix(in oklch, var(--signal-error) 30%, transparent);">
						<Text size="xs" weight="semibold" class="block mb-1" style="color: var(--signal-error);">
							Namespace probe failed
						</Text>
						<Text size="xs" color="muted">{surrealState.healthError}</Text>
					</div>
				{/if}

				{#if surrealState.health && surrealState.health.namespaces.length > 0}
					<div class="rounded-lg p-3" style="background: var(--surface-raised); border: 1px solid var(--border-subtle);">
						<Text size="xs" weight="semibold" class="block mb-2" color="muted">
							Per-namespace breakdown
						</Text>
						<div class="grid grid-cols-1 md:grid-cols-3 gap-2">
							{#each surrealState.health.namespaces as ns (ns.namespace)}
								<div class="flex flex-col gap-1 rounded p-2" style="background: var(--surface-base); border: 1px solid var(--border-soft);">
									<div class="flex items-center justify-between gap-2">
										<div class="flex items-center gap-2 min-w-0">
											<Globe size={14} style="color: var(--accent-purple); flex-shrink: 0;" />
											<Text size="xs" weight="semibold" class="truncate">{ns.namespace}</Text>
										</div>
										<span
											class="inline-block w-2 h-2 rounded-full flex-shrink-0"
											style="background: {ns.reachable ? 'var(--signal-success)' : 'var(--signal-error)'};"
										></span>
									</div>
									<div class="flex items-center justify-between text-xs">
										<span style="color: var(--text-secondary);" class="font-mono">{ns.database}</span>
										{#if ns.reachable}
											<span class="font-mono" style="color: var(--text-muted);">
												{ns.latency_us >= 1000
													? `${Math.round(ns.latency_us / 1000)}ms`
													: `${ns.latency_us}µs`}
											</span>
										{:else}
											<Text size="xs" style="color: var(--signal-error);">Down</Text>
										{/if}
									</div>
									{#if ns.error}
										<Text size="xs" class="break-all" style="color: var(--signal-error);">
											{ns.error}
										</Text>
									{/if}
								</div>
							{/each}
						</div>
					</div>
				{:else if !surrealState.health && !surrealState.healthLoading}
					<EmptyStatePoster
						icon={Network}
						title="Probe SurrealDB to see its namespaces"
						hint="The sidecar may be up but no namespaces have been queried yet. Click Re-probe to enumerate them."
						logTarget="surreal.lifecycle"
						accentVar="--accent-purple"
					/>
				{/if}
			</div>
		</div>
	{/snippet}

	<!-- ── CONFIG ────────────────────────────────────────── -->
	<!-- Embedded SurrealKV has no runtime knobs to override; the
	     Config tab surfaces the data path the kernel boots against. -->
	{#snippet config()}
		<div class="space-y-3">
			{#if surrealdbSidecar.configError}
				<div class="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400">
					{surrealdbSidecar.configError}
				</div>
			{/if}

			<Text size="xs" color="muted">
				SurrealDB now runs embedded (<code>kv-surrealkv</code>). There are
				no port, binary, or credential overrides — the kernel holds the
				file lock directly. Future tuning knobs (cache size, compaction
				policy) land here.
			</Text>

			{#if surrealdbSidecar.status?.dataPath}
				<div class="p-3 rounded-lg bg-[var(--surface-raised)] border border-[var(--border-subtle)] space-y-1">
					<Text size="xs" weight="semibold">Data path</Text>
					<code class="text-xs font-mono text-[var(--text-secondary)] break-all">
						{surrealdbSidecar.status.dataPath}
					</code>
				</div>
			{/if}
		</div>
	{/snippet}

	<!-- ── LOGS ──────────────────────────────────────────── -->
	{#snippet logs()}
		<ScopedLogPanel target="devtools.surreal" />
	{/snippet}

	<!-- ── ACTIONS ───────────────────────────────────────── -->
	{#snippet actions()}
		<div class="space-y-4">
			<Text size="sm" color="muted">
				SurrealDB is boot-time critical — the graph stores depend on it.
				Start / stop / restart deliberately aren't exposed here; instead,
				edit the sidecar overrides in <strong>Config</strong>, save, and
				relaunch the platform. The Process tab shows the running binary's
				path + port-bump history.
			</Text>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
				<div class="p-3 rounded-lg bg-[var(--surface-raised)] border border-[var(--border-subtle)]">
					<Text size="sm" weight="semibold">Refresh runtime + namespaces</Text>
					<Text size="xs" color="muted" class="block mb-2">
						Re-poll the sidecar liveness and ping every namespace.
					</Text>
					<Button
						preset="primary"
						size="sm"
						onclick={() => {
							void surrealdbSidecar.loadStatus();
							void surrealdbSidecar.loadHealth();
							void surrealState.loadHealth();
						}}
						disabled={surrealdbSidecar.healthLoading || surrealState.healthLoading}
					>
						{#if surrealdbSidecar.healthLoading || surrealState.healthLoading}
							<Spinner size="xs" tone="accent" />
						{:else}
							<RefreshCw size={14} />
						{/if}
						Re-poll
					</Button>
				</div>

				<div class="p-3 rounded-lg bg-[var(--surface-raised)] border border-[var(--border-subtle)]">
					<Text size="sm" weight="semibold">Reload tables</Text>
					<Text size="xs" color="muted" class="block mb-2">
						Refresh the table catalog for the active namespace.
					</Text>
					<Button
						preset="primary"
						size="sm"
						onclick={() => surrealState.loadTables()}
						disabled={surrealState.browserLoading}
					>
						{#if surrealState.browserLoading}
							<Spinner size="xs" tone="accent" />
						{:else}
							<Database size={14} />
						{/if}
						Reload tables
					</Button>
				</div>
			</div>
		</div>
	{/snippet}

	<!-- ── DEBUG ─────────────────────────────────────────── -->
	{#snippet debug()}
		<div class="space-y-4">
			<Text size="sm" color="muted">
				Power-user probes. The sanity probe runs <code>INFO FOR DB</code>
				against the active namespace via the same Tauri path the app
				uses, so a failure here points at the WS connection or
				namespace-scope, not your query.
			</Text>

			<div class="p-3 rounded-lg bg-[var(--surface-raised)] border border-[var(--border-subtle)]">
				<div class="flex items-center justify-between mb-2">
					<Text size="sm" weight="semibold">Sanity probe</Text>
					<Button
						preset="primary"
						size="sm"
						onclick={async () => {
							surrealState.queryInput = "INFO FOR DB;";
							await surrealState.executeQuery();
						}}
						disabled={surrealState.queryLoading}
					>
						{#if surrealState.queryLoading}
							<Spinner size="xs" tone="accent" />
						{:else}
							<RefreshCw size={14} />
						{/if}
						Run
					</Button>
				</div>
				{#if surrealState.queryError}
					<div class="text-xs font-mono text-red-400 break-all">
						error: {surrealState.queryError}
					</div>
				{:else if surrealState.queryResult !== null}
					<div class="text-xs font-mono" style="color: var(--signal-success)">
						ok — query returned
					</div>
				{/if}
			</div>

			<div class="p-3 rounded-lg bg-[var(--surface-raised)] border border-[var(--border-subtle)]">
				<Text size="sm" weight="semibold" class="block mb-2">Sidecar process state</Text>
				<div class="text-xs space-y-1">
					<div class="flex justify-between">
						<span class="text-[var(--text-secondary)]">Running</span>
						<span class="font-mono">{surrealdbSidecar.running ? "yes" : "no"}</span>
					</div>
					{#if surrealdbSidecar.status?.backend}
						<div class="flex justify-between">
							<span class="text-[var(--text-secondary)]">Backend</span>
							<span class="font-mono">{surrealdbSidecar.status.backend}</span>
						</div>
					{/if}
					{#if surrealdbSidecar.status?.dataPath}
						<div class="flex justify-between">
							<span class="text-[var(--text-secondary)]">Data path</span>
							<span class="font-mono break-all">{surrealdbSidecar.status.dataPath}</span>
						</div>
					{/if}
				</div>
			</div>
		</div>
	{/snippet}

	<!-- ── EXTRAS ────────────────────────────────────────── -->
	{#snippet extra(tabId: string)}
		{#if tabId === "process"}
			{@render processBody()}
		{:else if tabId === "browser"}
			{@render browserBody()}
		{:else if tabId === "console"}
			{@render consoleBody()}
		{/if}
	{/snippet}
</ServiceDevtoolShell>

<!-- ── PROCESS — embedded backend + data-path detail ───── -->
{#snippet processBody()}
	<div class="space-y-4">
		{#if surrealdbSidecar.status?.running}
			<div class="space-y-2">
				<Text size="xs" weight="bold" color="muted">Embedded backend</Text>
				<div
					class="rounded p-2 font-mono text-xs"
					style="background: var(--surface-base); border: 1px solid var(--border-subtle);"
				>
					{surrealdbSidecar.status.backend}
				</div>
			</div>

			<div class="space-y-2">
				<Text size="xs" weight="bold" color="muted">Data path</Text>
				<div
					class="rounded p-2 font-mono text-xs break-all"
					style="background: var(--surface-base); border: 1px solid var(--border-subtle);"
				>
					{surrealdbSidecar.status.dataPath}
				</div>
			</div>
		{:else}
			<Text size="sm" color="muted">
				Sidecar is not running. Boot the app to spawn it; this devtool
				cannot start it manually because Surreal is boot-time critical
				for the graph stage.
			</Text>
		{/if}
	</div>
{/snippet}

<!-- ── BROWSER — tables in active namespace ────────────── -->
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
			<Text size="sm" color="muted">Loading tables…</Text>
		{:else}
			<Text size="sm" color="muted">Select a namespace and click Refresh.</Text>
		{/if}
	</div>
{/snippet}

<!-- ── CONSOLE — SurrealQL ad-hoc queries ──────────────── -->
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
					preset="primary"
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
