<!--
  @file primitives/button/Button.test.svelte
  @layer primitives

  Test wrapper for Button primitive.
-->
<script lang="ts">
  import type { Snippet } from "svelte";
  import Button from "./Button.svelte";

  interface Props {
    variant?: "default" | "primary" | "secondary" | "ghost" | "destructive" | "outline";
    size?: "sm" | "md" | "lg" | "icon";
    disabled?: boolean;
    loading?: boolean;
    pressed?: boolean;
    "aria-label"?: string;
    label?: string;
    showIcon?: boolean;
    onclick?: (e: MouseEvent) => void;
  }

  let {
    variant = "default",
    size = "md",
    disabled = false,
    loading = false,
    pressed,
    "aria-label": ariaLabel,
    label = "Click me",
    showIcon = false,
    onclick,
  }: Props = $props();
</script>

{#snippet iconSnippet()}
  <svg data-testid="icon" aria-hidden="true" width="16" height="16"><circle cx="8" cy="8" r="6" /></svg>
{/snippet}

<Button
  {variant}
  {size}
  {disabled}
  {loading}
  {pressed}
  aria-label={ariaLabel}
  {onclick}
  icon={showIcon ? iconSnippet : undefined}
>
  {label}
</Button>
