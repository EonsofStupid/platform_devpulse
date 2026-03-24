<!--
	@component Empty State
	@kind empty-state
	@layer component
	@category content
	@description Placeholder display shown when a view has no data, with optional illustration and call to action
	@container true
	@containerSlots content
	@compound true
	@blockCategory content
	@defaultStyle empty-state-default
	@styleIds empty-state-default
	@requiredAxes color, typography
	@slots root:all, illustration:none, title:none, description:none, action:none
-->
<script lang="ts">
import { StyleMacro } from "$lib/design/style/index.js";
import { cn } from "$lib/design/utils/cn.js";
import type { EmptyStateProps, EmptyStateSize } from "./types.js";

const SIZE: Record<EmptyStateSize, string> = {
	sm: "py-8 px-4",
	md: "py-12 px-6",
	lg: "py-16 px-8",
};

let {
	size = "md",
	children,
	class: className,
	...rest
}: EmptyStateProps = $props();

const styleId = "empty-state-default";
</script>

<StyleMacro kind="empty-state" style={styleId}>
	<div
		data-kind="empty-state"
		data-slot="root"
		class={cn("flex flex-col items-center justify-center text-center", SIZE[size] ?? SIZE.md, className)}
		{...rest}
	>
		{@render children?.()}
	</div>
</StyleMacro>
