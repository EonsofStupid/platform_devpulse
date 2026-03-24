<!--
	@component Select.Group
	@kind select
	@slot group
	@layer components

	Groups related options with optional label.
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import type { SelectGroupProps } from "./types.js";

let { children, class: className, ...rest }: SelectGroupProps = $props();
</script>

<div
	role="group"
	data-kind="select"
	data-slot="group"
	class={cn(className)}
	{...rest}
>
	{@render children?.()}
</div>
