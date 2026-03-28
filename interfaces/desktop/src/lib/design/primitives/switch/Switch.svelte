<!--
  @component SwitchPrimitive
  @kind switch
  @slot root
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import type { SwitchPrimitiveProps } from "./types.js";

let { children, class: className, ...rest }: SwitchPrimitiveProps = $props();
</script>

<button
	data-kind="switch"
	data-slot="root"
	class={cn(className)}
	{...rest}
>
	{@render children?.()}
</button>
