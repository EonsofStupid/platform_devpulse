<!--
	@component Toggle
	@kind toggle
	@layer components

	ColdLight Toggle — MeltUI transport + 8-axis visual system.
-->
<script lang="ts">
import { createToggleTransport } from "$lib/design/api/dsadapters/meltui/_internal/toggle/index.js";
import { cn } from "$lib/design/utils/cn.js";
import { toggleRecipe } from "./recipe.js";
import type { ToggleProps } from "./types.js";

let {
	size = "md",
	pressed = false,
	onPressedChange,
	disabled = false,
	children,
	class: className,
	...rest
}: ToggleProps = $props();

const transport = createToggleTransport({
	get disabled() {
		return disabled;
	},
	get value() {
		return pressed;
	},
});

$effect(() => {
	if (onPressedChange && transport.states.pressed !== pressed) {
		onPressedChange(transport.states.pressed);
	}
});

const classes = $derived(cn(toggleRecipe({ size }), className));
</script>

<button
	{...transport.slots.trigger}
	{...rest}
	class={classes}
	data-kind="toggle"
	data-slot="root"
	data-state={transport.states.pressed ? "on" : "off"}
>
	{@render children?.()}
</button>
