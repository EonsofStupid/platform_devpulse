<!--
	@component Button
	@kind button

	ColdLight Button — S2 pattern.
	Hook provides ARIA + keyboard. useColdLight resolves visual encoding.
	This component is glue. Nothing else.
-->
<script lang="ts">
import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
import { cn } from "$lib/design/utils/cn.js";
import { useButton } from "./button.hook.svelte.js";
import { BUTTON_INTENT_PRESETS, type ButtonProps, type ButtonSize } from "./button.types.js";

const SIZE_CLASSES: Record<ButtonSize, string> = {
	sm: "h-8 px-3 text-sm gap-1.5",
	md: "h-10 px-4 text-sm gap-2",
	lg: "h-12 px-6 text-base gap-2.5",
};

let {
	intent = "primary",
	size = "md",
	pressed,
	onPressedChange,
	loading = false,
	disabled = false,
	expanded,
	type,
	preset,
	surface,
	material,
	depth,
	bevel,
	glow,
	frame,
	motion,
	transition,
	encoding,
	radius,
	children,
	class: className,
	...rest
}: ButtonProps = $props();

const button = $derived(useButton({ disabled, loading, pressed, onPressedChange, expanded, type }));

const visual = useColdLight(() => ({
	preset: preset ?? BUTTON_INTENT_PRESETS[intent as keyof typeof BUTTON_INTENT_PRESETS],
	surface,
	material,
	depth,
	bevel,
	glow,
	frame,
	motion,
	transition,
	encoding,
	radius: radius ?? "lg",
	size,
}));

const classes = $derived(cn(
	"btn",
	"inline-flex items-center justify-center font-medium",
	"focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current",
	"disabled:pointer-events-none disabled:opacity-50",
	"cursor-pointer select-none",
	SIZE_CLASSES[size] ?? SIZE_CLASSES.md,
	visual.segments,
	visual.radius,
	className,
));
</script>

<button
	{...button.root}
	{...rest}
	class={classes}
	data-encoding={visual.encoding || undefined}
>
	{@render children?.()}
</button>
