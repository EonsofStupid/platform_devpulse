<!--
  @component SpacerPrimitive
  @kind spacer
  @slot root
-->
<script lang="ts">
	import type { SpacerPrimitiveProps } from "./spacer.props.js";
	import { cn } from "../_shared/cn.js";

	let { children, class: className, ...rest }: SpacerPrimitiveProps = $props();
</script>

<div
	data-kind="spacer"
	data-slot="root"
	class={cn(className)}
	{...rest}
>
	{@render children?.()}
</div>
