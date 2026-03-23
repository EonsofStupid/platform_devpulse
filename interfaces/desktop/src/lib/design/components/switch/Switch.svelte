<!--
	@component Switch
	@kind switch
	@layer components

	ColdLight Switch — builder-driven, 8-axis visual system.
-->
<script lang="ts">
import { createSwitch } from "$lib/design/api/dsadapters/coldlight/_internal/switch/index.js";
import SwitchRoot from "$lib/design/primitives/switch/Switch.svelte";
import { cn } from "$lib/design/utils/cn.js";
import { switchRecipe, switchThumbRecipe } from "./recipe.js";
import type { SwitchProps } from "./types.js";

let {
	size = "md",
	checked = false,
	disabled = false,
	onCheckedChange,
	children,
	class: className,
	...rest
}: SwitchProps = $props();

const builder = createSwitch({
	checked: () => checked,
	disabled: () => disabled,
		onCheckedChange: (v: any) => onCheckedChange?.(v),
});

const classes = $derived(cn(switchRecipe({ size }), className));
const thumbClasses = $derived(switchThumbRecipe({ size, checked }));
</script>

<SwitchRoot {...builder.root} {...rest} class={classes}>
	<span {...builder.thumb} class={thumbClasses} data-slot="thumb"></span>
	{@render children?.()}
</SwitchRoot>
