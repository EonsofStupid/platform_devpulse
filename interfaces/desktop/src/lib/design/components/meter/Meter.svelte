<!--
	@component Meter
	@kind meter
	@layer component
	@category feedback
	@description Scalar measurement display within a known range
	@aria https://www.w3.org/WAI/ARIA/apg/patterns/meter/
	@container false
	@compound true
	@blockCategory feedback
	@defaultStyle meter-default
	@styleIds meter-default, meter-stark, meter-glass, meter-flat, meter-matte
	@requiredAxes backgroundColor, border, borderRadius, color
	@slots root:all, track:none, fill:none, label:none
	@defaults {
		"background-color": "var(--surface-base)",
		"border-radius": "0.75rem",
		"color": "var(--text-primary)"
}
-->
<script lang="ts">
import { meterAnatomy, useMeter } from "$lib/design/behaviors/display/meter/index.js";
import { cssVarString, renderForge } from "$lib/design/renderforge/index.js";
import { cn } from "$lib/design/utils/cn.js";
import type { MeterProps } from "./types.js";

let {
	value,
	min = 0,
	max = 100,
	optimum,
	low,
	high,
	label: labelText,
	getValueText,
	preset = "default",
	"aria-label": ariaLabel,
	"aria-labelledby": ariaLabelledby,
	class: className,
	...rest
}: MeterProps = $props();

const hook = useMeter({
	get value() {
		return value;
	},
	get min() {
		return min;
	},
	get max() {
		return max;
	},
	get optimum() {
		return optimum;
	},
	get low() {
		return low;
	},
	get high() {
		return high;
	},
	get getValueText() {
		return getValueText;
	},
	get "aria-label"() {
		return ariaLabel;
	},
	get "aria-labelledby"() {
		return ariaLabelledby;
	},
});

const m = $derived(renderForge({ kind: "meter", preset }));
</script>

<div
	{...meterAnatomy.attrs.root}
	{...hook.root}
	{...rest}
	{...m.dataAttrs}
	style={cssVarString(m.cssVars)}
	class={cn("flex flex-col gap-1", className)}
>
	{#if labelText}
		<label {...meterAnatomy.attrs.label} {...hook.label} class="text-sm font-medium">
			{labelText}
		</label>
	{/if}

	<div
		{...meterAnatomy.attrs.track}
		{...hook.track}
		class="relative h-2 w-full overflow-hidden rounded-full"
	>
		<div
			{...meterAnatomy.attrs.fill}
			{...hook.fill}
			class="absolute h-full rounded-full transition-all"
		></div>
	</div>
</div>
