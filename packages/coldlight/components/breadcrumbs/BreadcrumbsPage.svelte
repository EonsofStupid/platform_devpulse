<!--
	@component BreadcrumbsPage
	@kind breadcrumbs
	@slot link
	@layer components

	The current page: not a link, aria-current="page".
-->
<script lang="ts">
import { breadcrumbsAnatomy } from "#coldlight/behaviors/navigation/breadcrumbs/index.js";
import type { BreadcrumbsPageProps } from "./types.js";

let { children, ...rest }: BreadcrumbsPageProps = $props();
</script>

<span {...breadcrumbsAnatomy.attrs.link} aria-current="page" data-current="" data-tone="current" {...rest}>
	{@render children?.()}
</span>
