<!--
  @component TogglePrimitive
  @kind toggle
  @slot root
-->
<script lang="ts">
	import type { TogglePrimitiveProps } from "./toggle.props.js";
	import { cn } from "../_shared/cn.js";

	let { children, class: className, ...rest }: TogglePrimitiveProps = $props();
</script>

<button
	data-kind="toggle"
	data-slot="root"
	class={cn(className)}
	{...rest}
>
	{@render children?.()}
</button>
