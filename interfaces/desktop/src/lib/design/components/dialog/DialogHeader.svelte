<script lang="ts">
import { cn } from "$lib/design/primitives/types.js";
import { getDialogComponentContext } from "./context.js";
import type { DialogHeaderProps } from "./types.js";

let { children, class: className, ...rest }: DialogHeaderProps = $props();
const { classes } = getDialogComponentContext();
</script>

<div {...rest} data-kind="dialog" data-slot="header" class={cn(classes.header, className)}>
  {@render children?.()}
</div>
