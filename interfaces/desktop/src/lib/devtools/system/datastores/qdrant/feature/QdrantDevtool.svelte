<!--
	@file QdrantDevtool.svelte
	@module @devpulse/devtools/system/datastores/qdrant

	Qdrant devtool — embedded vector store (in-process via the
	`rro::QdrantInstance` fork). Wraps `ServiceDevtoolShell` with the
	standard 5 tabs (Status / Config / Logs / Actions / Debug) plus
	an extra "Collections" tab for the full collection inventory.

	# Why this lives under system/datastores

	Qdrant is a peer database to LibSQL / DuckDB / SurrealDB — it
	stores its own files at `{data_dir}/system/rro/vectors`, has its
	own health probe, and the user-experience parity ("each DB has a
	devtool") demands a peer entry. The RRO devtool at
	`/devtools/clyffy/reasoning/rro/` consumes this same store as
	the vector half of the trifecta — its Collections panel
	cross-links here for deep dive.
-->
<script lang="ts">
import { ArrowUpRight, Boxes, Database, RefreshCw } from "@lucide/svelte";
import { onMount } from "svelte";
import { Badge } from "$lib/design/components/badge/index.js";
import { Button } from "$lib/design/components/button/index.js";
import { InlineMessage } from "$lib/design/components/inline-message/index.js";
import { Spinner } from "$lib/design/components/spinner/index.js";
import { Text } from "$lib/design/components/text/index.js";
import {
	type ExtraTab,
	type HealthBadge,
	ScopedLogPanel,
	ServiceDevtoolShell,
} from "$lib/devtools/index.js";
import { rroState } from "$lib/sys/data-access/rro/rro.state.svelte.js";

onMount(() => {
	if (!rroState.health && !rroState.healthLoading) {
		void rroState.loadHealth();
	}
});

const badge = $derived<HealthBadge>(
	rroState.healthLoading
		? { state: "starting", label: "Checking…" }
		: rroState.healthError
			? { state: "down", label: "Unreachable" }
			: rroState.health
				? { state: "up", label: "Running" }
				: { state: "unknown", label: "Not checked yet" },
);

const totalPoints = $derived(
	rroState.health?.collections.reduce((sum, c) => sum + Number(c.point_count), 0) ?? 0,
);

const extraTabs: ExtraTab[] = [{ id: "collections", label: "Collections", Icon: Boxes }];
</script>

<ServiceDevtoolShell
	infoTerm="Qdrant"
	title="Qdrant"
	description="Embedded vector store · in-process · zero latency"
	icon={Boxes}
	axis="stores"
	accent="cyber"
	health={badge}
	{extraTabs}
>
	{#snippet status()}
		<div class="space-y-4">
			<!-- Cross-link banner — point users at the RRO devtool when they
			     came here looking for the search-tuning surface, not the
			     raw store inventory. -->
			<div
				class="flex items-start gap-2 p-3 rounded-lg"
				style="background: var(--surface-raised); border: 1px solid var(--border-subtle);"
			>
				<Database size={14} class="mt-0.5 text-[var(--accent-service-main)] shrink-0" />
				<div class="flex-1 min-w-0">
					<Text size="xs" weight="semibold" class="block mb-0.5">
						Looking for search tuning?
					</Text>
					<Text size="xs" preset="flat">
						This devtool is the raw Qdrant store view. Search-side tuning
						(query encoder, rerank thresholds, RRO state) lives in the
						<a
							href="/devtools/clyffy/reasoning/rro"
							class="underline hover:text-[var(--accent-service-main)]"
						>
							RRO devtool
						</a>.
					</Text>
				</div>
				<a
					href="/devtools/clyffy/reasoning/rro"
					class="shrink-0 inline-flex items-center gap-1 text-xs hover:text-[var(--accent-service-main)]"
					title="Open RRO devtool"
				>
					<ArrowUpRight size={12} />
				</a>
			</div>

			<div class="flex items-center justify-between">
				<Text size="sm" weight="semibold">Vector store health</Text>
				<Button
					preset="ghost"
					size="sm"
					onclick={() => rroState.loadHealth()}
					disabled={rroState.healthLoading}
				>
					{#if rroState.healthLoading}
						<Spinner size="xs" tone="accent" />
					{:else}
						<RefreshCw size={14} />
					{/if}
					Refresh
				</Button>
			</div>

			{#if rroState.healthError}
				<InlineMessage tone="error">{rroState.healthError}</InlineMessage>
			{/if}

			{#if rroState.health}
				<div
					class="p-3 rounded-lg"
					style="background: var(--surface-raised); border: 1px solid var(--border-subtle);"
				>
					<div class="flex items-center justify-between mb-2">
						<div class="flex items-center gap-2">
							<Boxes size={14} class="text-[var(--accent-service-main)]" />
							<Text size="sm" weight="semibold">qdrant.vectors</Text>
						</div>
						<span
							class="inline-block w-2 h-2 rounded-full"
							style="background: var(--signal-success)"
						></span>
					</div>
					<div class="space-y-1 text-xs">
						<div class="flex justify-between">
							<span style="color: var(--text-secondary)">Storage path</span>
							<span class="font-mono text-[10px] truncate ml-2">
								{rroState.health.storage_path}
							</span>
						</div>
						<div class="flex justify-between">
							<span style="color: var(--text-secondary)">Collections</span>
							<span class="font-mono">{rroState.health.collections.length}</span>
						</div>
						<div class="flex justify-between">
							<span style="color: var(--text-secondary)">Total points</span>
							<span class="font-mono">{totalPoints.toLocaleString()}</span>
						</div>
					</div>
				</div>
			{:else if rroState.healthLoading}
				<Text size="sm" color="muted">Pinging Qdrant…</Text>
			{:else}
				<Text size="sm" color="muted">Click Refresh to check health.</Text>
			{/if}
		</div>
	{/snippet}

	{#snippet config()}
		<div class="space-y-3">
			<Text size="sm" color="muted">
				Qdrant runs in-process via the embedded RRO fork — no managed
				sidecar, no port. The store path comes from
				<code>[services.system.vector]</code> of <code>platform.toml</code>.
				Edit the TOML and restart the platform to relocate the store.
			</Text>
			<Text size="sm" color="muted">
				Per-collection settings (vector dimension, distance metric, HNSW
				parameters) live in each collection's metadata. The RRO devtool's
				Tuning tab is the editable surface; this devtool is read-only
				infrastructure status.
			</Text>
		</div>
	{/snippet}

	{#snippet logs()}
		<ScopedLogPanel target="rro" />
	{/snippet}

	{#snippet actions()}
		<div class="space-y-4">
			<Text size="sm" color="muted">
				Qdrant is in-process (no managed sidecar), so there's no
				start/stop. Refresh re-reads health from the live store.
				Collection-level destructive actions (create / delete /
				re-index) live in the RRO devtool's Collections panel,
				which has the layman-friendly delete-confirm gate.
			</Text>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
				<div
					class="p-3 rounded-lg"
					style="background: var(--surface-raised); border: 1px solid var(--border-subtle);"
				>
					<Text size="sm" weight="semibold">Refresh health</Text>
					<Text size="xs" color="muted" class="block mb-2">
						Re-ping the vector store and reload the collections list.
					</Text>
					<Button
						preset="primary"
						size="sm"
						onclick={() => rroState.loadHealth()}
						disabled={rroState.healthLoading}
					>
						{#if rroState.healthLoading}
							<Spinner size="xs" tone="accent" />
						{:else}
							<RefreshCw size={14} />
						{/if}
						Re-ping
					</Button>
				</div>

				<div
					class="p-3 rounded-lg"
					style="background: var(--surface-raised); border: 1px solid var(--border-subtle);"
				>
					<Text size="sm" weight="semibold">Manage collections</Text>
					<Text size="xs" color="muted" class="block mb-2">
						Create or delete collections via the RRO Collections panel.
					</Text>
					<a
						href="/devtools/clyffy/reasoning/rro"
						class="inline-flex items-center gap-1 text-xs px-2 py-1 rounded border border-[var(--border-subtle)] hover:border-[var(--accent-service-main)] hover:text-[var(--accent-service-main)]"
					>
						Open RRO Collections
						<ArrowUpRight size={12} />
					</a>
				</div>
			</div>
		</div>
	{/snippet}

	{#snippet debug()}
		<div class="space-y-4">
			<Text size="sm" color="muted">
				Power-user view of the embedded Qdrant client. The connection
				lives in the kernel's <code>cortex::persistence::rro</code>
				module via the <code>rro::QdrantInstance</code> fork.
			</Text>

			<div
				class="p-3 rounded-lg"
				style="background: var(--surface-raised); border: 1px solid var(--border-subtle);"
			>
				<Text size="sm" weight="semibold" class="block mb-2">Bridge state</Text>
				<div class="text-xs space-y-1">
					<div class="flex justify-between">
						<span style="color: var(--text-secondary)">Backend</span>
						<span class="font-mono">embedded (rro::QdrantInstance)</span>
					</div>
					<div class="flex justify-between">
						<span style="color: var(--text-secondary)">Tracing target</span>
						<span class="font-mono">rro</span>
					</div>
					<div class="flex justify-between">
						<span style="color: var(--text-secondary)">Engine service</span>
						<span class="font-mono">VectorService (system scope)</span>
					</div>
					<div class="flex justify-between">
						<span style="color: var(--text-secondary)">Last health</span>
						<span class="font-mono">
							{rroState.health ? "ok" : rroState.healthError ? "error" : "unchecked"}
						</span>
					</div>
				</div>
			</div>
		</div>
	{/snippet}

	{#snippet extra(tabId: string)}
		{#if tabId === "collections"}
			{@render collectionsBody()}
		{/if}
	{/snippet}
</ServiceDevtoolShell>

{#snippet collectionsBody()}
	<div class="space-y-4">
		<div class="flex items-center justify-between">
			<Text size="sm" weight="semibold">All collections</Text>
			<Button
				preset="ghost"
				size="sm"
				onclick={() => rroState.loadHealth()}
				disabled={rroState.healthLoading}
			>
				{#if rroState.healthLoading}
					<Spinner size="xs" tone="accent" />
				{:else}
					<RefreshCw size={14} />
				{/if}
				Refresh
			</Button>
		</div>

		{#if rroState.healthError}
			<div class="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400">
				{rroState.healthError}
			</div>
		{/if}

		{#if rroState.health && rroState.health.collections.length > 0}
			<div class="rounded-lg border border-[var(--border-subtle)] overflow-hidden">
				<table class="w-full text-xs">
					<thead>
						<tr
							class="border-b border-[var(--border-subtle)]"
							style="background: var(--surface-raised);"
						>
							<th class="text-left px-3 py-2 font-medium" style="color: var(--text-secondary)">
								Collection
							</th>
							<th class="text-right px-3 py-2 font-medium" style="color: var(--text-secondary)">
								Points
							</th>
						</tr>
					</thead>
					<tbody>
						{#each rroState.health.collections as col (col.name)}
							<tr class="border-b border-[var(--border-subtle)]">
								<td class="px-3 py-2 font-mono">{col.name}</td>
								<td class="px-3 py-2 text-right font-mono">
									{col.point_count.toLocaleString()}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
			<div class="flex items-center gap-2">
				<Badge variant="informative" size="sm" fillStyle="subtle">
					{totalPoints.toLocaleString()} total points
				</Badge>
				<a
					href="/devtools/clyffy/reasoning/rro"
					class="inline-flex items-center gap-1 text-xs hover:text-[var(--accent-service-main)]"
				>
					Manage in RRO
					<ArrowUpRight size={12} />
				</a>
			</div>
		{:else if rroState.healthLoading}
			<Text size="sm" color="muted">Loading collections…</Text>
		{:else}
			<Text size="sm" color="muted">
				No collections yet. Create one from the
				<a
					href="/devtools/clyffy/reasoning/rro"
					class="underline hover:text-[var(--accent-service-main)]"
				>
					RRO Collections panel
				</a>.
			</Text>
		{/if}
	</div>
{/snippet}
