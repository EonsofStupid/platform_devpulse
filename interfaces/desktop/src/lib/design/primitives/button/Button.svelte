<!--
	@component ButtonPrimitive
	@kind button
	@slot root
-->
<script lang="ts">
	import { cn } from "../_shared/cn.js";
	import type { ButtonPrimitiveProps } from "./button.props.js";

	let { children, class: className, ...rest }: ButtonPrimitiveProps = $props();
</script>

<button
	data-kind="button"
	data-slot="root"
	class={cn(className)}
	{...rest}
>
	{@render children?.()}
</button>
