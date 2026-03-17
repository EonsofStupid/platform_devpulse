<!--
  @component CheckboxPrimitive
  @kind checkbox
  @slot root
-->
<script lang="ts">
	import type { CheckboxPrimitiveProps } from "./checkbox.props.js";
	import { cn } from "../_shared/cn.js";

	let { children, class: className, ...rest }: CheckboxPrimitiveProps = $props();
</script>

<button
	data-kind="checkbox"
	data-slot="root"
	class={cn(className)}
	{...rest}
>
	{@render children?.()}
</button>
