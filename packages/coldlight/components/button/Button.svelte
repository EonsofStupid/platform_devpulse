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
import { styleAttrs } from "#coldlight/renderforge/index.js";
import { cn } from "#coldlight/utils/cn.js";
import { BUTTON_DEFAULTS } from "./button.generated.js";
import type { ButtonProps } from "./button.types.js";

let {
	variant = BUTTON_DEFAULTS.variant,
	size = BUTTON_DEFAULTS.size,
	disabled = false,
	loading = false,
	pressed,
	defaultPressed,
	onPressedChange,
	expanded,
	type,
	children,
	class: className,
	...rest
}: ButtonProps = $props();

// Called once, reading props through getters: rebuilding it per prop change would reset its
// id and a toggle button's own pressed state.
const button = useButton({
	get disabled() {
		return disabled;
	},
	get loading() {
		return loading;
	},
	get pressed() {
		return pressed;
	},
	get defaultPressed() {
		return defaultPressed;
	},
	get expanded() {
		return expanded;
	},
	get type() {
		return type;
	},
	onPressedChange: (v) => onPressedChange?.(v),
});
</script>

<!-- Its look is button.tokens.json's generated CSS, selected by these attributes; class is layout. -->
<button
	{...buttonAnatomy.attrs.root}
	{...button.root}
	{...rest}
	{...styleAttrs({ kind: "button", variant, size })}
	class={cn("inline-flex items-center justify-center select-none", className)}
>
	{@render children?.()}
</button>
