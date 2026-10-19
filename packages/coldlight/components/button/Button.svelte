<!--
	@component Button
	@kind button
	@layer component
	@category interactive
	@description Clickable control that triggers an action or submits a form
	@aria https://www.w3.org/WAI/ARIA/apg/patterns/button/
	@container false
	@compound false
	@blockCategory form
	@defaultStyle button-default
	@styleIds button-default, button-primary, button-secondary, button-ghost, button-destructive, button-outline
	@requiredAxes backgroundColor, color, borderRadius, border, shadow, typography
	@slots root:all, icon:none, label:none
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
import { buttonAnatomy, useButton } from "#coldlight/behaviors/inputs/button/index.js";
import { cssVarString, renderForge } from "#coldlight/renderforge/index.js";
import { cn } from "#coldlight/utils/cn.js";
import type { ButtonProps, ButtonSize } from "./button.types.js";

const SIZE: Record<ButtonSize, string> = {
	sm: "h-8 px-3 text-sm gap-1.5",
	md: "h-10 px-4 text-sm gap-2",
	lg: "h-12 px-6 text-base gap-2.5",
};

let {
	preset = "primary",
	size = "md",
	disabled = false,
	loading = false,
	pressed,
	onPressedChange,
	expanded,
	type,
	children,
	class: className,
	...rest
}: ButtonProps = $props();

const button = $derived(useButton({ disabled, loading, pressed, onPressedChange, expanded, type }));

const m = $derived(renderForge({ kind: "button", preset }));
</script>

<button
	{...buttonAnatomy.attrs.root}
	{...button.root}
	{...rest}
	{...m.dataAttrs}
	style={cssVarString(m.cssVars)}
	class={cn(
		"inline-flex items-center justify-center font-medium cursor-pointer select-none",
		"focus-visible:outline-2 focus-visible:outline-offset-2",
		"disabled:pointer-events-none disabled:opacity-50",
		SIZE[size] ?? SIZE.md,
		className)}
>
	{@render children?.()}
</button>
