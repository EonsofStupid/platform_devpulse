<!--
	@component EncoderPanel
	@kind sys.rro.feature
	@layer feature
	@description rag.embedder slot status — Burn encoder health + tier display.
-->
<script lang="ts">
import { Badge } from "@devpulse/coldlight/components/badge";
import { Card } from "@devpulse/coldlight/components/card";
import { Text } from "@devpulse/coldlight/components/text";
import { Brain, Shapes } from "lucide-svelte";
import { rroState } from "$lib/sys/data-access/rro/rro.state.svelte.js";
import { ReasoningTopology } from "../../../_shared/index.js";
import { CapabilityHeader, ErrorCallout, StatusRow } from "../../ui/index.js";

// Detect which Harrier tier is loaded from the assigned model ID.
const encoderTier = $derived((): { label: string; description: string } => {
	const id = rroState.encoder?.assigned_model_id ?? "";
	if (id.includes("270m") || id.includes("270M")) {
		return {
			label: "Harrier 270M",
			description: "Efficient — optimised for low-RAM machines",
		};
	}
	if (id.includes("0.6b") || id.includes("0.6B") || id.includes("0-6b")) {
		return {
			label: "Harrier 0.6B",
			description: "Full — default on mid-range and above",
		};
	}
	return { label: "Custom", description: id || "Unknown model" };
});

// True when the backend confirms Burn (the embedded cortex path, not a sidecar).
const isBurnBackend = $derived((rroState.encoder?.backend ?? "").toLowerCase() === "burn");
</script>

<Card preset="glass">
	<div class="p-3 space-y-3">
		{#snippet icon()}
			<Shapes size={14} class="text-[var(--accent-service-main)]" />
		{/snippet}
		<CapabilityHeader
			title="Search encoder"
			subtitle="Converts your text into searchable vectors — built into Clyffy, no network needed."
			{icon}
		/>

		<ErrorCallout prefix="Encoder check failed" message={rroState.encoderError} />

		<!-- Shared reasoning topology — same component the RRD devtool
		     uses. Compact mode hides the technical Badge under each
		     node so the panel reads tighter inside the RRO surface
		     where space is already shared with four other panels. -->
		<ReasoningTopology compact />

		{#if rroState.encoder}
			<div class="space-y-2">
				<StatusRow
					label="Status"
					detail="rag.embedder"
					ok={!!rroState.encoder.backend}
					okText="Ready"
					failText="Not loaded"
				/>

				{#if rroState.encoder.backend}
					<!-- Runtime badge — surface whether this is Burn (embedded cortex)
					     or a fallback backend, because it matters for offline capability. -->
					<div class="flex items-center justify-between gap-2">
						<Text size="xs" preset="flat">Runtime</Text>
						<div class="flex items-center gap-1.5">
							{#if isBurnBackend}
								<Brain size={12} class="text-[var(--accent-service-main)]" />
								<Badge variant="positive" size="sm">Cortex · embedded</Badge>
							{:else}
								<Badge variant="informative" size="sm">{rroState.encoder.backend}</Badge>
							{/if}
						</div>
					</div>

					<!-- Tier line — tells a non-technical user which size is running and why. -->
					<div class="flex items-center justify-between gap-2">
						<Text size="xs" preset="flat">Model</Text>
						<div class="flex flex-col items-end">
							<Text size="xs" weight="medium">{encoderTier().label}</Text>
							<Text size="xs" color="muted">{encoderTier().description}</Text>
						</div>
					</div>
				{/if}
			</div>
		{:else}
			<Text size="xs" preset="flat">
				Encoder not loaded — go to Slots and install a Harrier model into
				the Search Engine slot to activate search.
			</Text>
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
