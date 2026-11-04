<!--
	@file StructureDevtool.svelte
	@module @devpulse/devtools/system/observability/structure

	The owner's strict-pattern layer, read live: each hub's contract, every
	state module, this window's subscriptions, the route inventory, the feature
	flags and the artifact catalog. Every row comes from `sys/contracts`,
	`sys/registries` or `sys/routing`; nothing here is typed by hand. Text is
	copy (`devtools.structure`).
-->
<script lang="ts">
import { EmptyState } from "@devpulse/coldlight/components/empty-state";
import { Table } from "@devpulse/coldlight/components/table";
import { Text } from "@devpulse/coldlight/components/text";
import { Blocks, Database, Flag, Map as MapIcon, Radio } from "lucide-svelte";
import { type ExtraTab, ServiceDevtoolShell } from "#lib/devtools/index.js";
import { flags } from "#lib/sys/cfg/flags.js";
import { copyState } from "#lib/sys/copy/index.js";
import { domainRegistry, stateRegistry, streamsRegistry } from "#lib/sys/registries/index.js";
import { routesInventory } from "#lib/sys/routing/index.js";
import { ARTIFACTS } from "../util/structure.artifacts.js";

const copy = $derived(copyState.catalog?.devtools.structure);

const extraTabs = $derived<ExtraTab[]>([
	{ id: "state", label: copy?.tab_state ?? "", Icon: Database },
	{ id: "streams", label: copy?.tab_streams ?? "", Icon: Radio },
	{ id: "routes", label: copy?.tab_routes ?? "", Icon: MapIcon },
	{ id: "flags", label: copy?.tab_flags ?? "", Icon: Flag },
	{ id: "artifacts", label: copy?.tab_artifacts ?? "", Icon: Blocks },
]);

const hubRows = $derived(
	[...domainRegistry.getAll().values()]
		.sort((a, b) => a.order - b.order)
		.map((hub) => [
			hub.id,
			hub.status,
			hub.owner,
			hub.features.join(", "),
			hub.defaultFeature ?? "",
			String(stateRegistry.getByOwner(hub.owner).length),
		]),
);

const stateRows = [...stateRegistry.getAll().values()].map((module) => [module.id, module.path]);

// The registry is a plain read model that messages update, so the table
// re-reads it once a second and whenever a subscription opens or closes.
let tick = $state(0);
$effect(() => {
	const refresh = (): void => {
		tick += 1;
	};
	const interval = setInterval(refresh, 1000);
	const unsubscribe = streamsRegistry.subscribe(refresh);
	return () => {
		clearInterval(interval);
		unsubscribe();
	};
});

const streamRows = $derived.by(() => {
	void tick;
	return [...streamsRegistry.getAll().values()].map((stream) => [
		stream.id,
		stream.type,
		stream.source,
		stream.status,
		stream.lastMessageAt?.toLocaleTimeString() ?? copy?.none_yet ?? "",
		stream.error ?? "",
	]);
});

const routeRows = $derived(
	Object.entries(routesInventory().groups).flatMap(([groupName, group]) =>
		Object.entries(group.hubs).flatMap(([hubName, hub]) =>
			hub.routes.map((route) => [groupName, hubName, route.path, route.label]),
		),
	),
);

const flagRows = $derived(
	Object.entries(flags).map(([name, value]) => [name, (value ? copy?.on : copy?.off) ?? ""]),
);

const artifactRows = ARTIFACTS.map((artifact) => [
	artifact.id,
	artifact.kind,
	artifact.hub,
	artifact.name,
]);
</script>

{#snippet table(label: string | undefined, headers: (string | undefined)[], rows: string[][])}
	<Table {label} size="sm">
		<thead>
			<tr>
				{#each headers as header, column (column)}
					<th class="px-2 py-1 text-left"><Text size="sm" weight="semibold">{header}</Text></th>
				{/each}
			</tr>
		</thead>
		<tbody>
			{#each rows as cells, row (row)}
				<tr class="border-t border-[var(--border-subtle)]">
					{#each cells as cell, column (column)}
						<td class="px-2 py-1"><Text size="sm">{cell}</Text></td>
					{/each}
				</tr>
			{/each}
		</tbody>
	</Table>
{/snippet}

<ServiceDevtoolShell {extraTabs}>
	{#snippet status()}
		{@render table(
			copy?.hubs_label,
			[
				copy?.col_hub,
				copy?.col_status,
				copy?.col_owner,
				copy?.col_features,
				copy?.col_default_feature,
				copy?.col_state_modules,
			],
			hubRows,
		)}
	{/snippet}

	{#snippet extra(tabId: string)}
		{#if tabId === "state"}
			{@render table(copy?.tab_state, [copy?.col_module, copy?.col_path], stateRows)}
		{:else if tabId === "streams"}
			<div class="flex flex-col gap-3">
				<Text size="sm" color="muted">{copy?.streams_note}</Text>
				{#if streamRows.length === 0}
					<EmptyState><Text size="sm" color="muted">{copy?.no_streams}</Text></EmptyState>
				{:else}
					{@render table(
						copy?.tab_streams,
						[
							copy?.col_stream,
							copy?.col_kind,
							copy?.col_source,
							copy?.col_status,
							copy?.col_last_message,
							copy?.col_error,
						],
						streamRows,
					)}
				{/if}
			</div>
		{:else if tabId === "routes"}
			{@render table(
				copy?.tab_routes,
				[copy?.col_group, copy?.col_hub, copy?.col_path, copy?.col_name],
				routeRows,
			)}
		{:else if tabId === "flags"}
			{@render table(copy?.tab_flags, [copy?.col_flag, copy?.col_value], flagRows)}
		{:else if tabId === "artifacts"}
			{@render table(
				copy?.tab_artifacts,
				[copy?.col_artifact, copy?.col_kind, copy?.col_hub, copy?.col_name],
				artifactRows,
			)}
		{/if}
	{/snippet}
</ServiceDevtoolShell>
