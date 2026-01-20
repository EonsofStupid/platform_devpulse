<!--
  @file primitives/Sheet.svelte
  @layer primitives

  Integration primitive: Slide-in panel (Dialog variant).
  Uses Bits UI Dialog with side positioning.

  A11y: Same as Dialog - focus trap, escape to close, focus return.
-->
<script lang="ts" module>
  export type SheetSide = "left" | "right" | "top" | "bottom";
</script>

<script lang="ts">
  import { Dialog } from "bits-ui";
  import type { Snippet } from "svelte";
  import type { OmitStyle, BaseProps } from "./types.js";
  import { stripStyleProp } from "./types.js";

  interface Props extends OmitStyle<HTMLDivElement>, BaseProps {
    /** Open state (bindable) */
    open?: boolean;
    /** Side the sheet slides in from */
    side?: SheetSide;
    /** Close on outside click */
    closeOnOutsideClick?: boolean;
    /** Close on escape key */
    closeOnEscape?: boolean;
    /** Prevent scroll when open */
    preventScroll?: boolean;
    /** Portal target */
    portalTarget?: string | HTMLElement;
    /** Overlay classes */
    overlayClass?: string;
    /** Content classes */
    contentClass?: string;
    /** Trigger slot */
    trigger?: Snippet;
    /** Sheet content */
    children?: Snippet;
    /** Open change handler */
    onOpenChange?: (open: boolean) => void;
  }

  let {
    open = $bindable(false),
    side = "right",
    closeOnOutsideClick = true,
    closeOnEscape = true,
    preventScroll = true,
    portalTarget,
    overlayClass = "",
    contentClass = "",
    trigger,
    children,
    onOpenChange,
    class: className = "",
    "data-id": id,
    ...rest
  }: Props = $props();

  stripStyleProp(rest, "Sheet");
</script>

<Dialog.Root
  bind:open
  {closeOnOutsideClick}
  {closeOnEscape}
  {preventScroll}
  {onOpenChange}
>
  {#if trigger}
    <Dialog.Trigger
      data-kind="primitive"
      data-name="Sheet"
      data-part="trigger"
    >
      {@render trigger()}
    </Dialog.Trigger>
  {/if}

  <Dialog.Portal target={portalTarget}>
    <Dialog.Overlay
      class={overlayClass}
      data-kind="primitive"
      data-name="Sheet"
      data-part="overlay"
    />
    <Dialog.Content
      class="{contentClass} {className}"
      data-kind="primitive"
      data-name="Sheet"
      data-part="content"
      data-side={side}
      data-id={id}
      {...rest}
    >
      {#if children}
        {@render children()}
      {/if}
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
