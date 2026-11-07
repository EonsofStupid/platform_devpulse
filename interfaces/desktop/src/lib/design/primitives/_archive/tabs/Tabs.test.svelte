<!--
  @file primitives/tabs/Tabs.test.svelte
  @layer primitives

  Test wrapper for Tabs primitive.
  Provides a complete tabs setup for testing.
-->
<script lang="ts">
import * as Tabs from "./index.js";
import type { TabsActivationMode, TabsOrientation } from "./types.js";

interface Props {
	value?: string;
	onValueChange?: (value: string) => void;
	orientation?: TabsOrientation;
	activationMode?: TabsActivationMode;
	loop?: boolean;
	disabled?: boolean;
	tab1Disabled?: boolean;
	"data-id"?: string;
}

let {
	value = $bindable("tab1"),
	onValueChange,
	orientation = "horizontal",
	activationMode = "automatic",
	loop = true,
	disabled = false,
	tab1Disabled = false,
	"data-id": dataId,
}: Props = $props();
</script>

<Tabs.Root
	bind:value
	{onValueChange}
	{orientation}
	{activationMode}
	{loop}
	{disabled}
	data-id={dataId}
>
	<Tabs.List>
		<Tabs.Trigger value="tab1" disabled={tab1Disabled}>Tab 1</Tabs.Trigger>
		<Tabs.Trigger value="tab2">Tab 2</Tabs.Trigger>
		<Tabs.Trigger value="tab3">Tab 3</Tabs.Trigger>
	</Tabs.List>
	<Tabs.Content value="tab1">Content for Tab 1</Tabs.Content>
	<Tabs.Content value="tab2">Content for Tab 2</Tabs.Content>
	<Tabs.Content value="tab3">Content for Tab 3</Tabs.Content>
</Tabs.Root>
