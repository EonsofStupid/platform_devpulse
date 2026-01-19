<!--
  @file src/lib/design/components/Toggle.svelte
  @layer components

  @description
  Switch/toggle component for COLD LIGHT design system.
  Binary on/off control with gradient active state and glow.
  Uses data-* attributes for styling (Bits UI pattern).

  @props
  - checked: boolean - Toggle state (bindable)
  - size: "sm" | "md" | "lg" - Toggle size
  - disabled: boolean - Disabled state
  - label: string - Accessible label
  - onchange: (checked: boolean) => void - Change handler

  @vpb-editable size
  @since 1.0.0
-->
<script lang="ts">
    interface Props {
        /** Toggle state (bindable) */
        checked?: boolean;
        /** Toggle size (VPB dropdown) */
        size?: "sm" | "md" | "lg";
        /** Disabled state */
        disabled?: boolean;
        /** Accessible label */
        label?: string;
        /** Change handler */
        onchange?: (checked: boolean) => void;
    }

    let {
        checked = $bindable(false),
        size = "md",
        disabled = false,
        label,
        onchange,
    }: Props = $props();

    function toggle() {
        if (!disabled) {
            checked = !checked;
            onchange?.(checked);
        }
    }
</script>

<button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    {disabled}
    class="dp-toggle"
    data-checked={checked}
    data-size={size}
    onclick={toggle}
>
    <span class="dp-toggle__thumb"></span>
</button>

<style>
    .dp-toggle {
        position: relative;
        padding: 2px;
        background: var(--dp-glass-deep);
        border: var(--dp-border-soft);
        border-radius: var(--dp-radius-full);
        cursor: pointer;
        transition: all var(--dp-transition-fast);
    }

    /* Sizes */
    .dp-toggle[data-size="sm"] {
        width: 36px;
        height: 20px;
    }
    .dp-toggle[data-size="md"] {
        width: 44px;
        height: 24px;
    }
    .dp-toggle[data-size="lg"] {
        width: 56px;
        height: 30px;
    }

    .dp-toggle:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .dp-toggle[data-checked="true"] {
        background: linear-gradient(135deg, var(--dp-teal-500), var(--dp-teal-400));
        box-shadow: var(--dp-glow-teal);
    }

    .dp-toggle__thumb {
        display: block;
        background: var(--dp-text-primary);
        border-radius: var(--dp-radius-full);
        box-shadow: var(--dp-shadow-z2);
        transition: transform var(--dp-duration-fast) var(--dp-ease-bounce);
    }

    /* Thumb sizes */
    .dp-toggle[data-size="sm"] .dp-toggle__thumb {
        width: 16px;
        height: 16px;
    }
    .dp-toggle[data-size="md"] .dp-toggle__thumb {
        width: 20px;
        height: 20px;
    }
    .dp-toggle[data-size="lg"] .dp-toggle__thumb {
        width: 26px;
        height: 26px;
    }

    /* Thumb translate */
    .dp-toggle[data-size="sm"][data-checked="true"] .dp-toggle__thumb {
        transform: translateX(16px);
    }
    .dp-toggle[data-size="md"][data-checked="true"] .dp-toggle__thumb {
        transform: translateX(20px);
    }
    .dp-toggle[data-size="lg"][data-checked="true"] .dp-toggle__thumb {
        transform: translateX(26px);
    }

    /* Focus */
    .dp-toggle:focus-visible {
        outline: 2px solid var(--dp-teal-400);
        outline-offset: 2px;
    }
</style>
