<!--
  @file src/lib/design/primitives/Button.svelte
  @layer primitives

  @description
  Bits UI Button wrapper. Pure behavior primitive with NO styling.
  Styling comes from recipe classes applied by components/renderers.

  @since 1.0.0
-->
<script lang="ts">
  import { Button } from "bits-ui";
  import type { Snippet } from "svelte";
  import type { HTMLButtonAttributes } from "svelte/elements";

  interface Props extends HTMLButtonAttributes {
    /** Render as link */
    href?: string;
    /** Button content */
    children?: Snippet;
    /** Classes from recipe */
    class?: string;
  }

  let {
    href,
    children,
    class: className = "",
    ...restProps
  }: Props = $props();
</script>

<Button.Root {href} class={className} {...restProps}>
  {#if children}
    {@render children()}
  {/if}
</Button.Root>
