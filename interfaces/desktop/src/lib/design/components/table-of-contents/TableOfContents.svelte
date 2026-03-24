<!--
	@component TableOfContents
	@kind table-of-contents
	@layer components
	Hook (ARIA) + StyleMacro (visual).
-->
<script lang="ts">
import { useTableOfContents } from "$lib/design/primitives/table-of-contents/index.js";
import { StyleMacro } from "$lib/design/style/index.js";
import { cn } from "$lib/design/utils/cn.js";
import type { TableOfContentsComponentProps } from "./types.js";
let { label = "Table of contents", activeId, onActiveIdChange, size = "md", children, class: className, ...rest }: TableOfContentsComponentProps = $props();
const toc = $derived(useTableOfContents({ label }));
const styleId = "table-of-contents-default";
</script>
<StyleMacro kind="table-of-contents" style={styleId}>
	<nav {...toc.root} data-kind="table-of-contents" data-slot="root" class={cn("flex flex-col", className)} {...rest}>{@render children?.()}</nav>
</StyleMacro>
