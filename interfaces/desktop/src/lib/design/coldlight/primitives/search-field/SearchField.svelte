<!--
  @component SearchFieldPrimitive
  @kind search-field
  @slot root
-->
<script lang="ts">
import { cn } from "../_shared/cn.js";
import type { SearchFieldPrimitiveProps } from "./search-field.props.js";

let { children, class: className, ...rest }: SearchFieldPrimitiveProps = $props();
</script>

<div
	data-kind="search-field"
	data-slot="root"
	class={cn(className)}
	{...rest}
>
	{@render children?.()}
</div>
