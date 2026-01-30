<!--
  @file Dialog.svelte
  @layer primitives
  @kind dialog
  @slot root

  Dialog root — manages open/closed state and shares builder via context.

  ColdLight OWNS:
  - data-kind="dialog", data-slot="root", data-state
  - Svelte context sharing (child slots access builder instance)

  Adapter (via cloak):
  - State management (open/close coordination)
  - Builder instance creation

  @example
  ```svelte
  <Dialog bind:open>
    <DialogTrigger>Open</DialogTrigger>
    <DialogPortal>
      <DialogOverlay />
      <DialogContent>
        <DialogTitle>Title</DialogTitle>
        <DialogDescription>Description</DialogDescription>
        <DialogClose>Close</DialogClose>
      </DialogContent>
    </DialogPortal>
  </Dialog>
  ```
-->
<script lang="ts">
  import { createDialog } from "$lib/design/taxonomy/.generated/imports.gen";
  import { setDialogContext } from "./context.js";
  import type { DialogProps } from "./types.js";

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
  // DIALOG FACTORY (via ColdLight cloak — adapter is invisible)
  // ===========================================================================

  const dialog = createDialog({
    defaultOpen: open,
    forceVisible: true,
  });

  const {
    states: { open: openState },
  } = dialog;

  // ===========================================================================
  // REACTIVE OPTION SYNC
  // Fixes state_referenced_locally warnings — props flow INTO MeltUI stores.
  // ===========================================================================

  $effect(() => {
    dialog.options.closeOnOutsideClick.set(closeOnOutsideClick);
  });

  $effect(() => {
    dialog.options.escapeBehavior.set(closeOnEscape ? "close" : "ignore");
  });

  $effect(() => {
    dialog.options.preventScroll.set(preventScroll);
  });

  // ===========================================================================
  // STATE SYNC (adapter → ColdLight)
  // ===========================================================================

  $effect(() => {
    const isOpen = $openState;
    if (isOpen !== open) {
      open = isOpen;
      onOpenChange?.(isOpen);
    }
  });

  // ===========================================================================
  // CONTEXT — child slot components access the builder instance
  // ===========================================================================

  setDialogContext(dialog);
</script>

<!-- Root slot with ColdLight data attributes -->
<div data-kind="dialog" data-slot="root" data-state={open ? "open" : "closed"}>
  {@render children?.()}
</div>
