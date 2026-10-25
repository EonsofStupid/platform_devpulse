<!--
  @component DialogPrimitive
  @kind dialog
  @slot root
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import type { DialogPrimitiveProps } from "./types.js";

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
