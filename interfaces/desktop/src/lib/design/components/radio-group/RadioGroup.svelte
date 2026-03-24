<!--
	@component Radio Group
	@kind radio-group
	@layer component
	@category interactive
	@description Mutually exclusive option set where only one item can be selected at a time
	@aria https://www.w3.org/WAI/ARIA/apg/patterns/radio/
	@container false
	@compound true
	@blockCategory form
	@defaultStyle radio-group-default
	@styleIds radio-group-default
	@requiredAxes backgroundColor, border, borderRadius, color, typography
	@slots root:all, item:none, indicator:none, label:none
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
