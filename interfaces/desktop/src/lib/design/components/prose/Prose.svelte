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
	children,
	class: className,
	...rest
}: ProseComponentProps = $props();

const styleId = "prose-default";
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
