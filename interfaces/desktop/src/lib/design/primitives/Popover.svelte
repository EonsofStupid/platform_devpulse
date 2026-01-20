<!--
  @file src/lib/design/primitives/Popover.svelte
  @layer primitives

  @description
  Bits UI Popover wrapper. Pure behavior primitive with NO styling.
  Styling comes from recipe classes applied by components/renderers.

  @since 1.0.0
-->
<script lang="ts">
  import { Popover } from "bits-ui";
  import type { Snippet } from "svelte";

  interface Props {
    /** Open state (bindable) */
    open?: boolean;
    /** Disable close on outside click */
    disableFocusTrap?: boolean;
    /** Portal target */
    portalTarget?: string | HTMLElement;
    /** Content classes from recipe */
    contentClass?: string;
    /** Trigger content */
    trigger?: Snippet;
    /** Popover content */
    children?: Snippet;
    /** Open change handler */
    onOpenChange?: (open: boolean) => void;
  }

  let {
    open = $bindable(false),
    disableFocusTrap = false,
    portalTarget,
    contentClass = "",
    trigger,
    children,
    onOpenChange,
  }: Props = $props();
</script>

<Popover.Root bind:open {disableFocusTrap} {onOpenChange}>
  {#if trigger}
    <Popover.Trigger>
      {@render trigger()}
    </Popover.Trigger>
  {/if}
  <Popover.Portal target={portalTarget}>
    <Popover.Content class={contentClass}>
      {#if children}
        {@render children()}
      {/if}
    </Popover.Content>
  </Popover.Portal>
</Popover.Root>
