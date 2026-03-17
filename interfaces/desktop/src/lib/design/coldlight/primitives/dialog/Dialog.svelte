<!--
  @component DialogPrimitive
  @kind dialog
  @slot root
-->
<script lang="ts">
	import type { DialogPrimitiveProps } from "./dialog.props.js";
	import { cn } from "../_shared/cn.js";

	let { children, class: className, ...rest }: DialogPrimitiveProps = $props();
</script>

<div
	data-kind="dialog"
	data-slot="root"
	class={cn(className)}
	{...rest}
>
	{@render children?.()}
</div>
