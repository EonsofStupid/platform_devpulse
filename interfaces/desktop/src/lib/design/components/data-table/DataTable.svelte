<!--
	@component DataTable
	@kind data-table
	@layer components
	Hook (ARIA) + StyleMacro (visual).
-->
<script lang="ts">
import { useDataTable } from "$lib/design/primitives/data-table/index.js";
import { StyleMacro } from "$lib/design/style/index.js";
import { cn } from "$lib/design/utils/cn.js";
import type { DataTableComponentProps } from "./types.js";
let { size = "md", variant = "default", label, rowCount, colCount, children, class: className, ...rest }: DataTableComponentProps = $props();
const dt = $derived(useDataTable({ label, rowCount, colCount }));
const styleId = "data-table-default";
</script>
<StyleMacro kind="data-table" style={styleId}>
	<div {...dt.root} data-kind="data-table" data-slot="root" data-variant={variant} class={cn("w-full overflow-auto", className)} {...rest}>{@render children?.()}</div>
</StyleMacro>
