<!--
  @file primitives/tabs/Content.svelte
  @layer primitives

  Tabs content - panel that displays when tab is active.

  ARIA (handled by Bits UI):
  - role="tabpanel"
  - aria-labelledby (links to trigger)
  - tabindex="0" (focusable)

  Data Attributes:
  - data-kind="tabs"
  - data-slot="content"
  - data-state="active" | "inactive"
  - data-value="{value}"
-->
<script lang="ts">
	import { Tabs } from "bits-ui";
	import type { TabsContentProps, TabsState } from "./types.js";
	import { stripStyleProp, cn } from "../types.js";

	let {
		value,
		children,
		class: className = "",
		"data-id": dataId,
		...rest
	}: TabsContentProps = $props();

	stripStyleProp(rest, "Tabs.Content");
</script>

<Tabs.Content {value} {...rest}>
	{#snippet child({ props })}
		{@const dataState: TabsState = props["data-state"] === "active" ? "active" : "inactive"}
		<div
			{...props}
			class={cn(props.class, className)}
			data-kind="tabs"
			data-slot="content"
			data-state={dataState}
			data-value={value}
			data-id={dataId}
		>
			{#if children}
				{@render children()}
			{/if}
		</div>
	{/snippet}
</Tabs.Content>
