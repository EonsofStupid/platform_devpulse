<!--
	@component Toaster
	@kind toaster
	@layer components
	Hook (ARIA) + StyleMacro (visual).
-->
<script lang="ts">
import { useToaster } from "$lib/design/primitives/toaster/index.js";
import { StyleMacro } from "$lib/design/style/index.js";
import { cn } from "$lib/design/utils/cn.js";
import type { ToasterComponentProps } from "./types.js";
let { position = "bottom-right", closeDelay = 5000, children, class: className, ...rest }: ToasterComponentProps = $props();
const toaster = $derived(useToaster({ position }));
const styleId = "toaster-default";
</script>
<StyleMacro kind="toaster" style={styleId}>
	<div {...toaster.root} data-kind="toaster" data-slot="root" data-position={position} class={cn("fixed z-50 flex flex-col gap-2", className)} {...rest}>{@render children?.()}</div>
</StyleMacro>
