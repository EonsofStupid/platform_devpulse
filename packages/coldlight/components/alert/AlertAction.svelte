<!--
	@component Alert.Action
	@kind alert
	@slot action
	@layer components

	Action area — buttons, links placed in the alert.
-->
<script lang="ts">
import { cn } from "#coldlight/utils/cn.js";
import { getAlertContext } from "./context.js";
import type { AlertActionProps } from "./types.js";

let { children, class: className, ...rest }: AlertActionProps = $props();
const ctx = getAlertContext();
</script>

<div
	id={ctx.ids.action}
	data-kind="alert"
	data-slot="action"
	class={cn(className)}
	{...rest}
>
	{@render children?.()}
</div>
