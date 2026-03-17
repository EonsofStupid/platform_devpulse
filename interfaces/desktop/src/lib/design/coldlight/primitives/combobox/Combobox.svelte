<!--
  @component ComboboxPrimitive
  @kind combobox
  @slot root
-->
<script lang="ts">
	import type { ComboboxPrimitiveProps } from "./combobox.props.js";
	import { cn } from "../_shared/cn.js";

	let { children, class: className, ...rest }: ComboboxPrimitiveProps = $props();
</script>

<div
	data-kind="combobox"
	data-slot="root"
	class={cn(className)}
	{...rest}
>
	{@render children?.()}
</div>
