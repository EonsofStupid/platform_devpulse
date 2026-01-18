<!--
  @file src/lib/design/components/Input.svelte
  @name Input.svelte
  @module @devpulse/design/components/Input
  @layer lib

  @description
  [TODO: Describe this component's purpose]

  @props
  - [TODO: propName]: [type] - [description]

  @dependencies
  - [TODO: List imports]

  @consumers
  - [TODO: List who uses this component]

  @vpb-editable [TODO: List editable props]
  @since 1.0.0
-->
<!--
    Input - Core form element
    ARIA: native input semantics with aria-label support
    Uses OKLCH tokens only
-->
<script lang="ts">
    interface Props {
        type?: "text" | "email" | "password" | "search";
        placeholder?: string;
        value?: string;
        disabled?: boolean;
        label?: string;
        class?: string;
    }

    let {
        type = "text",
        placeholder = "",
        value = $bindable(""),
        disabled = false,
        label,
        class: className = "",
    }: Props = $props();
</script>

<input
    {type}
    {placeholder}
    bind:value
    {disabled}
    aria-label={label}
    class="input {className}"
/>

<style>
    .input {
        width: 100%;
        padding: var(--space-2) var(--space-3);
        font-family: var(--font-sans);
        font-size: var(--text-base);
        color: var(--text-primary);
        background: var(--glass-deep);
        backdrop-filter: blur(var(--blur-md));
        border: var(--border-soft);
        border-radius: var(--radius-md);
        box-shadow: var(--bevel-inset);
        outline: none;
        transition: all var(--duration-fast) var(--ease-out);
    }

    .input::placeholder {
        color: var(--text-muted);
    }

    .input:focus {
        border-color: oklch(70% 0.2 175 / 0.5);
        box-shadow: var(--bevel-inset), var(--glow-teal);
    }

    .input:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
</style>
