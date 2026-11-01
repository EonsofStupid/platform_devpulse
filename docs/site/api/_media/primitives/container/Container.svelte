<script lang="ts">
	import type { ContainerProps } from "./types.js";
	import { cn, stripStyleProp } from "../types.js";

	let { children, class: className, ...rest }: ContainerProps = $props();

	if (import.meta.env.DEV) stripStyleProp(rest as Record<string, unknown>, "Container");
</script>

<div data-kind="container" data-slot="root" class={cn(className)} {...rest}>
	{@render children?.()}
</div>
