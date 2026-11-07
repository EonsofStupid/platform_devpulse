<!--
  @component ContainerPrimitive
  @kind container
  @slot root
-->
<script lang="ts">
import { cn } from "../_shared/cn.js";
import type { ContainerPrimitiveProps } from "./container.props.js";

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
