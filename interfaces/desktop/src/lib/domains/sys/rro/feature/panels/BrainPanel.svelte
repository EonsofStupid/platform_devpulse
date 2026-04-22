<!--
	@component BrainPanel
	@kind sys.rro.feature
	@layer feature
	@description SurrealDB (the Brain) — 3 namespaces, knowledge table highlights.
-->
<script lang="ts">
import { Brain, RefreshCw } from "lucide-svelte";
import { Badge } from "$lib/design/components/badge/index.js";
import { Button } from "$lib/design/components/button/index.js";
import { Callout } from "$lib/design/components/callout/index.js";
import { Card } from "$lib/design/components/card/index.js";
import { Spinner } from "$lib/design/components/spinner/index.js";
import { StatusDot } from "$lib/design/components/status-dot/index.js";
import { Text } from "$lib/design/components/text/index.js";
import { rroState } from "../../data-access/rro.state.svelte.js";
import { CapabilityHeader, ErrorCallout, MetricCard } from "../../ui/index.js";
import { formatLatencyUs } from "../../util/rro.format.js";
import { BRAIN_NARRATION, KNOWLEDGE_TABLES } from "../../util/rro.narrations.js";
import type { GraphNamespace } from "../../util/rro.types.js";

const totalRecords = $derived(
	Object.values(rroState.brainStats).reduce((sum, s) => sum + Number(s.total_records), 0),
);
</script>

<Card preset="glass">
	<div class="p-3 space-y-3">
		{#snippet icon()}
			<Brain size={14} class="text-[var(--color-teal-400)]" />
		{/snippet}
		{#snippet actions()}
			<Button
				preset="ghost"
				size="sm"
				onclick={() => rroState.loadBrain()}
				disabled={rroState.brainLoading}
			>
				{#if rroState.brainLoading}
					<Spinner size="xs" />
				{:else}
					<RefreshCw size={12} />
				{/if}
			</Button>
		{/snippet}
		<CapabilityHeader title="The Brain" {icon} {actions} />
		<Text size="xs" preset="flat">{BRAIN_NARRATION.headline}</Text>
		<Text size="xs" preset="flat">{BRAIN_NARRATION.body}</Text>
	</div>
</Card>

<ErrorCallout prefix="Couldn't reach the Brain" message={rroState.brainError} />

{#if rroState.brainHealth}
	<Card preset="flat">
		<div class="p-3 flex items-center justify-between">
			<div class="flex items-center gap-2">
				<StatusDot tone={rroState.brainHealth.http_server_up ? "success" : "error"} />
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
		{@const copy = BRAIN_NARRATION.namespaces[ns as keyof typeof BRAIN_NARRATION.namespaces]}
		{@const stats = rroState.brainStats[ns]}
		<Card preset="glass">
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
						<StatusDot tone={pingEntry?.reachable ? "success" : "error"} />
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
											<Badge variant="accent" size="sm" fillStyle="bold" decorative>●</Badge>
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

	<MetricCard label="Total knowledge across all namespaces" value={totalRecords} />
{:else if rroState.brainLoading}
	<Text size="xs" preset="flat">Checking Brain health…</Text>
{/if}
