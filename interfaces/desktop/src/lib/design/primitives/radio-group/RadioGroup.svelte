<!--
  @component RadioGroupPrimitive
  @kind radio-group
  @slot root
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import type { RadioGroupPrimitiveProps } from "./types.js";

let { children, class: className, ...rest }: RadioGroupPrimitiveProps = $props();
</script>

<div
	data-kind="radio-group"
	data-slot="root"
	class={cn(className)}
	{...rest}
>
	{@render children?.()}
</div>
