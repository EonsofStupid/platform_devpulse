<!--
	@component Switch
	@kind switch
	@layer component
	@category interactive
	@description Toggle control for switching between two mutually exclusive states like on and off
	@aria https://www.w3.org/WAI/ARIA/apg/patterns/switch/
	@container false
	@compound true
	@blockCategory form
	@defaultStyle switch-default
	@styleIds switch-default
	@requiredAxes backgroundColor, border, borderRadius, color
	@slots root:all, thumb:none, label:none
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
import { switchAnatomy } from "#coldlight/behaviors/inputs/switch/index.js";
import { useSwitch } from "#coldlight/behaviors/inputs/switch/use-switch.svelte.js";
import { styleAttrs } from "#coldlight/renderforge/index.js";
import { cn } from "#coldlight/utils/cn.js";
import { mergeProps } from "#coldlight/utils/merge-props.js";
import { SWITCH_DEFAULTS } from "./switch.generated.js";
import type { SwitchProps, SwitchSize } from "./types.js";

const SIZE: Record<SwitchSize, { track: string; thumb: string }> = {
	sm: { track: "h-5 w-9", thumb: "size-3.5 data-[state=checked]:translate-x-4.5" },
	md: { track: "h-6 w-11", thumb: "size-4 data-[state=checked]:translate-x-6" },
	lg: { track: "h-7 w-13", thumb: "size-5 data-[state=checked]:translate-x-7" },
};

let {
	variant = SWITCH_DEFAULTS.variant,
	surface,
	size = "md",
	checked,
	defaultChecked,
	disabled = false,
	onCheckedChange,
	onclick,
	children,
	class: className,
	...rest
}: SwitchProps = $props();

// Controlled when `checked` is given, otherwise the switch holds its state (from `defaultChecked`).
const sw = useSwitch({
	get checked() {
		return checked;
	},
	get defaultChecked() {
		return defaultChecked;
	},
	get disabled() {
		return disabled;
	},
	onCheckedChange: (v) => onCheckedChange?.(v),
});

const sizeClasses = $derived(SIZE[size] ?? SIZE.md);

// The caller's handlers add to the behavior's (mergeProps chains them); its click runs after the
// behavior's and not while disabled.
const attrs = $derived(
	mergeProps(switchAnatomy.attrs.root, sw.root, rest, {
		onclick: disabled ? undefined : onclick,
	}),
);
</script>

<!-- Its look is switch.tokens.json's generated CSS: off, the variant's role from the family in scope. class is layout: sizes and the thumb's travel, which assumes no padding. -->
<button
		{...attrs}
		{...styleAttrs({ kind: "switch", variant, surface })}
		class={cn("relative box-border inline-flex shrink-0 items-center p-0", sizeClasses.track, className)}
	>
		<span
			{...switchAnatomy.attrs.thumb}
			{...sw.thumb}
			class={cn("pointer-events-none block transition-transform", sizeClasses.thumb)}
		></span>
		{@render children?.()}
	</button>
