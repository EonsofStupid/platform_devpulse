<script lang="ts">
	import type { AlertProps } from "./types.js";
	import { cn, stripStyleProp } from "../types.js";

	let { children, class: className, ...rest }: AlertProps = $props();

	$effect(() => { if (import.meta.env.DEV) stripStyleProp(rest as Record<string, unknown>, "Alert"); });
</script>

<div data-kind="alert" data-slot="root" class={cn(className)} {...rest}>
	{@render children?.()}
</div>
