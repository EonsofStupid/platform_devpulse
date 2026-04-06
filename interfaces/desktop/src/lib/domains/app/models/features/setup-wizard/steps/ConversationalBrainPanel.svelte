<!--
  @file ConversationalBrainPanel.svelte
  @module @devpulse/domains/app/models/features/setup-wizard/steps/ConversationalBrainPanel

  Voice brain slot UI. User-configurable in dev track.
  Shows voice.brain status, assigned model, and escalation chain concept.
-->
<script lang="ts">
import { Badge } from "$lib/design/components/badge/index.js";
import { Text } from "$lib/design/components/text/index.js";
import { box } from "$lib/design/utils/box/index.js";
import { cn } from "$lib/design/utils/cn.js";
import { hstack } from "$lib/design/utils/hstack/index.js";
import { stack } from "$lib/design/utils/stack/index.js";
import { modelsState } from "../../../runes/models.runes.svelte.js";
import { friendlySlotLabel, isInferenceReady, statusLabel } from "../../../types/models.types.js";
import { pickVariation } from "../seed-families.js";

const brainStatus = $derived(modelsState.statuses["voice.brain"] ?? { type: "cold" as const });
const brainModel = $derived(modelsState.assignedModel("voice.brain"));
const brainReady = $derived(isInferenceReady(brainStatus));
</script>

<div
	class={cn(box({ paddingX: "12", paddingY: "8" }), "rounded-lg w-full border")}
	style="background: var(--surface-base); border-color: var(--border-subtle);"
>
	<div class={stack({ gap: "4" })}>
		<div class={hstack({ gap: "3", align: "center" })}>
			<Text size="sm" weight="bold" color="primary">
				{friendlySlotLabel("voice.brain")}
			</Text>
			<Badge
				variant={brainReady ? "positive" : brainStatus.type === "failed" ? "negative" : "neutral"}
				size="sm"
			>
				{statusLabel(brainStatus)}
			</Badge>
		</div>

		<!-- Model info -->
		{#if brainModel}
			<Text size="xs" color="muted">{brainModel.filename}</Text>
		{:else}
			<Text size="xs" color="muted">No model assigned — assign one in the Models phase.</Text>
		{/if}

		<!-- Clyffy explanation -->
		<div
			class={cn(box({ paddingX: "8", paddingY: "6" }), "rounded border")}
			style="background: var(--surface-elevated); border-color: var(--border-subtle);"
		>
			<Text size="xs" color="secondary">
				{pickVariation("escalation.voice_brain")}
			</Text>
		</div>

		<!-- Escalation chain visualization -->
		<div class={stack({ gap: "1" })}>
			<Text size="xs" weight="bold" color="secondary">Escalation Chain</Text>
			<Text size="xs" color="muted">
				1. voice.brain (CPU, quick answers) → 2. chat.brain (GPU, deep reasoning) → 3. API (cloud fallback)
			</Text>
		</div>

		<!-- Status indicators -->
		<div class={hstack({ gap: "4", align: "center" })}>
			<Text size="xs" color="muted">
				Assigned: {brainModel ? "Yes" : "No"}
			</Text>
			<Text size="xs" color="muted">
				Ready: {brainReady ? "Yes" : "No"}
			</Text>
		</div>
	</div>
</div>
