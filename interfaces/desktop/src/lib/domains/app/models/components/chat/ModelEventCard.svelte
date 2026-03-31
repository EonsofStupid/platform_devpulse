<!--
  @file ModelEventCard — Renders model events in chat portal.
  ALL styling via resolveMacro + cssVarString.
-->
<script lang="ts">
import { X } from "lucide-svelte";
import { Text } from "$lib/design/components/text/index.js";
import { cssVarString, resolveMacro } from "$lib/design/style-macro/index.js";
import { hstack } from "$lib/design/utils/hstack/index.js";
import type { SemanticIntent } from "$lib/design/visual/preset-id.js";
import type { ModelStatus } from "../../types/models.types.js";
import { formatMb, friendlySlotLabel, statusLabel } from "../../types/models.types.js";

interface Props {
	slotId: string;
	status: ModelStatus;
	clyffyMessage: string;
	onDismiss?: () => void;
}

let { slotId, status, clyffyMessage, onDismiss }: Props = $props();

const icon = $derived.by(() => {
	switch (status.type) {
		case "loading":
			return "⏳";
		case "loaded":
			return "✅";
		case "failed":
			return "❌";
		case "unloading":
			return "📤";
		default:
			return "🧠";
	}
});

const intent: SemanticIntent = $derived.by(() => {
	switch (status.type) {
		case "loaded":
			return "success";
		case "loading":
			return "info";
		case "failed":
			return "danger";
		default:
			return "neutral";
	}
});

const m = $derived(resolveMacro({ kind: "model-event-card", preset: intent }));
const mNarration = $derived(resolveMacro({ kind: "model-event-narration", preset: "neutral" }));
</script>

<div
	{...m.dataAttrs}
	style={cssVarString(m.cssVars)}
	class="relative flex flex-col gap-2 rounded-lg border border-l-4 px-3 py-2.5"
>
	<div class={hstack({ justify: "between", align: "center" })}>
		<div class={hstack({ gap: "2", align: "center" })}>
			<span class="text-sm">{icon}</span>
			<Text size="xs" weight="semibold" color="secondary">
				MODEL {status.type === "loading" ? "LOADING" : status.type === "loaded" ? "READY" : status.type.toUpperCase()}
			</Text>
		</div>
		{#if onDismiss}
			<button class="rounded p-0.5 opacity-50 transition-colors hover:opacity-100" onclick={onDismiss}>
				<X size={12} />
			</button>
		{/if}
	</div>

	<div class={hstack({ gap: "2", align: "center" })}>
		<Text size="sm" color="primary">{friendlySlotLabel(slotId)}</Text>
		<Text size="xs" color="muted">{statusLabel(status)}</Text>
	</div>

	{#if status.type === "loading"}
		<div class="h-1.5 w-full overflow-hidden rounded-full opacity-30">
			<div class="h-full rounded-full transition-all duration-500" style="width: {status.progressPct}%; background: var(--color);"></div>
		</div>
	{/if}

	{#if status.type === "loaded"}
		<Text size="xs" color="muted">{formatMb(status.footprint.vramBytes / (1024 * 1024))} VRAM</Text>
	{/if}

	{#if status.type === "failed"}
		<Text size="xs" color="muted">{status.error}</Text>
	{/if}

	<div
		{...mNarration.dataAttrs}
		style={cssVarString(mNarration.cssVars)}
		class="flex items-start gap-1.5 border-t pt-1"
	>
		<span class="shrink-0 text-xs" style="color: var(--color);">💬</span>
		<Text size="xs" color="secondary" as="p" style="font-style: italic;">
			{clyffyMessage}
		</Text>
	</div>
</div>
