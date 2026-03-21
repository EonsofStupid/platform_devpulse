<!--
	@component Alert.Description
	@kind alert
	@slot description
	@layer components
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import { getAlertContext } from "./context.js";
import type { AlertDescriptionProps } from "./types.js";

let { children, class: className, ...rest }: AlertDescriptionProps = $props();
const ctx = getAlertContext();
</script>

<p
	id={ctx.ids.description}
	data-kind="alert"
	data-slot="description"
	class={cn(ctx.classes.description, className)}
	{...rest}
>
	{@render children?.()}
</p>
