<!--
	@component CollectionsPanel
	@kind sys.rro.feature
	@layer feature
	@description Knowledge store CRUD + health.
-->
<script lang="ts">
import { ArrowUpRight, Database, Plus, RefreshCw, Trash2 } from "lucide-svelte";
import { Badge } from "$lib/design/components/badge/index.js";
import { Button } from "$lib/design/components/button/index.js";
import { Card } from "$lib/design/components/card/index.js";
import { NumberField } from "$lib/design/components/number-field/index.js";
import { Spinner } from "$lib/design/components/spinner/index.js";
import { Text } from "$lib/design/components/text/index.js";
import { TextField } from "$lib/design/components/text-field/index.js";
import { rroState } from "$lib/sys/data-access/rro/rro.state.svelte.js";
import { CapabilityHeader, ErrorCallout } from "../../ui/index.js";

$effect(() => {
	if (rroState.deleteConfirm) {
		const timer = setTimeout(() => (rroState.deleteConfirm = null), 3000);
		return () => clearTimeout(timer);
	}
});
</script>

<Card preset="glass">
	<div class="p-3 space-y-3">
		{#snippet icon()}
			<Database size={14} class="text-[var(--accent-service-main)]" />
		{/snippet}
		{#snippet actions()}
			<Button
				preset="ghost"
				size="sm"
				onclick={() => rroState.loadHealth()}
				disabled={rroState.healthLoading}
			>
				{#if rroState.healthLoading}
					<Spinner size="xs" />
				{:else}
					<RefreshCw size={12} />
				{/if}
			</Button>
		{/snippet}
		<CapabilityHeader title="Your stores" {icon} {actions} />

		<ErrorCallout prefix="Couldn't load stores" message={rroState.healthError} />

		{#if rroState.health}
			<div class="text-xs space-y-1">
				<div>
					<Text size="xs" preset="flat">Saved at:</Text>
					<Text size="xs" weight="medium">{rroState.health.storage_path}</Text>
				</div>
				<a
					href="/devtools/system/datastores/qdrant"
					class="inline-flex items-center gap-1 text-xs hover:text-[var(--accent-service-main)]"
					title="Open the Qdrant store devtool — health, raw collection inventory, ops"
				>
					Open Qdrant store devtool
					<ArrowUpRight size={10} />
				</a>
			</div>

			{#if rroState.health.collections.length === 0}
				<Text size="xs" preset="flat">No stores yet. Create one below.</Text>
			{:else}
				<div class="space-y-1.5">
					{#each rroState.health.collections as col}
						<Card preset="flat">
							<div class="flex items-center justify-between p-2 gap-2">
								<div class="flex items-center gap-2 min-w-0">
									<Database size={12} class="text-[var(--accent-service-main)] shrink-0" />
									<Text size="sm" weight="medium">{col.name}</Text>
								</div>
								<div class="flex items-center gap-2">
									<Badge variant="informative" size="sm" fillStyle="subtle">
										{col.point_count.toLocaleString()} items
									</Badge>
									<Button
										preset={rroState.deleteConfirm === col.name ? "danger" : "ghost"}
										size="sm"
										onclick={() => rroState.deleteCollection(col.name)}
									>
										{#if rroState.deleteConfirm === col.name}
											Confirm delete
										{:else}
											<Trash2 size={12} />
										{/if}
									</Button>
								</div>
							</div>
						</Card>
					{/each}
				</div>
			{/if}
		{/if}
	</div>
</Card>

<Card preset="glass">
	<div class="p-3 space-y-3">
		{#snippet icon()}
			<Plus size={14} class="text-[var(--accent-service-main)]" />
		{/snippet}
		<CapabilityHeader
			title="Add a new store"
			subtitle="A store holds a set of searchable items (documents, code snippets, notes)."
			{icon}
		/>

		<div class="space-y-2">
			<TextField
				value={rroState.newCollectionName}
				onValueChange={(v) => (rroState.newCollectionName = v)}
				label="Store name"
				placeholder="e.g. docs, code, notes"
				size="sm"
			/>
			<NumberField
				value={rroState.newCollectionDimension}
				onValueChange={(v) => (rroState.newCollectionDimension = v)}
				min={64}
				max={4096}
				step={1}
				size="sm"
				aria-label="Vector dimensions"
			/>
			<Text size="xs" preset="flat">
				Dimension should match your encoder. 768 works for nomic-embed.
			</Text>
			<ErrorCallout prefix="Couldn't create store" message={rroState.createError} />
			<ErrorCallout prefix="Couldn't delete store" message={rroState.deleteError} />
			<Button
				preset="primary"
				size="sm"
				onclick={() => rroState.createCollection()}
				disabled={rroState.createLoading || !rroState.newCollectionName.trim()}
			>
				<Plus size={12} />
				Create store
			</Button>
		</div>
	</div>
</Card>
