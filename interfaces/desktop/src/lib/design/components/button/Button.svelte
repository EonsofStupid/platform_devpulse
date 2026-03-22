<!--
	@component Button
	@kind button

	DUMB component. Structure + ARIA + structural size.
	Primitive hook provides ARIA + keyboard + data-kind + data-slot.
	ZERO visual logic. ZERO colors. ZERO token references.
	Visual treatment via --cl-* cascade from StyleMacro (ui/ wrapper).
-->
<script lang="ts">
import { useButton } from "$lib/design/primitives/button/index.js";
import type { ButtonProps, ButtonSize } from "./button.types.js";

const SIZE: Record<ButtonSize, string> = {
	sm: "h-8 px-3 text-sm gap-1.5",
	md: "h-10 px-4 text-sm gap-2",
	lg: "h-12 px-6 text-base gap-2.5",
};

let {
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
</script>

<button
	{...button.root}
	{...rest}
	class="inline-flex items-center justify-center font-medium cursor-pointer select-none focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50 {SIZE[size] ?? SIZE.md} {className ?? ''}"
>
	{@render children?.()}
</button>
