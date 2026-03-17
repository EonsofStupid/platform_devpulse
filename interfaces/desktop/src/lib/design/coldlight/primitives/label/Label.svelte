<!--
  @component LabelPrimitive
  @kind label
  @slot root
-->
<script lang="ts">
	import type { LabelPrimitiveProps } from "./label.props.js";
	import { cn } from "../_shared/cn.js";

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
