<!--
  @component MenuPrimitive
  @kind menu
  @slot root
-->
<script lang="ts">
import { cn } from "../_shared/cn.js";
import type { MenuPrimitiveProps } from "./menu.props.js";

let { children, class: className, ...rest }: MenuPrimitiveProps = $props();
</script>

<div
	data-kind="menu"
	data-slot="root"
	class={cn(className)}
	{...rest}
>
	{@render children?.()}
</div>
