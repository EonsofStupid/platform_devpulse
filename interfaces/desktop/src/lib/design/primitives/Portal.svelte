<!--
  @file primitives/Portal.svelte
  @layer primitives

  Renders children outside normal DOM hierarchy.
  SSR-safe: No-op on server, activates only in browser.
-->
<script lang="ts">
  import { Portal as BitsPortal } from "bits-ui";
  import type { Snippet } from "svelte";
  import type { OmitStyle, BaseProps } from "./types.js";

  interface Props extends OmitStyle<HTMLDivElement>, BaseProps {
    /** Portal target (CSS selector or element). Defaults to body. */
    to?: string | HTMLElement;
    /** Disable portal (render in place) */
    disabled?: boolean;
    children?: Snippet;
  }

  let {
    to,
    disabled = false,
    children,
    class: className = "",
    "data-id": id,
  }: Props = $props();

  // SSR check
  const isBrowser = typeof window !== "undefined";
</script>

{#if disabled || !isBrowser}
  <!-- SSR or disabled: render in place -->
  <div
    class={className}
    data-kind="primitive"
    data-name="Portal"
    data-part="root"
    data-id={id}
  >
    {@render children?.()}
  </div>
{:else}
  <!-- Browser: use Bits UI Portal -->
  <BitsPortal {to}>
    <div
      class={className}
      data-kind="primitive"
      data-name="Portal"
      data-part="root"
      data-id={id}
    >
      {@render children?.()}
    </div>
  </BitsPortal>
{/if}
