<!--
  @component SheetPrimitive
  @kind sheet
  @slot root
-->
<script lang="ts">
import { cn } from "../_shared/cn.js";
import type { SheetPrimitiveProps } from "./sheet.props.js";

let { children, class: className, ...rest }: SheetPrimitiveProps = $props();
</script>

<div
	data-kind="sheet"
	data-slot="root"
	class={cn(className)}
	{...rest}
>
	{@render children?.()}
</div>
