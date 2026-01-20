<!--
  @file src/lib/design/primitives/Accordion.svelte
  @layer primitives

  @description
  Bits UI Accordion wrapper. Pure behavior primitive with NO styling.
  Styling comes from recipe classes applied by components/renderers.

  @since 1.0.0
-->
<script lang="ts">
  import { Accordion } from "bits-ui";
  import type { Snippet } from "svelte";

  interface Props {
    /** Open item value(s) - string for single, string[] for multiple (bindable) */
    value?: string | string[];
    /** Allow multiple items open */
    multiple?: boolean;
    /** Disabled state */
    disabled?: boolean;
    /** Loop keyboard navigation */
    loop?: boolean;
    /** Root classes from recipe */
    class?: string;
    /** Accordion content */
    children?: Snippet;
    /** Value change handler */
    onValueChange?: (value: string | string[] | undefined) => void;
  }

  let {
    value = $bindable(undefined),
    multiple = false,
    disabled = false,
    loop = true,
    class: className = "",
    children,
    onValueChange,
  }: Props = $props();
</script>

{#if multiple}
  <Accordion.Root
    bind:value={value as string[]}
    type="multiple"
    {disabled}
    {loop}
    class={className}
    onValueChange={onValueChange as (value: string[] | undefined) => void}
  >
    {#if children}
      {@render children()}
    {/if}
  </Accordion.Root>
{:else}
  <Accordion.Root
    bind:value={value as string}
    type="single"
    {disabled}
    {loop}
    class={className}
    onValueChange={onValueChange as (value: string | undefined) => void}
  >
    {#if children}
      {@render children()}
    {/if}
  </Accordion.Root>
{/if}
