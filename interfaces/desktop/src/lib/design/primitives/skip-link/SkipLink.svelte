<script lang="ts">
	import type { SkipLinkProps } from "./types.js";
	import { cn, stripStyleProp } from "../types.js";

	let { children, class: className, href = "#main-content", ...rest }: SkipLinkProps = $props();

	$effect(() => { if (import.meta.env.DEV) stripStyleProp(rest as Record<string, unknown>, "SkipLink"); });
</script>

<a {href} data-kind="skip-link" data-slot="root" class={cn(className)} {...rest}>
	{@render children?.()}
</a>
