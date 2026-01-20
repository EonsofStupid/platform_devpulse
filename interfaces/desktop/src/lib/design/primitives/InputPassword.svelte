<!--
  @file primitives/InputPassword.svelte
  @layer primitives

  Password input with show/hide toggle.
  Toggle state announced to screen readers.
  Exposes ref for form integration.

  A11y Acceptance: Show/hide toggle announced to SR
-->
<script lang="ts">
  import type { Snippet } from "svelte";
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
    /** Placeholder text */
    placeholder?: string;
    /** Input name */
    name?: string;
    /** Required field */
    required?: boolean;
    /** Show password (bindable) */
    showPassword?: boolean;
    /** Toggle button snippet */
    toggle?: Snippet<[{ visible: boolean; toggle: () => void }]>;
  }

  let {
    value = $bindable(""),
    describedBy,
    invalid = false,
    disabled = false,
    placeholder,
    name,
    required = false,
    showPassword = $bindable(false),
    toggle,
    class: className = "",
    "data-id": id,
    ...rest
  }: Props = $props();

  stripStyleProp(rest, "InputPassword");

  let inputRef = $state<HTMLInputElement>();

  function toggleVisibility() {
    showPassword = !showPassword;
  }

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

<div
  class={className}
  data-kind="primitive"
  data-name="InputPassword"
  data-part="root"
  data-id={id}
>
  <input
    bind:this={inputRef}
    bind:value
    type={showPassword ? "text" : "password"}
    aria-invalid={invalid || undefined}
    aria-describedby={describedBy}
    {disabled}
    {placeholder}
    {name}
    {required}
    data-part="input"
    {...rest}
  />
  {#if toggle}
    {@render toggle({ visible: showPassword, toggle: toggleVisibility })}
  {/if}
</div>
