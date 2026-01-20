<!--
  @file src/lib/design/primitives/Select.svelte
  @layer primitives

  @description
  Bits UI Select wrapper. Pure behavior primitive with NO styling.
  Styling comes from recipe classes applied by components/renderers.

  @since 1.0.0
-->
<script lang="ts">
  import { Select } from "bits-ui";
  import type { Snippet } from "svelte";

  interface Props {
    /** Selected value (bindable) */
    value?: string;
    /** Open state (bindable) */
    open?: boolean;
    /** Disabled state */
    disabled?: boolean;
    /** Required state */
    required?: boolean;
    /** Name for form submission */
    name?: string;
    /** Portal target */
    portalTarget?: string | HTMLElement;
    /** Trigger classes from recipe */
    triggerClass?: string;
    /** Content classes from recipe */
    contentClass?: string;
    /** Trigger content */
    trigger?: Snippet;
    /** Select options content */
    children?: Snippet;
    /** Value change handler */
    onValueChange?: (value: string | undefined) => void;
    /** Open change handler */
    onOpenChange?: (open: boolean) => void;
  }

  let {
    value = $bindable(undefined),
    open = $bindable(false),
    disabled = false,
    required = false,
    name,
    portalTarget,
    triggerClass = "",
    contentClass = "",
    trigger,
    children,
    onValueChange,
    onOpenChange,
  }: Props = $props();
</script>

<Select.Root
  bind:value
  bind:open
  {disabled}
  {required}
  {name}
  {onValueChange}
  {onOpenChange}
>
  <Select.Trigger class={triggerClass}>
    {#if trigger}
      {@render trigger()}
    {:else}
      <Select.Value placeholder="Select..." />
    {/if}
  </Select.Trigger>
  <Select.Portal target={portalTarget}>
    <Select.Content class={contentClass}>
      {#if children}
        {@render children()}
      {/if}
    </Select.Content>
  </Select.Portal>
</Select.Root>
