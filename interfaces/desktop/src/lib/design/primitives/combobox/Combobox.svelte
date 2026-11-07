<!--
  @component ComboboxPrimitive
  @kind combobox
  @slot root
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import type { ComboboxPrimitiveProps } from "./types.js";

let { children, class: className, ...rest }: ComboboxPrimitiveProps = $props();
</script>

<div
	data-kind="combobox"
	data-slot="root"
	class={cn(className)}
	{...rest}
>
	{@render children?.()}
</div>
