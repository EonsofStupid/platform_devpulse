<!--
  @file primitives/InputOTP.svelte
  @layer primitives

  OTP/PIN code input with hidden input for form submission.
  Uses role="group" for accessibility.
-->
<script lang="ts">
import type { Snippet } from "svelte";
import type { BaseProps, OmitStyle } from "./types.js";
import { stripStyleProp } from "./types.js";

interface Props extends Omit<OmitStyle<HTMLDivElement>, "children">, BaseProps {
	/** OTP value (bindable) */
	value?: string;
	/** Number of digits */
	length?: number;
	/** Input name for form */
	name?: string;
	/** Disabled state */
	disabled?: boolean;
	/** ID of error/description element for aria-describedby */
	describedBy?: string;
	/** Invalid state */
	invalid?: boolean;
	/** Slot for rendering individual digit inputs */
	children?: Snippet<[{ index: number; digit: string; focused: boolean }]>;
	/** Called when value changes */
	onValueChange?: (value: string) => void;
	/** Called when all digits entered */
	onComplete?: (value: string) => void;
}

let {
	value = $bindable(""),
	length = 6,
	name,
	disabled = false,
	describedBy,
	invalid = false,
	children,
	onValueChange,
	onComplete,
	class: className = "",
	"data-id": id,
	...rest
}: Props = $props();

stripStyleProp(rest, "InputOTP");

let hiddenInputRef = $state<HTMLInputElement>();

export function focus() {
	hiddenInputRef?.focus();
}

export function clear() {
	value = "";
	onValueChange?.("");
}
</script>

<div
  role="group"
  aria-label="One-time password"
  aria-describedby={describedBy}
  aria-invalid={invalid || undefined}
  class={className}
  data-kind="primitive"
  data-name="InputOTP"
  data-part="root"
  data-id={id}
  {...rest}
>
  <!-- Hidden input for form submission -->
  <input
    bind:this={hiddenInputRef}
    bind:value
    type="hidden"
    {name}
    data-part="hidden-input"
  />

  {#if children}
    {#each Array(length) as _, i}
      {@render children({
        index: i,
        digit: value[i] ?? "",
        focused: false
      })}
    {/each}
  {/if}
</div>
