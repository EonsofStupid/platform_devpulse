<!--
  @component ProgressPrimitive
  @kind progress
  @slot root
-->
<script lang="ts">
	import type { ProgressPrimitiveProps } from "./progress.props.js";
	import { cn } from "../_shared/cn.js";

	let { children, class: className, ...rest }: ProgressPrimitiveProps = $props();
</script>

<div
	data-kind="progress"
	data-slot="root"
	class={cn(className)}
	{...rest}
>
	{@render children?.()}
</div>
