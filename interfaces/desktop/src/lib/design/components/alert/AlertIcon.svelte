<!--
	@component Alert.Icon
	@kind alert
	@slot icon
	@layer components
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import { getAlertContext } from "./context.js";
import type { AlertIconProps } from "./types.js";

let { children, class: className, ...rest }: AlertIconProps = $props();
const ctx = getAlertContext();
</script>

<span
	id={ctx.ids.icon}
	data-kind="alert"
	data-slot="icon"
	class={cn(className)}
	aria-hidden="true"
	{...rest}
>
	{@render children?.()}
</span>
