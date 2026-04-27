<!--
	@component EncoderPanel
	@kind sys.rro.feature
	@layer feature
	@description rag.embedder slot status.
-->
<script lang="ts">
import { Shapes } from "lucide-svelte";
import { Card } from "$lib/design/components/card/index.js";
import { Text } from "$lib/design/components/text/index.js";
import { rroState } from "../../data-access/rro.state.svelte.js";
import { CapabilityHeader, ErrorCallout, StatusRow } from "../../ui/index.js";
</script>

<Card preset="glass">
	<div class="p-3 space-y-3">
		{#snippet icon()}
			<Shapes size={14} class="text-[var(--accent-service-main)]" />
		{/snippet}
		<CapabilityHeader
			title="Encoder status"
			subtitle="The encoder turns your text into searchable vectors."
			{icon}
		/>

		<ErrorCallout prefix="Encoder check failed" message={rroState.encoderError} />

		{#if rroState.encoder}
			<div class="space-y-2">
				<StatusRow
					label="Slot"
					detail="rag.embedder"
					ok={!!rroState.encoder.backend}
					okText="Ready"
					failText="Not loaded"
				/>
				{#if rroState.encoder.assigned_model_id}
					<div class="flex items-center justify-between gap-2">
						<Text size="xs" preset="flat">Model</Text>
						<Text size="xs" weight="medium">{rroState.encoder.assigned_model_id}</Text>
					</div>
				{/if}
				{#if rroState.encoder.backend}
					<div class="flex items-center justify-between">
						<Text size="xs" preset="flat">Engine</Text>
						<Text size="xs" weight="medium">{rroState.encoder.backend}</Text>
					</div>
				{/if}
			</div>
		{:else}
			<Text size="xs" preset="flat">Encoder slot not found.</Text>
		{/if}
	</div>
</Card>

{#if rroState.health}
	<Card preset="glass">
		<div class="p-3 space-y-2">
			<Text size="sm" weight="semibold">Overview</Text>
			<div class="flex items-center justify-between">
				<Text size="xs" preset="flat">Stores</Text>
				<Text size="xs" weight="medium">{rroState.health.collections.length}</Text>
			</div>
			<div class="flex items-center justify-between">
				<Text size="xs" preset="flat">Total items</Text>
				<Text size="xs" weight="medium">
					{rroState.health.collections
						.reduce((sum: number, c) => sum + Number(c.point_count), 0)
						.toLocaleString()}
				</Text>
			</div>
		</div>
	</Card>
{/if}
