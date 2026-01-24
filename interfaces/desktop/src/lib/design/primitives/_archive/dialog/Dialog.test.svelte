<!--
  @file primitives/dialog/Dialog.test.svelte
  @layer primitives

  Test wrapper for Dialog primitive.
  Provides a complete dialog setup for testing.
-->
<script lang="ts">
  import * as Dialog from "./index.js";

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
    /** data-id for root */
    "data-id"?: string;
  }

  let {
    open = $bindable(false),
    triggerText = "Open Dialog",
    titleText = "Dialog Title",
    descriptionText = "Dialog description text.",
    closeText = "Close",
    closeOnEscape = true,
    closeOnOutsideClick = true,
    "data-id": dataId,
  }: Props = $props();
</script>

<Dialog.Root bind:open data-id={dataId}>
  <Dialog.Trigger>{triggerText}</Dialog.Trigger>
  <Dialog.Portal>
    <Dialog.Overlay />
    <Dialog.Content {closeOnEscape} {closeOnOutsideClick}>
      <Dialog.Title>{titleText}</Dialog.Title>
      <Dialog.Description>{descriptionText}</Dialog.Description>
      <Dialog.Close>{closeText}</Dialog.Close>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
