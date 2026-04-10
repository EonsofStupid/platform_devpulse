<!--
	@component Toggle
	@kind toggle
	@layer component
	@category interactive
	@description Pressable button that toggles between an active and inactive state
	@aria https://www.w3.org/WAI/ARIA/apg/patterns/button/
	@container false
	@compound false
	@blockCategory form
	@defaultStyle toggle-default
	@styleIds toggle-default
	@requiredAxes backgroundColor, border, borderRadius, color
	@slots root:all
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
import { toggleAnatomy } from "$lib/design/behaviors/inputs/toggle/index.js";
import { useToggle } from "$lib/design/behaviors/inputs/toggle/use-toggle.svelte.js";
import { cssVarString, renderForge } from "$lib/design/renderforge/index.js";
import { cn } from "$lib/design/utils/cn.js";
import type { ToggleProps, ToggleSize } from "./types.js";

const SIZE: Record<ToggleSize, string> = {
	sm: "h-8 px-2 text-sm",
	md: "h-10 px-3 text-sm",
	lg: "h-12 px-4 text-base",
};

let {
	size = "md",
	pressed = false,
	onPressedChange,
	disabled = false,
	children,
	preset = "default",
	class: className,
	...rest
}: ToggleProps = $props();

const toggle = useToggle({
	get pressed() {
		return pressed;
	},
	get disabled() {
		return disabled;
	},
	onPressedChange: (v) => onPressedChange?.(v),
});

const m = $derived(renderForge({ kind: "toggle", preset }));
</script>

<button
		{...toggleAnatomy.attrs.root}
		{...toggle.root}
		{...rest}
		{...m.dataAttrs}
		style={cssVarString(m.cssVars)}
		class={cn(
			"inline-flex items-center justify-center rounded-md font-medium cursor-pointer",
			"focus-visible:outline-2 focus-visible:outline-offset-2",
			"disabled:pointer-events-none disabled:opacity-50",
			SIZE[size] ?? SIZE.md,
			className)}
	>
		{@render children?.()}
	</button>
