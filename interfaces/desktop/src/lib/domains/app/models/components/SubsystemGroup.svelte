<!--
  @file SubsystemGroup — Collapsible group of slots for a subsystem.
  Uses renderForge for surface styling.
-->
<script lang="ts">
import { Text } from "$lib/design/components/text/index.js";
import { cssVarString, renderForge } from "$lib/design/renderforge/index.js";
import type { SlotInfo } from "../types/models.types.js";
import SlotRow from "./SlotRow.svelte";

interface Props {
	name: string;
	label: string;
	slots: SlotInfo[];
	layman?: boolean;
}

let { name, label, slots, layman = true }: Props = $props();

let collapsed = $state(false);

const m = $derived(renderForge({ kind: "subsystem-group", preset: "neutral" }));
</script>

<div class="flex flex-col gap-1">
	<button
		{...m.dataAttrs}
		style={cssVarString(m.cssVars)}
		class="flex items-center gap-2 rounded px-2 py-1.5 text-left transition-colors hover:brightness-110"
		onclick={() => (collapsed = !collapsed)}
	>
		<span
			class="text-xs transition-transform"
			style="color: var(--color); transform: rotate({collapsed ? '-90deg' : '0deg'});"
		>
			▼
		</span>
		<Text size="sm" weight="semibold" color="secondary">{label}</Text>
		<span class="text-xs" style="color: var(--color);">
			{slots.length} {slots.length === 1 ? "slot" : "slots"}
		</span>
	</button>

	{#if !collapsed}
		<div class="flex flex-col gap-1 pl-2">
			{#each slots as slot (slot.id)}
				<SlotRow {slot} {layman} />
			{/each}
		</div>
	{/if}
</div>
