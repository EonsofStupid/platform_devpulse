<!--
	@component ToggleGroup
	@kind toggle-group
	@layer components

	ColdLight ToggleGroup — builder-driven component.
	Builder owns ALL ARIA semantics. Component adds composition classes.

	Compound builder with slots: root, item (via getItem method).
	WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/
-->
<script lang="ts">
import { createToggleGroup } from "$lib/design/api/dsadapters/coldlight/_internal/toggle-group/index.js";
import ToggleGroupRoot from "$lib/design/primitives/toggle-group/ToggleGroup.svelte";
import { cn } from "$lib/design/utils/cn.js";
import { toggleGroupItemComposition, toggleGroupComposition } from "./composition.js";
import type { ToggleGroupComponentProps } from "./types.js";

let {
	size = "md",
	items = [],
	value,
	onValueChange,
	multiple = false,
	disabled = false,
	orientation = "horizontal",
	loop = true,
	children,
	class: className,
	...rest
}: ToggleGroupComponentProps = $props();

const builder = createToggleGroup({
	value: () => value,
		onValueChange: ((v: any) => (onValueChange as any)?.(v)) as any,
		multiple: () => multiple as any,
	disabled: () => disabled,
	orientation: () => orientation,
	loop: () => loop,
});

const rootClasses = $derived(
	cn(toggleGroupComposition({ size, orientation }), className));
const itemClasses = $derived(cn(toggleGroupItemComposition({ size })));
</script>

<ToggleGroupRoot {...builder.root} {...rest} class={rootClasses}>
	{#each items as item (item.value)}
		<button {...builder.getItem(item.value, item.disabled)} class={itemClasses}>
			{item.label}
		</button>
	{/each}
	{@render children?.()}
</ToggleGroupRoot>
