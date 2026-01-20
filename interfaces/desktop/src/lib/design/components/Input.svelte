<!--
  @file src/lib/design/components/Input.svelte
  @layer components

  @description
  Form input component for COLD LIGHT design system.
  Glass-styled text input with inset bevel and focus glow.
  Uses dp-surface + data-* attributes for recipe-driven styling.

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
    class="dp-surface {className}"
    data-surface="glass"
    data-role="input"
    data-size={size}
/>
