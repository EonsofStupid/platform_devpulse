<!--
  @file Dialog.svelte
  @description Dialog root component.

  This is the root of the dialog primitive. It:
  - Creates the dialog builder via ColdLight adapter (no direct MeltUI import)
  - Shares state via Svelte context
  - Renders the root slot with ColdLight data attributes
-->
<script lang="ts">
  import { createDialogBuilder } from "$lib/design/api/adapters/coldlight/dialog";
  import { setDialogContext } from "./context";
  import type { DialogProps } from "./types";

  // ===========================================================================
  // PROPS
  // ===========================================================================

  interface Props extends DialogProps {
    children?: import("svelte").Snippet;
  }

  let {
    open = $bindable(false),
    onOpenChange,
    closeOnOutsideClick = true,
    closeOnEscape = true,
    preventScroll = true,
    children,
  }: Props = $props();

  // ===========================================================================
  // DIALOG BUILDER (via ColdLight adapter - MeltUI is internal)
  // ===========================================================================

  const dialog = createDialogBuilder({
    defaultOpen: open,
    closeOnOutsideClick,
    escapeBehavior: closeOnEscape ? "close" : "ignore",
    forceVisible: true,
    preventScroll,
  });

  const {
    states: { open: openState },
  } = dialog;

  // ===========================================================================
  // STATE SYNC
  // ===========================================================================

  $effect(() => {
    const isOpen = $openState;
    if (isOpen !== open) {
      open = isOpen;
      onOpenChange?.(isOpen);
    }
  });

  // ===========================================================================
  // CONTEXT
  // ===========================================================================

  setDialogContext(dialog);
</script>

<!-- Root slot with ColdLight data attributes -->
<div data-kind="dialog" data-slot="root" data-state={open ? "open" : ""}>
  {@render children?.()}
</div>
