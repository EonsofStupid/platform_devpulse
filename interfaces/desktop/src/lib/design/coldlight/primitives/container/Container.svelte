<!--
  @component ContainerPrimitive
  @kind container
  @slot root
-->
<script lang="ts">
	import type { ContainerPrimitiveProps } from "./container.props.js";
	import { cn } from "../_shared/cn.js";

	let { children, class: className, ...rest }: ContainerPrimitiveProps = $props();
</script>

<div
	data-kind="container"
	data-slot="root"
	class={cn(className)}
	{...rest}
>
	{@render children?.()}
</div>
