<!--
  @component SeparatorPrimitive
  @kind separator
  @slot root
-->
<script lang="ts">
	import type { SeparatorPrimitiveProps } from "./separator.props.js";
	import { cn } from "../_shared/cn.js";

	let { class: className, ...rest }: SeparatorPrimitiveProps = $props();
</script>

<hr
	data-kind="separator"
	data-slot="root"
	class={cn(className)}
	{...rest}
/>
