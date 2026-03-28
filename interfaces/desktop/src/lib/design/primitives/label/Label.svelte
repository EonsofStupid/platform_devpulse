<!--
  @component LabelPrimitive
  @kind label
  @slot root
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import type { LabelPrimitiveProps } from "./types.js";

let { children, class: className, ...rest }: LabelPrimitiveProps = $props();
</script>

<label
	data-kind="label"
	data-slot="root"
	class={cn(className)}
	{...rest}
>
	{@render children?.()}
</label>
