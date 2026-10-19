<!--
	@component Alert.Title
	@kind alert
	@slot title
	@layer components
-->
<script lang="ts">
import { cn } from "#coldlight/utils/cn.js";
import { getAlertContext } from "./context.js";
import type { AlertTitleProps } from "./types.js";

let { children, class: className, ...rest }: AlertTitleProps = $props();
const ctx = getAlertContext();
</script>

<h5
	id={ctx.ids.title}
	data-kind="alert"
	data-slot="title"
	class={cn(className)}
	{...rest}
>
	{@render children?.()}
</h5>
