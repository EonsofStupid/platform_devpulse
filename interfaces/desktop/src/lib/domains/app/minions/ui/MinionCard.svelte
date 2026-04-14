<!--
  @file MinionCard — Single minion status card with model context.
  ALL styling via renderForge + cssVarString.
-->
<script lang="ts">
import { Text } from "$lib/design/components/text/index.js";
import { cssVarString, renderForge } from "$lib/design/renderforge/index.js";
import { hstack } from "$lib/design/utils/hstack/index.js";
import type { SemanticIntent } from "$lib/design/visual/preset-id.js";

interface Props {
	name: string;
	icon: string;
	status: "active" | "idle" | "escalated" | "signal";
	modelLabel: string;
	device: "CPU" | "GPU" | "on-demand";
	escalated?: boolean;
}

let { name, icon, status, modelLabel, device, escalated = false }: Props = $props();

const intent: SemanticIntent = $derived.by(() => {
	switch (status) {
		case "active":
			return "success";
		case "escalated":
			return "warning";
		case "idle":
			return "neutral";
		case "signal":
			return "info";
	}
});

const m = $derived(renderForge({ kind: "minion-card", preset: intent }));

const statusDot = $derived.by(() => {
	switch (status) {
		case "active":
			return "●";
		case "escalated":
			return "⚡";
		case "idle":
			return "○";
		case "signal":
			return "◎";
	}
});
</script>

<div
	{...m.dataAttrs}
	style={cssVarString(m.cssVars)}
	class="flex flex-col items-center gap-1 rounded-lg border px-2 py-2.5 transition-colors"
	style:min-width="5.625rem"
>
	<span class="text-xl">{icon}</span>
	<Text size="xs" weight="semibold" color="primary">{name}</Text>

	<div class={hstack({ gap: "1", align: "center" })}>
		<span class="text-xs" style="color: var(--color);">{statusDot}</span>
		<Text size="xs" color="muted">{status}</Text>
	</div>

	<Text size="xs" color="muted">{modelLabel}</Text>
	<Text size="xs" color="muted">{device}</Text>

	{#if escalated}
		<div class="mt-0.5 rounded px-1.5 py-0.5 text-xs font-medium" style="background: var(-bg); color: var(--color);">
			→ Brain
		</div>
	{/if}
</div>
