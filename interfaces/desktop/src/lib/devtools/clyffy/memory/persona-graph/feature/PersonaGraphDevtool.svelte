<!--
	@component PersonaGraphDevtool
	@kind clyffy.persona.feature
	@layer feature
	@description Clyffy's identity in SurrealDB namespaces — knowledge
	             graph view. Was previously a `brain` tab inside the
	             RRO devtool; relocated here per the locked
	             `project_devtool_modular_layout.md` direction (RRO is
	             the embedder + encoder + vector-store trifecta only;
	             persona/graph is a separate concern).

	             The data layer (`rroState.brainXxx`, `brain.svc.ts`)
	             still lives under `domains/sys/rro/` — that extraction
	             is a follow-up. The visible UI surface lives here in
	             the clyffy domain so the route hierarchy is honest.
-->
<script lang="ts">
import { Badge } from "@devpulse/coldlight/components/badge";
import { Button } from "@devpulse/coldlight/components/button";
import { Callout } from "@devpulse/coldlight/components/callout";
import { Card } from "@devpulse/coldlight/components/card";
import { Spinner } from "@devpulse/coldlight/components/spinner";
import { StatusDot } from "@devpulse/coldlight/components/status-dot";
import { Text } from "@devpulse/coldlight/components/text";
import { RefreshCw } from "lucide-svelte";
import { onMount } from "svelte";
import {
	BRAIN_NARRATION,
	formatLatencyUs,
	KNOWLEDGE_TABLES,
	rroState,
} from "$lib/devtools/clyffy/reasoning/rro/index.js";
import { type HealthBadge, ScopedLogPanel, ServiceDevtoolShell } from "$lib/devtools/index.js";

onMount(() => {
	if (!rroState.brainHealth && !rroState.brainLoading) {
		void rroState.loadBrain();
	}
});

// ── Header health badge ───────────────────────────────────
const badge = $derived<HealthBadge>(
	rroState.brainLoading
		? { state: "starting", label: "Checking persona graph…" }
		: rroState.brainError
			? { state: "down", label: "Graph unreachable" }
			: rroState.brainHealth
				? rroState.brainHealth.http_server_up
					? rroState.brainHealth.namespaces.every((n) => n.reachable)
						? { state: "up", label: "All namespaces ready" }
						: rroState.brainHealth.namespaces.some((n) => n.reachable)
							? { state: "degraded", label: "Some namespaces unreachable" }
							: { state: "down", label: "No namespaces reachable" }
					: { state: "down", label: "Knowledge API offline" }
				: { state: "unknown", label: "Not checked yet" },
);

const totalRecords = $derived(
	Object.values(rroState.brainStats).reduce((sum, s) => sum + Number(s.total_records), 0),
);
</script>

<ServiceDevtoolShell
	health={badge}
>
	<!-- ── STATUS — knowledge graph health + per-namespace cards -->
	{#snippet status()}
		<div class="space-y-3">
			<div class="flex items-center justify-between">
				<Text size="sm" weight="semibold">{BRAIN_NARRATION.headline}</Text>
				<Button
					variant="ghost"
					size="sm"
					onclick={() => rroState.loadBrain()}
					disabled={rroState.brainLoading}
				>
					{#if rroState.brainLoading}
						<Spinner size="xs" tone="accent" />
					{:else}
						<RefreshCw size={14} />
					{/if}
					Refresh
				</Button>
			</div>

			<Text size="xs" preset="flat">{BRAIN_NARRATION.body}</Text>

			{#if rroState.brainError}
				<Callout variant="error" preset="flat">
					<Text size="xs">Couldn't reach the graph: {rroState.brainError}</Text>
				</Callout>
			{/if}

			{#if rroState.brainHealth}
				<Card surface="flat" variant="minimal">
					<div class="p-3 flex items-center justify-between">
						<div class="flex items-center gap-2">
							<StatusDot
								status={rroState.brainHealth.http_server_up ? "ready" : "failed"}
							/>
							<Text size="sm" weight="medium">Knowledge API</Text>
						</div>
						<Badge
							variant={rroState.brainHealth.http_server_up ? "positive" : "negative"}
							size="sm"
							fillStyle="subtle"
						>
							{rroState.brainHealth.http_server_up ? "Online" : "Offline"}
						</Badge>
					</div>
				</Card>

				{#each rroState.brainNamespaces as ns (ns)}
					{@const pingEntry = rroState.brainHealth.namespaces.find(
						(n) => n.namespace.toLowerCase() === (ns as string).toLowerCase(),
					)}
					{@const copy =
						BRAIN_NARRATION.namespaces[ns as keyof typeof BRAIN_NARRATION.namespaces]}
					{@const stats = rroState.brainStats[ns]}
					<Card surface="glass" variant="deep">
						<div class="p-3 space-y-2">
							<div class="flex items-center justify-between">
								<div>
									<Text size="sm" weight="semibold">{copy.label}</Text>
									<Text size="xs" preset="flat">{copy.desc}</Text>
								</div>
								<Badge
									variant={pingEntry?.reachable ? "positive" : "negative"}
									size="sm"
									fillStyle="subtle"
								>
									<StatusDot status={pingEntry?.reachable ? "ready" : "failed"} />
									{pingEntry?.reachable ? "Ready" : "Unreachable"}
								</Badge>
							</div>

							{#if pingEntry && !pingEntry.reachable && pingEntry.error}
								<Callout variant="warning" preset="flat">
									<Text size="xs">{pingEntry.error}</Text>
								</Callout>
							{/if}

							{#if stats}
								<div class="flex items-center gap-2 text-xs flex-wrap">
									<Badge variant="informative" size="sm" fillStyle="outline">
										{stats.table_count} tables
									</Badge>
									<Badge variant="informative" size="sm" fillStyle="outline">
										{stats.total_records.toLocaleString()} records
									</Badge>
									{#if pingEntry}
										<Badge variant="neutral" size="sm" fillStyle="outline">
											{formatLatencyUs(pingEntry.latency_us)}
										</Badge>
									{/if}
								</div>

								{#if stats.tables.length > 0}
									<div class="space-y-1">
										{#each stats.tables as table}
											{@const desc = BRAIN_NARRATION.knowledgeTables[table.name]}
											{@const isKnowledge = KNOWLEDGE_TABLES.has(table.name)}
											<div
												class="flex items-center justify-between p-2 rounded bg-[var(--surface-base)]"
											>
												<div class="flex items-center gap-2 min-w-0">
													{#if isKnowledge}
														<Badge variant="accent" size="sm" fillStyle="bold" decorative
															>●</Badge
														>
													{/if}
													<div class="min-w-0">
														<Text size="xs" weight="medium">{table.name}</Text>
														{#if desc}
															<Text size="xs" preset="flat">{desc}</Text>
														{/if}
													</div>
												</div>
												<Text size="xs" preset="flat">
													{Number(table.record_count).toLocaleString()} rows
												</Text>
											</div>
										{/each}
									</div>
								{:else}
									<Text size="xs" preset="flat">No tables yet.</Text>
								{/if}
							{:else if pingEntry?.reachable}
								<Text size="xs" preset="flat">Loading tables…</Text>
							{/if}
						</div>
					</Card>
				{/each}

				<Card surface="flat" variant="minimal">
					<div class="p-3 flex items-center justify-between">
						<Text size="sm" weight="medium">Total knowledge</Text>
						<Text size="sm" weight="semibold">
							{totalRecords.toLocaleString()} records
						</Text>
					</div>
				</Card>
			{:else if rroState.brainLoading}
				<Text size="xs" preset="flat">Checking graph health…</Text>
			{/if}
		</div>
	{/snippet}

	<!-- ── LOGS — scoped log tail ───────────────────────────── -->
	{#snippet logs()}
		<ScopedLogPanel target="devtools.surreal" />
	{/snippet}
</ServiceDevtoolShell>
