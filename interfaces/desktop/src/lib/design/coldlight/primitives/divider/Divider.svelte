<!--
  @component DividerPrimitive
  @kind divider
  @slot root
-->
<script lang="ts">
import { cn } from "../_shared/cn.js";
import type { DividerPrimitiveProps } from "./divider.props.js";

let { class: className, ...rest }: DividerPrimitiveProps = $props();
</script>

<hr
	data-kind="divider"
	data-slot="root"
	class={cn(className)}
	{...rest}
/>
