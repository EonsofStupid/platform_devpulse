<!--
  @file src/lib/design/primitives/Toggle.svelte
  @layer primitives

  @description
  Bits UI Switch wrapper. Pure behavior primitive with NO styling.
  Styling comes from recipe classes applied by components/renderers.

  @since 1.0.0
-->
<script lang="ts">
  import { Switch } from "bits-ui";
  import type { Snippet } from "svelte";

  interface Props {
    /** Checked state (bindable) */
    checked?: boolean;
    /** Disabled state */
    disabled?: boolean;
    /** Required state */
    required?: boolean;
    /** Name for form submission */
    name?: string;
    /** Value for form submission */
    value?: string;
    /** Root classes from recipe */
    class?: string;
    /** Thumb classes from recipe */
    thumbClass?: string;
    /** Thumb content */
    thumb?: Snippet;
    /** Change handler */
    onCheckedChange?: (checked: boolean) => void;
  }

  let {
    checked = $bindable(false),
    disabled = false,
    required = false,
    name,
    value,
    class: className = "",
    thumbClass = "",
    thumb,
    onCheckedChange,
  }: Props = $props();
</script>

<Switch.Root
  bind:checked
  {disabled}
  {required}
  {name}
  {value}
  class={className}
  {onCheckedChange}
>
  <Switch.Thumb class={thumbClass}>
    {#if thumb}
      {@render thumb()}
    {/if}
  </Switch.Thumb>
</Switch.Root>
