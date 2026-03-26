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
import type { EmptyStateProps, EmptyStateSize } from "./types.js";

const SIZE: Record<EmptyStateSize, string> = {
	sm: "py-8 px-4",
	md: "py-12 px-6",
	lg: "py-16 px-8",
};

let {
	intent = "default",
	size = "md",
	children,
	class: className,
	...rest
}: EmptyStateProps = $props();

</script>

<StyleMacro kind="empty-state" intent={intent}>
	<div
		data-kind="empty-state"
		data-slot="root"
		class={cn("flex flex-col items-center justify-center text-center", SIZE[size] ?? SIZE.md, className)}
		{...rest}
	>
		{@render children?.()}
	</div>
</StyleMacro>
