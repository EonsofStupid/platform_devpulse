<!--
  @component BreadcrumbsPrimitive
  @kind breadcrumbs
  @slot root
-->
<script lang="ts">
	import type { BreadcrumbsPrimitiveProps } from "./breadcrumbs.props.js";
	import { cn } from "../_shared/cn.js";

	let { children, class: className, ...rest }: BreadcrumbsPrimitiveProps = $props();
</script>

<div
	data-kind="breadcrumbs"
	data-slot="root"
	class={cn(className)}
	{...rest}
>
	{@render children?.()}
</div>
