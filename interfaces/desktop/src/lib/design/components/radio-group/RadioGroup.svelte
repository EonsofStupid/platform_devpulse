<!--
	@component RadioGroup (Root)
	@kind radio-group
	@layer components

	Radio button group. Hook (ARIA) + StyleMacro (visual).
	Compound: Item, Label.

	WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/radio/
-->
<script lang="ts">
import { useRadioGroup } from "$lib/design/primitives/radio-group/use-radio-group.svelte.js";
import { StyleMacro } from "$lib/design/style/index.js";
import { cn } from "$lib/design/utils/cn.js";
import { setRadioGroupContext } from "./context.js";
import type { RadioGroupProps } from "./types.js";

let {
	value,
	onValueChange,
	disabled = false,
	required = false,
	loop = true,
	orientation = "vertical",
	children,
	class: className,
	...rest
}: RadioGroupProps = $props();

const hook = useRadioGroup({
	get value() { return value; },
	get disabled() { return disabled; },
	get required() { return required; },
	orientation,
	loop,
	onValueChange: (v) => onValueChange?.(v),
});

const styleId = "radio-group-default";

setRadioGroupContext({
	get hook() { return hook; },
});
</script>

<StyleMacro kind="radio-group" style={styleId}>
	<div
		{...hook.root}
		data-orientation={orientation}
		class={cn(
			"flex gap-2",
			orientation === "horizontal" ? "flex-row" : "flex-col",
			className)}
		{...rest}
	>
		{@render children?.()}
	</div>
</StyleMacro>
