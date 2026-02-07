<!--
	@component Breadcrumb
	@description Structural shell for breadcrumb primitive.
	Contract: kind="breadcrumb", slot="root", ariaStateProvider="coldlight"
-->
<script lang="ts">
import { cn, stripStyleProp } from "../types.js";
import type { BreadcrumbProps } from "./types.js";

let { children, class: className, ...rest }: BreadcrumbProps = $props();

if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "Breadcrumb");
</script>

<nav
	{...rest}
	data-kind="breadcrumb"
	data-slot="root"
	class={cn(className)}
>
	{@render children?.()}
</nav>
