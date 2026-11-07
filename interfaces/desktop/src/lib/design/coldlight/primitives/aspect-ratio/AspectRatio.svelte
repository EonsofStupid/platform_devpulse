<!--
  @component AspectRatioPrimitive
  @kind aspect-ratio
  @slot root
-->
<script lang="ts">
import { cn } from "../_shared/cn.js";
import type { AspectRatioPrimitiveProps } from "./aspect-ratio.props.js";

let { children, class: className, ...rest }: AspectRatioPrimitiveProps = $props();
</script>

<div
	data-kind="aspect-ratio"
	data-slot="root"
	class={cn(className)}
	{...rest}
>
	{@render children?.()}
</div>
