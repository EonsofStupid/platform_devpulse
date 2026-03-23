<!--
	@component Checkbox
	@kind checkbox
	@layer components

	Hook (ARIA) + StyleMacro (visual).
	Tri-state: checked, unchecked, indeterminate.

	WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/
-->
<script lang="ts">
import { useCheckbox } from "$lib/design/primitives/checkbox/use-checkbox.svelte.js";
import { StyleMacro } from "$lib/design/style/index.js";
import { cn } from "$lib/design/utils/cn.js";
import type { CheckboxProps, CheckboxSize } from "./types.js";

const SIZE: Record<CheckboxSize, string> = {
	sm: "size-4",
	md: "size-5",
	lg: "size-6",
};

let {
	intent = "default",
	size = "md",
	checked = false,
	indeterminate = false,
	disabled = false,
	onCheckedChange,
	children,
	class: className,
	...rest
}: CheckboxProps = $props();

const checkbox = useCheckbox({
	get checked() { return checked; },
	get indeterminate() { return indeterminate; },
	get disabled() { return disabled; },
	onCheckedChange: (v) => onCheckedChange?.(v),
});

const styleId = $derived(`checkbox-${intent}`);
</script>

<StyleMacro kind="checkbox" style={styleId}>
	<button
		{...checkbox.root}
		{...rest}
		data-kind="checkbox"
		data-slot="root"
		class={cn(
			"inline-flex items-center justify-center rounded border cursor-pointer",
			"focus-visible:outline-2 focus-visible:outline-offset-2",
			"disabled:pointer-events-none disabled:opacity-50",
			SIZE[size] ?? SIZE.md,
			className)}
	>
		<span {...checkbox.indicator} data-kind="checkbox" data-slot="indicator">
			{@render children?.()}
		</span>
	</button>
</StyleMacro>
