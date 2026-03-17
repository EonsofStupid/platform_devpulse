<!--
  @component FlexPrimitive
  @kind flex
  @slot root
-->
<script lang="ts">
	import type { FlexPrimitiveProps } from "./flex.props.js";
	import { cn } from "../_shared/cn.js";

	let { children, class: className, ...rest }: FlexPrimitiveProps = $props();
</script>

<div
	data-kind="flex"
	data-slot="root"
	class={cn(className)}
	{...rest}
>
	{@render children?.()}
</div>
