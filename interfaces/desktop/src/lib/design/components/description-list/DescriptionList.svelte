<!--
	@component DescriptionList
	@kind description-list
	@layer components
	Hook (ARIA) + StyleMacro (visual).
-->
<script lang="ts">
import { useDescriptionList } from "$lib/design/primitives/description-list/index.js";
import { StyleMacro } from "$lib/design/style/index.js";
import { cn } from "$lib/design/utils/cn.js";
import type { DescriptionListComponentProps } from "./types.js";
let { size = "md", variant = "default", label, children, class: className, ...rest }: DescriptionListComponentProps = $props();
const dl = $derived(useDescriptionList({ label }));
const styleId = "description-list-default";
</script>
<StyleMacro kind="description-list" style={styleId}>
	<dl {...dl.root} data-kind="description-list" data-slot="root" data-variant={variant} class={cn(className)} {...rest}>{@render children?.()}</dl>
</StyleMacro>
