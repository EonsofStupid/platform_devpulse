<!--
  @file src/lib/design/primitives/Dialog.svelte
  @layer primitives

  @description
  Bits UI Dialog wrapper. Pure behavior primitive with NO styling.
  Styling comes from recipe classes applied by components/renderers.

  @since 1.0.0
-->
<script lang="ts">
  import { Dialog } from "bits-ui";
  import type { Snippet } from "svelte";

  interface Props {
    /** Open state (bindable) */
    open?: boolean;
    /** Close on outside click */
    closeOnOutsideClick?: boolean;
    /** Close on escape key */
    closeOnEscape?: boolean;
    /** Prevent scroll when open */
    preventScroll?: boolean;
    /** Portal target */
    portalTarget?: string | HTMLElement;
    /** Overlay classes from recipe */
    overlayClass?: string;
    /** Content classes from recipe */
    contentClass?: string;
    /** Dialog content */
    children?: Snippet;
    /** Close handler */
    onOpenChange?: (open: boolean) => void;
  }

  let {
    open = $bindable(false),
    closeOnOutsideClick = true,
    closeOnEscape = true,
    preventScroll = true,
    portalTarget,
    overlayClass = "",
    contentClass = "",
    children,
    onOpenChange,
  }: Props = $props();
</script>

<Dialog.Root
  bind:open
  {closeOnOutsideClick}
  {closeOnEscape}
  {preventScroll}
  {onOpenChange}
>
  <Dialog.Portal target={portalTarget}>
    <Dialog.Overlay class={overlayClass} />
    <Dialog.Content class={contentClass}>
      {#if children}
        {@render children()}
      {/if}
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
