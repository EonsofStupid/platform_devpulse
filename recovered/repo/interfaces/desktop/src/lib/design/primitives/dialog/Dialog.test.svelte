<!--
  @file primitives/dialog/Dialog.test.svelte
  @layer primitives

  Test wrapper for Dialog primitive.
  Composes all slot components into a complete dialog for testing.
-->
<script lang="ts">
  import Dialog from "./Dialog.svelte";
  import DialogTrigger from "./DialogTrigger.svelte";
  import DialogPortal from "./DialogPortal.svelte";
  import DialogOverlay from "./DialogOverlay.svelte";
  import DialogContent from "./DialogContent.svelte";
  import DialogTitle from "./DialogTitle.svelte";
  import DialogDescription from "./DialogDescription.svelte";
  import DialogClose from "./DialogClose.svelte";

  interface Props {
    /** Dialog open state (bindable) */
    open?: boolean;
    /** Trigger button text */
    triggerText?: string;
    /** Dialog title text */
    titleText?: string;
    /** Dialog description text */
    descriptionText?: string;
    /** Close button text */
    closeText?: string;
    /** Close on escape */
    closeOnEscape?: boolean;
    /** Close on outside click */
    closeOnOutsideClick?: boolean;
  }

  let {
    open = $bindable(false),
    triggerText = "Open Dialog",
    titleText = "Dialog Title",
    descriptionText = "Dialog description text.",
    closeText = "Close",
    closeOnEscape = true,
    closeOnOutsideClick = true,
  }: Props = $props();
</script>

<Dialog bind:open {closeOnEscape} {closeOnOutsideClick}>
  <DialogTrigger>{triggerText}</DialogTrigger>
  <DialogPortal>
    <DialogOverlay />
    <DialogContent>
      <DialogTitle>{titleText}</DialogTitle>
      <DialogDescription>{descriptionText}</DialogDescription>
      <DialogClose>{closeText}</DialogClose>
    </DialogContent>
  </DialogPortal>
</Dialog>
