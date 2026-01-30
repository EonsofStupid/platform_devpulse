<!--
  @file primitives/tabs/List.svelte
  @layer primitives

  Tabs list - container for tab triggers.

  ARIA (handled by Bits UI):
  - role="tablist"
  - aria-orientation

  Data Attributes:
  - data-kind="tabs"
  - data-slot="list"
-->
<script lang="ts">
	import { Tabs } from "meltui";
	import type { TabsListProps } from "./types.js";
	import { stripStyleProp, cn } from "../types.js";

	let {
		children,
		class: className = "",
		"data-id": dataId,
		...rest
	}: TabsListProps = $props();

	stripStyleProp(rest, "Tabs.List");
</script>

<Tabs.List {...rest}>
	{#snippet child({ props })}
		<div
			{...props}
			class={cn(props.class, className)}
			data-kind="tabs"
			data-slot="list"
			data-id={dataId}
		>
			{#if children}
				{@render children()}
			{/if}
		</div>
	{/snippet}
</Tabs.List>
