<!--
  @file primitives/NativeSelect.svelte
  @layer primitives

  Native select element with full accessibility.
  Exposes ref for form integration.
-->
<script lang="ts">
  import type { Snippet } from "svelte";
  import type { OmitStyle, BaseProps } from "./types.js";
  import { stripStyleProp } from "./types.js";

  interface Props extends OmitStyle<HTMLSelectElement>, BaseProps {
    /** Selected value (bindable) */
    value?: string;
    /** ID of error/description element for aria-describedby */
    describedBy?: string;
    /** Invalid state */
    invalid?: boolean;
    /** Disabled state */
    disabled?: boolean;
    /** Select name */
    name?: string;
    /** Required field */
    required?: boolean;
    /** Option elements */
    children?: Snippet;
  }

  let {
    value = $bindable(""),
    describedBy,
    invalid = false,
    disabled = false,
    name,
    required = false,
    children,
    class: className = "",
    "data-id": id,
    ...rest
  }: Props = $props();

  stripStyleProp(rest, "NativeSelect");

  let selectRef = $state<HTMLSelectElement>();

  export function focus() {
    selectRef?.focus();
  }

  export function blur() {
    selectRef?.blur();
  }
</script>

<select
  bind:this={selectRef}
  bind:value
  aria-invalid={invalid || undefined}
  aria-describedby={describedBy}
  {disabled}
  {name}
  {required}
  class={className}
  data-kind="primitive"
  data-name="NativeSelect"
  data-part="root"
  data-id={id}
  {...rest}
>
  {@render children?.()}
</select>
