<script lang="ts">
	import type { EmptyStateProps } from "./types.js";
	import { cn, stripStyleProp } from "../types.js";

	let { children, class: className, ...rest }: EmptyStateProps = $props();

	$effect(() => { if (import.meta.env.DEV) stripStyleProp(rest as Record<string, unknown>, "EmptyState"); });
</script>

<div data-kind="empty-state" data-slot="root" class={cn(className)} {...rest}>
	{@render children?.()}
</div>
