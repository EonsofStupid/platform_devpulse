<!--
	@component List
	@kind list
	@layer components
	List container. Hook (ARIA) + StyleMacro (visual).
-->
<script lang="ts">
import { useList } from "$lib/design/primitives/list/index.js";
import { StyleMacro } from "$lib/design/style/index.js";
import { cn } from "$lib/design/utils/cn.js";
import type { ListComponentProps } from "./types.js";
let { size = "md", variant = "none", spacing = "default", label, children, class: className, ...rest }: ListComponentProps = $props();
const list = $derived(useList({ label }));
const styleId = "list-default";
</script>
<StyleMacro kind="list" style={styleId}>
	<ul {...list.root} data-kind="list" data-slot="root" data-variant={variant} class={cn("flex flex-col", className)} {...rest}>
		{@render children?.()}
	</ul>
</StyleMacro>
