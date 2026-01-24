<!--
  @file primitives/InputText.svelte
  @layer primitives

  Text input with ARIA error/description linking.
  Exposes ref for form integration.
-->
<script lang="ts">
  import type { OmitStyle, BaseProps } from "./types.js";
  import { stripStyleProp } from "./types.js";

  interface Props extends OmitStyle<HTMLInputElement>, BaseProps {
    /** Input value (bindable) */
    value?: string;
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
  }

  let {
    value = $bindable(""),
    describedBy,
    invalid = false,
    disabled = false,
    readonly = false,
    placeholder,
    name,
    required = false,
    class: className = "",
    "data-id": id,
    ...rest
  }: Props = $props();

  stripStyleProp(rest, "InputText");

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
  type="text"
  aria-invalid={invalid || undefined}
  aria-describedby={describedBy}
  {disabled}
  {readonly}
  {placeholder}
  {name}
  {required}
  class={className}
  data-kind="primitive"
  data-name="InputText"
  data-part="root"
  data-id={id}
  {...rest}
/>
