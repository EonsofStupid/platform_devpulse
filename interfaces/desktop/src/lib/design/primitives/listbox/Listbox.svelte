<!--
  @component ListboxPrimitive
  @kind listbox
  @slot root
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import type { ListboxPrimitiveProps } from "./listbox.props.js";

let { children, class: className, ...rest }: ListboxPrimitiveProps = $props();
</script>

<div
	data-kind="listbox"
	data-slot="root"
	class={cn(className)}
	{...rest}
>
	{@render children?.()}
</div>
