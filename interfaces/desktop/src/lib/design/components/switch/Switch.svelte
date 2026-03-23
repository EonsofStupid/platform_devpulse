<!--
	@component Switch
	@kind switch
	@layer components

	On/off toggle. Hook (ARIA role="switch") + StyleMacro (visual).
	Controlled/uncontrolled checked state.

	WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/switch/
-->
<script lang="ts">
import { useSwitch } from "$lib/design/primitives/switch/use-switch.svelte.js";
import { StyleMacro } from "$lib/design/style/index.js";
import { cn } from "$lib/design/utils/cn.js";
import type { SwitchProps } from "./types.js";

type SwitchSize = "sm" | "md" | "lg";

const SIZE: Record<SwitchSize, { track: string; thumb: string }> = {
	sm: { track: "h-5 w-9", thumb: "size-3.5" },
	md: { track: "h-6 w-11", thumb: "size-4" },
	lg: { track: "h-7 w-13", thumb: "size-5" },
};

let {
	size = "md",
	checked = false,
	disabled = false,
	onCheckedChange,
	children,
	class: className,
	...rest
}: SwitchProps = $props();

const sw = useSwitch({
	get checked() { return checked; },
	get disabled() { return disabled; },
	onCheckedChange: (v) => onCheckedChange?.(v),
});

const styleId = "switch-default";
const sizeClasses = $derived(SIZE[size as SwitchSize] ?? SIZE.md);
</script>

<StyleMacro kind="switch" style={styleId}>
	<button
		{...sw.root}
		{...rest}
		data-kind="switch"
		data-slot="root"
		class={cn(
			"relative inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent",
			"transition-colors focus-visible:outline-2 focus-visible:outline-offset-2",
			"disabled:pointer-events-none disabled:opacity-50",
			sizeClasses.track,
			className)}
	>
		<span
			{...sw.thumb}
			data-kind="switch"
			data-slot="thumb"
			class={cn(
				"pointer-events-none block rounded-full shadow-sm transition-transform",
				sizeClasses.thumb)}
		></span>
		{@render children?.()}
	</button>
</StyleMacro>
