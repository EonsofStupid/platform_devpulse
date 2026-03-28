<!--
  @component BreadcrumbsPrimitive
  @kind breadcrumbs
  @slot root
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import type { BreadcrumbsPrimitiveProps } from "./types.js";

let { children, class: className, ...rest }: BreadcrumbsPrimitiveProps = $props();
</script>

<nav
	data-kind="breadcrumbs"
	data-slot="root"
	class={cn(className)}
	{...rest}
>
	{@render children?.()}
</nav>
