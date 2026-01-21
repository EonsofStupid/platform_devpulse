<!--
  @file primitives/sheet/Sheet.test.svelte
  @layer primitives

  Test wrapper for Sheet primitive.
  Provides a complete sheet setup for testing.
-->
<script lang="ts">
  import * as Sheet from "./index.js";
  import type { SheetSide } from "./types.js";

  interface Props {
    /** Sheet open state (bindable) */
    open?: boolean;
    /** Side the sheet slides in from */
    side?: SheetSide;
    /** Trigger button text */
    triggerText?: string;
    /** Sheet title text */
    titleText?: string;
    /** Sheet description text */
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
    side = "right",
    triggerText = "Open Sheet",
    titleText = "Sheet Title",
    descriptionText = "Sheet description text.",
    closeText = "Close",
    closeOnEscape = true,
    closeOnOutsideClick = true,
    "data-id": dataId,
  }: Props = $props();
</script>

<Sheet.Root bind:open data-id={dataId}>
  <Sheet.Trigger>{triggerText}</Sheet.Trigger>
  <Sheet.Portal>
    <Sheet.Overlay />
    <Sheet.Content {side} {closeOnEscape} {closeOnOutsideClick}>
      <Sheet.Title>{titleText}</Sheet.Title>
      <Sheet.Description>{descriptionText}</Sheet.Description>
      <Sheet.Close>{closeText}</Sheet.Close>
    </Sheet.Content>
  </Sheet.Portal>
</Sheet.Root>
