<!--
	@component BreadcrumbsLink
	@kind breadcrumbs
	@slot link
	@layer components

	A step you can go back to.
-->
<script lang="ts">
import { getBreadcrumbsContext } from "./context.js";
import type { BreadcrumbsLinkProps } from "./types.js";

let { children, ...rest }: BreadcrumbsLinkProps = $props();

const ctx = getBreadcrumbsContext();
const attrs = $derived(ctx.hook.getLink(false));
</script>

<a {...attrs} {...rest}>
	{@render children?.()}
</a>
