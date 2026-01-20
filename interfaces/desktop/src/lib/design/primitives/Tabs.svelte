<!--
  @file src/lib/design/primitives/Tabs.svelte
  @layer primitives

  @description
  Bits UI Tabs wrapper. Pure behavior primitive with NO styling.
  Styling comes from recipe classes applied by components/renderers.

  @since 1.0.0
-->
<script lang="ts">
  import { Tabs } from "bits-ui";
  import type { Snippet } from "svelte";

  interface Props {
    /** Active tab value (bindable) */
    value?: string;
    /** Activation mode */
    activationMode?: "automatic" | "manual";
    /** Orientation */
    orientation?: "horizontal" | "vertical";
    /** Loop keyboard navigation */
    loop?: boolean;
    /** Root classes from recipe */
    class?: string;
    /** Tab content */
    children?: Snippet;
    /** Value change handler */
    onValueChange?: (value: string) => void;
  }

  let {
    value = $bindable(""),
    activationMode = "automatic",
    orientation = "horizontal",
    loop = true,
    class: className = "",
    children,
    onValueChange,
  }: Props = $props();
</script>

<Tabs.Root
  bind:value
  {activationMode}
  {orientation}
  {loop}
  class={className}
  {onValueChange}
>
  {#if children}
    {@render children()}
  {/if}
</Tabs.Root>
