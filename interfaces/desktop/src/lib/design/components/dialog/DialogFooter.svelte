<script lang="ts">
  import type { DialogFooterProps } from "./types.js";
  import { getDialogComponentContext } from "./context.js";
  import { cn } from "$lib/design/primitives/types.js";

  let { children, class: className, ...rest }: DialogFooterProps = $props();
  const { classes } = getDialogComponentContext();
</script>

<div {...rest} data-kind="dialog" data-slot="footer" class={cn(classes.footer, className)}>
  {@render children?.()}
</div>
