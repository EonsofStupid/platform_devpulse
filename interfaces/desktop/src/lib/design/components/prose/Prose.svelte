<!--
	@component Prose
	@kind prose
	@layer component
	@category content
	@description Rich text container with typographic defaults for rendering long-form markdown or HTML content
	@container true
	@containerSlots root
	@compound false
	@blockCategory content
	@defaultStyle prose-default
	@styleIds prose-default
	@requiredAxes typography, color
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
import { StyleMacro } from "$lib/design/style/index.js";
import { cn } from "$lib/design/utils/cn.js";
import type { ProseComponentProps, ProseSize } from "./types.js";

const SIZE: Record<ProseSize, string> = {
	sm: "prose-sm",
	base: "prose",
	lg: "prose-lg",
};

let {
	size = "base",
	intent = "default",
	children,
	class: className,
	...rest
}: ProseComponentProps = $props();

const styleId = $derived(`prose-${intent}`);
</script>

<StyleMacro kind="prose" style={styleId}>
	<div
		data-kind="prose"
		data-slot="root"
		class={cn(SIZE[size] ?? SIZE.base, className)}
		{...rest}
	>
		{@render children?.()}
	</div>
</StyleMacro>
