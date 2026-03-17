<!--
  @component ButtonPrimitive
  @kind button
  @slot root

  Raw structural shell. Sets data-kind + data-slot.
  Zero ARIA, zero behavior — those come from useButton() hook.
  Zero styling — that comes from the component layer.
-->
<script lang="ts">
	import type { ButtonPrimitiveProps } from "./button.props.js";
	import { cn } from "../_shared/cn.js";

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
