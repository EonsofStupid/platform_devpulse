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
-->
<script lang="ts">
import { StyleMacro } from "$lib/design/style/index.js";
import { cn } from "$lib/design/utils/cn.js";
import type { KbdProps, KbdSize } from "./types.js";

const SIZE: Record<KbdSize, string> = {
	sm: "px-1 py-0.5 text-xs",
	md: "px-1.5 py-0.5 text-xs",
	lg: "px-2 py-1 text-sm",
};

let {
	size = "md",
	children,
	class: className,
	...rest
}: KbdProps = $props();

const styleId = "kbd-default";
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
