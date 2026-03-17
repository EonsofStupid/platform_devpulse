<!--
  @component SwitchPrimitive
  @kind switch
  @slot root
-->
<script lang="ts">
	import type { SwitchPrimitiveProps } from "./switch.props.js";
	import { cn } from "../_shared/cn.js";

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
