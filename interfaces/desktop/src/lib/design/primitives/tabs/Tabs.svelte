<!--
  @component TabsRoot
  @kind tabs
  @layer primitive
  @category navigation
  @description Tab interface root. Manages selection state and provides context to child slots.
  @element div
  @slots root, list, trigger, content
  @spec tabs.spec.ts
  @hook useTabs
-->
<script lang="ts">
import { useTabs } from "$lib/design/behaviors/tabs/use-tabs.svelte.js";
import { cn } from "$lib/design/utils/cn.js";
import { enforceSlot } from "$lib/design/schema/enforce.js";
import { tabsSpec } from "./tabs.spec.js";
import { setTabsPrimitiveContext } from "./context.js";
import type { TabsRootProps } from "./types.js";

let {
	children,
	class: className,
	// Behavior props
	value,
	onValueChange,
	orientation,
	activateOnFocus,
	loop,
	// Rest
	...rest
}: TabsRootProps = $props();

const hook = useTabs({
	get value() { return value; },
	get orientation() { return orientation; },
	get activateOnFocus() { return activateOnFocus; },
	get loop() { return loop; },
	onValueChange,
});

setTabsPrimitiveContext({
	get hook() { return hook; },
});

let rootEl: HTMLDivElement | undefined = $state();

$effect(() => {
	if (import.meta.env.DEV && rootEl) {
		enforceSlot(rootEl, tabsSpec, "root");
	}
});
</script>

<div
	bind:this={rootEl}
	{...hook.root}
	{...rest}
	class={cn(className)}
>
	{@render children?.()}
</div>
