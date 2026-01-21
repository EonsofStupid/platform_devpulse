<!--
  @file primitives/tabs/Trigger.svelte
  @layer primitives

  Tabs trigger - individual tab button.

  ARIA (handled by Bits UI):
  - role="tab"
  - aria-selected="true/false"
  - aria-controls (links to content panel)
  - tabindex (roving tabindex pattern)

  Data Attributes:
  - data-primitive="tabs"
  - data-slot="trigger"
  - data-state="active" | "inactive"
  - data-value="{value}"
-->
<script lang="ts">
	import { Tabs } from "bits-ui";
	import type { TabsTriggerProps, TabsState } from "./types.js";
	import { stripStyleProp, cn } from "../types.js";

	let {
		value,
		disabled = false,
		children,
		class: className = "",
		"data-id": dataId,
		...rest
	}: TabsTriggerProps = $props();

	stripStyleProp(rest, "Tabs.Trigger");
</script>

<Tabs.Trigger {value} {disabled} {...rest}>
	{#snippet child({ props })}
		{@const dataState: TabsState = props["aria-selected"] === "true" ? "active" : "inactive"}
		<button
			{...props}
			class={cn(props.class, className)}
			data-primitive="tabs"
			data-slot="trigger"
			data-state={dataState}
			data-value={value}
			data-id={dataId}
		>
			{#if children}
				{@render children()}
			{/if}
		</button>
	{/snippet}
</Tabs.Trigger>
