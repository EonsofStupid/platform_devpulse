<!--
  @component TabsTrigger
  @kind tabs
  @slot trigger
  @description A tab button. Activates its associated panel. ARIA role="tab".
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import { getTabsPrimitiveContext } from "./context.js";
import type { TabsTriggerProps } from "./types.js";

let { value, disabled, children, class: className, ...rest }: TabsTriggerProps = $props();
const ctx = getTabsPrimitiveContext();

const triggerAttrs = $derived(ctx.hook.getTrigger(value, disabled));
</script>

<button
	{...triggerAttrs}
	{...rest}
	class={cn(className)}
>
	{@render children?.()}
</button>
