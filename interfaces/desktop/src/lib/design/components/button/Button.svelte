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
import { buttonAnatomy, useButton } from "$lib/design/behaviors/inputs/button/index.js";
import { cssVarString, renderForge } from "$lib/design/renderforge/index.js";
import { cn } from "$lib/design/utils/cn.js";
import type { ButtonProps, ButtonSize } from "./button.types.js";

/**
 * Sizing rides the fluid named tokens (S1.C) via arbitrary values — the
 * house idiom (see DialogContent / ContextualHelp / box()). The previous
 * Tailwind-convention numerics (`h-8 px-3 gap-1.5`) were a defect against
 * this repo's px-indexed `--spacing-*` scale: `h-8` resolved to ~8–10px
 * heights and `gap-2` to ~2px. Token minimums match the original intent
 * (`--size-sm` min = 32px = the old `h-8` intent) and scale with the
 * component's container (cqi). Gaps use the px-indexed numeric scale
 * (fluid: 6→7 / 8→10 / 10→12px).
 */
const SIZE: Record<ButtonSize, string> = {
	sm: "h-[var(--size-sm)] px-[var(--padding-sm-x)] text-[var(--font-size-sm)] gap-6",
	md: "h-[var(--size-md)] px-[var(--padding-md-x)] text-[var(--font-size-sm)] gap-8",
	lg: "h-[var(--size-lg)] px-[var(--padding-lg-x)] text-[var(--font-size-base)] gap-10",
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
