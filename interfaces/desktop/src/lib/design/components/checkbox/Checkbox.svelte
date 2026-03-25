<!--
	@component Checkbox
	@kind checkbox
	@layer component
	@category interactive
	@description Binary or tri-state toggle control for selecting options in a form
	@aria https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/
	@container false
	@compound true
	@blockCategory form
	@defaultStyle checkbox-default
	@styleIds checkbox-default
	@requiredAxes backgroundColor, border, borderRadius, color
	@slots root:all, indicator:none, label:none
	@defaults {
		"background-color": "oklch(0.0901 0.017 224.61 / 0.8)",
		"border-radius": "0.75rem",
		"box-shadow": "0 0.0625rem 0.1875rem oklch(0 0 0 / 0.12), 0 0.0625rem 0.125rem oklch(0 0 0 / 0.24)",
		"color": "oklch(0.9319 0.015 224)",
		"border-color": "oklch(0.4234 0.081 173.37 / 0.22)",
		"border-width": "0.0625rem"
}
-->
<script lang="ts">
import { useCheckbox } from "$lib/design/primitives/checkbox/use-checkbox.svelte.js";
import { StyleMacro } from "$lib/design/styles/index.js";
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
