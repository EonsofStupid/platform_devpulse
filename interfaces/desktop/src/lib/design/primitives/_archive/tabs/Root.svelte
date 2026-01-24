<!--
  @file primitives/tabs/Root.svelte
  @layer primitives

  Tabs root - manages active tab state.

  Data Attributes:
  - data-kind="tabs"
  - data-slot="root"
  - data-orientation="horizontal" | "vertical"
-->
<script lang="ts">
	import { Tabs } from "bits-ui";
	import type { TabsRootProps, TabsOrientation } from "./types.js";
	import { stripStyleProp, cn } from "../types.js";

	let {
		value = $bindable(),
		onValueChange,
		orientation = "horizontal",
		activationMode = "automatic",
		loop = true,
		disabled = false,
		children,
		class: className = "",
		"data-id": dataId,
		...rest
	}: TabsRootProps = $props();

	stripStyleProp(rest, "Tabs.Root");
</script>

<Tabs.Root
	bind:value
	{onValueChange}
	{orientation}
	{activationMode}
	{loop}
	{disabled}
	{...rest}
>
	{#snippet child({ props })}
		<div
			{...props}
			class={cn(props.class, className)}
			data-kind="tabs"
			data-slot="root"
			data-orientation={orientation}
			data-id={dataId}
		>
			{#if children}
				{@render children()}
			{/if}
		</div>
	{/snippet}
</Tabs.Root>
