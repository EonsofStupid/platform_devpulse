<!--
	@component Avatar Group
	@kind avatar-group
	@layer component
	@category content
	@description Horizontally stacked collection of avatars with overflow indicator for group display
	@container true
	@containerSlots root
	@compound false
	@blockCategory content
	@defaultStyle avatar-group-default
	@styleIds avatar-group-default
	@requiredAxes border
	@slots root:all, overflow:none
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
import { createIds } from "$lib/design/behaviors/_internal/utils/uid.js";
import { setAvatarGroupContext } from "./context.js";
import type { AvatarGroupRootProps } from "./types.js";

let {
	ids: userIds,
	size = 24,
	label,
	maxVisible,
	total,
	dir = "ltr",
	children,
	overflow,
	intent = "default",
	class: className,
	...rest
}: AvatarGroupRootProps = $props();

const autoIds = createIds("avatar-group", ["root"] as const);
const rootId = userIds?.root ?? autoIds.root;


const overflowCount = $derived.by(() => {
	if (total !== undefined && maxVisible !== undefined) {
		return Math.max(0, total - maxVisible);
	}
	return 0;
});

setAvatarGroupContext({
	get size() { return size; },
});

const overlapMargin = $derived(`-${Math.round(size * 0.25)}px`);
</script>

<StyleMacro kind="avatar-group" intent={intent}>
	<div
		id={rootId}
		{dir}
		role="group"
		aria-label={label}
		data-kind="avatar-group"
		data-slot="root"
		class={cn("flex items-center", className)}
		style:--avatar-group-overlap={overlapMargin}
		{...rest}
	>
		{@render children?.()}

		{#if overflowCount > 0}
			{#if overflow}
				{@render overflow(overflowCount)}
			{:else}
				<span
					data-kind="avatar-group"
					data-slot="overflow"
					aria-hidden="true"
					style:width="{size}px"
					style:height="{size}px"
				>
					+{overflowCount}
				</span>
			{/if}
		{/if}
	</div>
</StyleMacro>
