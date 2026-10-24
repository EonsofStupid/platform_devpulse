<!--
	@component PIN Input
	@kind pin-input
	@layer component
	@category interactive
	@description Segmented single-character input fields for entering verification codes, PINs, or one-time passwords.
	@aria https://www.w3.org/WAI/ARIA/apg/patterns/textbox/
	@container false
	@compound true
	@blockCategory form
	@defaultStyle pin-input-default
	@styleIds pin-input-default
	@requiredAxes backgroundColor, border, borderRadius, typography, color
	@slots root:all, cell:none, label:none
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
import { usePinInput } from "#coldlight/behaviors/inputs/pin-input/index.js";
import { cssVarString, renderForge } from "#coldlight/renderforge/index.js";
import { cn } from "#coldlight/utils/cn.js";
import type { PinInputComponentProps } from "./types.js";

let {
	preset = "default",
	size = "md",
	length = 4,
	value = "",
	onValueChange,
	onComplete,
	disabled = false,
	mask = false,
	placeholder = "\u25CB",
	class: className,
	"aria-label": ariaLabel = "Enter code",
	"aria-describedby": ariaDescribedBy,
	...rest
}: PinInputComponentProps = $props();

const pin = $derived(
	usePinInput({
		length,
		value,
		onValueChange,
		onComplete,
		disabled,
		mask,
		placeholder,
		"aria-label": ariaLabel,
	}),
);

const m = $derived(renderForge({ kind: "pin-input", preset }));

const SIZE: Record<NonNullable<PinInputComponentProps["size"]>, string> = {
	sm: "h-8 w-8 text-sm",
	md: "h-10 w-10 text-base",
	lg: "h-12 w-12 text-lg",
};

const cellClass = $derived(SIZE[size] ?? SIZE.md);
</script>

<div
	{...rest}
	{...pin.root}
	{...m.dataAttrs}
	aria-describedby={ariaDescribedBy}
	style={cssVarString(m.cssVars)}
	class={cn("inline-flex items-center gap-2", className)}
>
	{#each Array.from({ length }, (_, i) => i) as index (index)}
		<input
			{...pin.cell(index)}
			class={cn(
				"text-center font-medium tabular-nums rounded-md border outline-none",
				"bg-[var(--background-color)] text-[var(--color)] border-[var(--border-color)]",
				"focus-visible:outline-2 focus-visible:outline-offset-2",
				"disabled:opacity-50 disabled:pointer-events-none",
				cellClass,
			)}
		/>
	{/each}
</div>
