<!--
	@component Toggle
	@kind toggle
	@layer components

	Pressable toggle button. Hook (ARIA aria-pressed) + StyleMacro (visual).

	WAI-ARIA: button with aria-pressed
-->
<script lang="ts">
import { useToggle } from "$lib/design/primitives/toggle/use-toggle.svelte.js";
import { StyleMacro } from "$lib/design/style/index.js";
import { cn } from "$lib/design/utils/cn.js";
import type { ToggleProps } from "./types.js";

type ToggleSize = "sm" | "md" | "lg";

const SIZE: Record<ToggleSize, string> = {
	sm: "h-8 px-2 text-sm",
	md: "h-10 px-3 text-sm",
	lg: "h-12 px-4 text-base",
};

let {
	size = "md",
	pressed = false,
	onPressedChange,
	disabled = false,
	children,
	class: className,
	...rest
}: ToggleProps = $props();

const toggle = useToggle({
	get pressed() { return pressed; },
	get disabled() { return disabled; },
	onPressedChange: (v) => onPressedChange?.(v),
});

const styleId = "toggle-default";
</script>

<StyleMacro kind="toggle" style={styleId}>
	<button
		{...toggle.root}
		{...rest}
		data-kind="toggle"
		data-slot="root"
		class={cn(
			"inline-flex items-center justify-center rounded-md font-medium cursor-pointer",
			"focus-visible:outline-2 focus-visible:outline-offset-2",
			"disabled:pointer-events-none disabled:opacity-50",
			SIZE[size as ToggleSize] ?? SIZE.md,
			className)}
	>
		{@render children?.()}
	</button>
</StyleMacro>
