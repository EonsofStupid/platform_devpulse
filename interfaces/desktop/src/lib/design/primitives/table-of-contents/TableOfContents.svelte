<script lang="ts">
	import type { TableOfContentsRootProps } from "./types.js";
	import { cn, stripStyleProp } from "../types.js";

	let { children, class: className, ...rest }: TableOfContentsRootProps = $props();

	$effect(() => { if (import.meta.env.DEV) stripStyleProp(rest as Record<string, unknown>, "TableOfContents"); });
</script>

<nav data-kind="table-of-contents" data-slot="root" class={cn(className)} {...rest}>
	{@render children?.()}
</nav>
