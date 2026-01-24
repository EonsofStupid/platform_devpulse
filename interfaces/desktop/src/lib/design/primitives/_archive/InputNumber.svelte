<!--
  @file primitives/InputNumber.svelte
  @layer primitives

  Number input with ARIA error/description linking.
  Exposes ref for form integration.
-->
<script lang="ts">
  import type { OmitStyle, BaseProps } from "./types.js";
  import { stripStyleProp } from "./types.js";

  interface Props extends OmitStyle<HTMLInputElement>, BaseProps {
    /** Input value (bindable) */
    value?: number | null;
    /** ID of error/description element for aria-describedby */
    describedBy?: string;
    /** Invalid state */
    invalid?: boolean;
    /** Disabled state */
    disabled?: boolean;
    /** Readonly state */
    readonly?: boolean;
    /** Placeholder text */
    placeholder?: string;
    /** Input name */
    name?: string;
    /** Required field */
    required?: boolean;
    /** Minimum value */
    min?: number;
    /** Maximum value */
    max?: number;
    /** Step value */
    step?: number;
  }

  let {
    value = $bindable(null),
    describedBy,
    invalid = false,
    disabled = false,
    readonly = false,
    placeholder,
    name,
    required = false,
    min,
    max,
    step,
    class: className = "",
    "data-id": id,
    ...rest
  }: Props = $props();

  stripStyleProp(rest, "InputNumber");

  let inputRef = $state<HTMLInputElement>();

  export function focus() {
    inputRef?.focus();
  }

  export function blur() {
    inputRef?.blur();
  }

  export function select() {
    inputRef?.select();
  }
</script>

<input
  bind:this={inputRef}
  bind:value
  type="number"
  aria-invalid={invalid || undefined}
  aria-describedby={describedBy}
  {disabled}
  {readonly}
  {placeholder}
  {name}
  {required}
  {min}
  {max}
  {step}
  class={className}
  data-kind="primitive"
  data-name="InputNumber"
  data-part="root"
  data-id={id}
  {...rest}
/>
