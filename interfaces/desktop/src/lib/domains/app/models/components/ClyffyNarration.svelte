<!--
  @file ClyffyNarration — Clyffy message bubble for model events.
  Glass surface with accent border-left. Visible, warm, layman-friendly.
  Uses renderForge for base resolution, accent colors per type.
-->
<script lang="ts">
import { Text } from "$lib/design/components/text/index.js";
import { cssVarString, renderForge } from "$lib/design/renderforge/index.js";
import type { SemanticIntent } from "$lib/design/visual/preset-id.js";

interface Props {
	message: string;
	type?: "info" | "success" | "warning" | "error";
}

let { message, type = "info" }: Props = $props();

const intentMap: Record<string, SemanticIntent> = {
	info: "info",
	success: "success",
	warning: "warning",
	error: "danger",
};

const m = $derived(
	renderForge({
		kind: "clyffy-narration",
		preset: intentMap[type] ?? "info",
	}),
);

/** Accent colors per type — all via token vars */
const accentMap: Record<string, { border: string; glow: string; icon: string }> = {
	info: {
		border: "var(--accent-teal-main)",
		glow: "var(--accent-teal-glow)",
		icon: "var(--accent-teal-main)",
	},
	success: {
		border: "var(--signal-success)",
		glow: "var(--signal-success)",
		icon: "var(--signal-success)",
	},
	warning: {
		border: "var(--signal-warning)",
		glow: "var(--signal-warning)",
		icon: "var(--signal-warning)",
	},
	error: {
		border: "var(--signal-error)",
		glow: "var(--signal-error)",
		icon: "var(--signal-error)",
	},
};

const accent = $derived(accentMap[type] ?? accentMap.info);
</script>

<div
	{...m.dataAttrs}
	style="{cssVarString(m.cssVars)} --narration-border: {accent.border}; --narration-glow: {accent.glow};"
	class="flex items-start gap-3 rounded-lg px-4 py-3"
	style:border-left="3px solid {accent.border}"
	style:background="var(--surface-base)"
	style:box-shadow="inset 3px 0 0.75rem -0.25rem {accent.glow}"
>
	<span
		class="mt-0.5 shrink-0 text-base leading-none"
		style="color: {accent.icon}; filter: drop-shadow(0 0 0.25rem {accent.glow});"
	>
		{#if type === "success"}✓{:else if type === "warning"}⚠{:else if type === "error"}✗{:else}💬{/if}
	</span>
	<Text size="sm" color="secondary" as="p" class="leading-relaxed">
		{message}
	</Text>
</div>
