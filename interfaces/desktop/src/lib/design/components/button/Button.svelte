<!--
	@component Button
	@kind button

	ColdLight Button — DUMB component.
	Primitive hook provides ARIA + keyboard.
	Recipe provides structural classes (size, intent).
	Visual treatment via class prop from caller (StyleMacro or v-* utilities).
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import { useButton } from "$lib/design/primitives/button/index.js";
import type { ButtonProps, ButtonSize, ButtonIntent } from "./button.types.js";

const SIZE_CLASSES: Record<ButtonSize, string> = {
	sm: "h-8 px-3 text-sm gap-1.5",
	md: "h-10 px-4 text-sm gap-2",
	lg: "h-12 px-6 text-base gap-2.5",
};

const INTENT_CLASSES: Record<ButtonIntent, string> = {
	primary: "bg-[var(--color-teal-600)] text-white hover:bg-[var(--color-teal-500)]",
	secondary: "bg-[var(--surface-elevated)] text-text-primary hover:bg-[var(--surface-hover)]",
	ghost: "bg-transparent text-text-secondary hover:bg-[var(--surface-hover)] hover:text-text-primary",
	danger: "bg-[var(--color-red-600)] text-white hover:bg-[var(--color-red-500)]",
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
	children,
	class: className,
	...rest
}: ButtonProps = $props();

const button = $derived(useButton({ disabled, loading, pressed, onPressedChange, expanded, type }));

const classes = $derived(cn(
	"btn",
	"inline-flex items-center justify-center font-medium",
	"focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current",
	"disabled:pointer-events-none disabled:opacity-50",
	"cursor-pointer select-none",
	"rounded-lg",
	"transition-colors duration-150",
	SIZE_CLASSES[size] ?? SIZE_CLASSES.md,
	INTENT_CLASSES[intent] ?? INTENT_CLASSES.primary,
	className,
));
</script>

<button
	{...button.root}
	{...rest}
	class={classes}
>
	{@render children?.()}
</button>
