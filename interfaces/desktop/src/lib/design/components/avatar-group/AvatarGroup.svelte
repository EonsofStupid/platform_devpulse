<!--
	@component AvatarGroup
	@kind avatar-group
	@layer components

	Layout container for overlapping avatars.
	Passes size to Avatar children via context.
	Shows +N overflow when maxVisible exceeded.
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import { createIds } from "$lib/design/_internal/utils/uid.js";
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
	class: className,
	...rest
}: AvatarGroupRootProps = $props();

const autoIds = createIds("avatar-group", ["root"] as const);
const rootId = userIds?.root ?? autoIds.root;

// Calculate overflow count
// If total is provided, use it. Otherwise maxVisible is just a hint for CSS.
const overflowCount = $derived(() => {
	if (total !== undefined && maxVisible !== undefined) {
		return Math.max(0, total - maxVisible);
	}
	return 0;
});

setAvatarGroupContext({
	get size() { return size; },
});

// Overlap is ~25% of avatar size
const overlapMargin = $derived(`-${Math.round(size * 0.25)}px`);
</script>

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

	{#if overflowCount() > 0}
		{#if overflow}
			{@render overflow(overflowCount())}
		{:else}
			<span
				class={cn()}
				data-kind="avatar-group"
				data-slot="overflow"
				aria-hidden="true"
				style:width="{size}px"
				style:height="{size}px"
			>
				+{overflowCount()}
			</span>
		{/if}
	{/if}
</div>
