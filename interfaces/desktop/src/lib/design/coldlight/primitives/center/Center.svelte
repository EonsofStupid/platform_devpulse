<!--
  @component CenterPrimitive
  @kind center
  @slot root
-->
<script lang="ts">
	import type { CenterPrimitiveProps } from "./center.props.js";
	import { cn } from "../_shared/cn.js";

	let { children, class: className, ...rest }: CenterPrimitiveProps = $props();
</script>

<div
	data-kind="center"
	data-slot="root"
	class={cn(className)}
	{...rest}
>
	{@render children?.()}
</div>
