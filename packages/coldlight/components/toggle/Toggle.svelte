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
import { toggleAnatomy } from "#coldlight/behaviors/inputs/toggle/index.js";
import { useToggle } from "#coldlight/behaviors/inputs/toggle/use-toggle.svelte.js";
import { styleAttrs } from "#coldlight/renderforge/index.js";
import { cn } from "#coldlight/utils/cn.js";
import { TOGGLE_DEFAULTS } from "./toggle.generated.js";
import type { ToggleProps } from "./types.js";

let {
	variant = TOGGLE_DEFAULTS.variant,
	size = TOGGLE_DEFAULTS.size,
	surface,
	pressed = false,
	onPressedChange,
	disabled = false,
	children,
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
</script>

<!-- Its look is toggle.tokens.json's generated CSS: the variant's role from the family in scope. class is layout. -->
<button
	{...toggleAnatomy.attrs.root}
	{...toggle.root}
	{...rest}
	{...styleAttrs({ kind: "toggle", variant, size, surface })}
	class={cn("inline-flex items-center justify-center", className)}
>
	{@render children?.()}
</button>
