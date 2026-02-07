<!--
	@component BreadcrumbLink
	@description Structural shell for breadcrumb navigation link.
	Contract: kind="breadcrumb", slot="link", ariaStateProvider="coldlight"
-->
<script lang="ts">
import { cn, stripStyleProp } from "../types.js";
import type { BreadcrumbLinkProps } from "./types.js";

let { children, class: className, ...rest }: BreadcrumbLinkProps = $props();

if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "BreadcrumbLink");
</script>

<a
	{...rest}
	data-kind="breadcrumb"
	data-slot="link"
	class={cn(className)}
>
	{@render children?.()}
</a>
