<!--
  @component AlertDialogPrimitive
  @kind alert-dialog
  @slot root
-->
<script lang="ts">
	import type { AlertDialogPrimitiveProps } from "./alert-dialog.props.js";
	import { cn } from "../_shared/cn.js";

	let { children, class: className, ...rest }: AlertDialogPrimitiveProps = $props();
</script>

<div
	data-kind="alert-dialog"
	data-slot="root"
	class={cn(className)}
	{...rest}
>
	{@render children?.()}
</div>
