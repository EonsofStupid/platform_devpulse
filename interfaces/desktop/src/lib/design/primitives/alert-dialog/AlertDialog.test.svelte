<!--
  @file primitives/alert-dialog/AlertDialog.test.svelte
  @layer primitives

  Test wrapper for AlertDialog primitive.
  Provides a complete alert dialog setup for testing.
-->
<script lang="ts">
  import * as AlertDialog from "./index.js";

  interface Props {
    /** AlertDialog open state (bindable) */
    open?: boolean;
    /** Trigger button text */
    triggerText?: string;
    /** AlertDialog title text */
    titleText?: string;
    /** AlertDialog description text */
    descriptionText?: string;
    /** Action button text */
    actionText?: string;
    /** Cancel button text */
    cancelText?: string;
    /** Close on escape */
    closeOnEscape?: boolean;
    /** Interact outside behavior */
    interactOutsideBehavior?: "close" | "ignore";
    /** Callback when action is clicked */
    onAction?: () => void;
    /** Callback when open state changes */
    onOpenChange?: (open: boolean) => void;
    /** data-id for root */
    "data-id"?: string;
  }

  let {
    open = $bindable(false),
    triggerText = "Delete Item",
    titleText = "Are you absolutely sure?",
    descriptionText = "This action cannot be undone.",
    actionText = "Delete",
    cancelText = "Cancel",
    closeOnEscape = true,
    interactOutsideBehavior = "ignore",
    onAction,
    onOpenChange,
    "data-id": dataId,
  }: Props = $props();
</script>

<AlertDialog.Root bind:open {onOpenChange} data-id={dataId}>
  <AlertDialog.Trigger>{triggerText}</AlertDialog.Trigger>
  <AlertDialog.Portal>
    <AlertDialog.Overlay />
    <AlertDialog.Content {closeOnEscape} {interactOutsideBehavior}>
      <AlertDialog.Title>{titleText}</AlertDialog.Title>
      <AlertDialog.Description>{descriptionText}</AlertDialog.Description>
      <AlertDialog.Cancel>{cancelText}</AlertDialog.Cancel>
      <AlertDialog.Action onclick={onAction}>{actionText}</AlertDialog.Action>
    </AlertDialog.Content>
  </AlertDialog.Portal>
</AlertDialog.Root>
