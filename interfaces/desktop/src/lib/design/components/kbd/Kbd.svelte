<!--
	@component Keyboard Shortcut
	@kind kbd
	@layer component
	@category content
	@description Styled representation of a keyboard key or shortcut combination
	@container false
	@compound false
	@blockCategory content
	@defaultStyle kbd-default
	@styleIds kbd-default
	@requiredAxes backgroundColor, border, borderRadius, typography, color, shadow
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
import { StyleMacro } from "$lib/design/styles/index.js";
import { cn } from "$lib/design/utils/cn.js";
import type { KbdProps, KbdSize } from "./types.js";

const SIZE: Record<KbdSize, string> = {
	sm: "px-1 py-0.5 text-xs",
	md: "px-1.5 py-0.5 text-xs",
	lg: "px-2 py-1 text-sm",
};

let {
	intent = "default",
	size = "md",
	children,
	class: className,
	...rest
}: KbdProps = $props();

const styleId = $derived(`kbd-${intent}`);
</script>

<StyleMacro kind="kbd" style={styleId}>
	<kbd
		data-kind="kbd"
		data-slot="root"
		class={cn(
			"inline-flex items-center justify-center rounded border font-mono",
			SIZE[size] ?? SIZE.md,
			className)}
		{...rest}
	>
		{@render children?.()}
	</kbd>
</StyleMacro>
