<!--
  @file src/lib/design/components/Input.svelte
  @layer components

  @description
  Form input component for COLD LIGHT design system.
  Glass-styled text input with inset bevel and focus glow.
  Uses data-* attributes for styling (Bits UI pattern).

  @props
  - type: "text" | "email" | "password" | "search" - Input type
  - size: "sm" | "md" | "lg" - Input size
  - placeholder: string - Placeholder text
  - value: string - Input value (bindable)
  - disabled: boolean - Disabled state
  - label: string - Accessible label

  @vpb-editable type, size
  @since 1.0.0
-->
<script lang="ts">
    interface Props {
        /** Input type (VPB dropdown) */
        type?: "text" | "email" | "password" | "search";
        /** Input size (VPB dropdown) */
        size?: "sm" | "md" | "lg";
        /** Placeholder text */
        placeholder?: string;
        /** Input value (bindable) */
        value?: string;
        /** Disabled state */
        disabled?: boolean;
        /** Accessible label */
        label?: string;
        /** Additional CSS classes */
        class?: string;
    }

    let {
        type = "text",
        size = "md",
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
    class="dp-input {className}"
    data-size={size}
/>

<style>
    .dp-input {
        width: 100%;
        font-family: var(--dp-font-sans);
        color: var(--dp-text-primary);
        background: var(--dp-glass-deep);
        backdrop-filter: blur(var(--dp-blur-md));
        -webkit-backdrop-filter: blur(var(--dp-blur-md));
        border: var(--dp-border-soft);
        box-shadow: var(--dp-bevel-inset);
        outline: none;
        transition: all var(--dp-transition-fast);
    }

    /* Sizes */
    .dp-input[data-size="sm"] {
        padding: var(--dp-space-1) var(--dp-space-2);
        font-size: var(--dp-text-sm);
        border-radius: var(--dp-radius-sm);
    }
    .dp-input[data-size="md"] {
        padding: var(--dp-space-2) var(--dp-space-3);
        font-size: var(--dp-text-base);
        border-radius: var(--dp-radius-md);
    }
    .dp-input[data-size="lg"] {
        padding: var(--dp-space-3) var(--dp-space-4);
        font-size: var(--dp-text-lg);
        border-radius: var(--dp-radius-lg);
    }

    .dp-input::placeholder {
        color: var(--dp-text-muted);
    }

    .dp-input:focus {
        border-color: var(--dp-teal-500);
        box-shadow: var(--dp-bevel-inset), var(--dp-glow-teal);
    }

    .dp-input:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
</style>
