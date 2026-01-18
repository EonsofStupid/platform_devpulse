<!--
  @file src/lib/design/primitives/Toggle.svelte
  @name Toggle.svelte
  @module @devpulse/design/primitives/Toggle
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
    Toggle.svelte - Custom ARIA Switch Primitive
    
    WAI-ARIA compliant toggle switch:
    - role="switch"
    - aria-checked state
    - Keyboard: Space to toggle
-->
<script lang="ts">
    interface Props {
        /** Current checked state */
        checked?: boolean;
        /** Disabled state */
        disabled?: boolean;
        /** Label for accessibility */
        label?: string;
        /** Additional CSS class */
        class?: string;
        /** Change handler */
        onchange?: (checked: boolean) => void;
    }

    let {
        checked = $bindable(false),
        disabled = false,
        label = "",
        class: className = "",
        onchange,
    }: Props = $props();

    function toggle() {
        if (disabled) return;
        checked = !checked;
        onchange?.(checked);
    }

    function handleKeydown(event: KeyboardEvent) {
        if (event.key === " " || event.key === "Enter") {
            event.preventDefault();
            toggle();
        }
    }
</script>

<button
    type="button"
    role="switch"
    class="dp-toggle {className}"
    aria-checked={checked}
    aria-label={label}
    {disabled}
    onclick={toggle}
    onkeydown={handleKeydown}
>
    <span class="dp-toggle-track">
        <span class="dp-toggle-thumb"></span>
    </span>
    {#if label}
        <span class="dp-toggle-label">{label}</span>
    {/if}
</button>

<style>
    .dp-toggle {
        display: inline-flex;
        align-items: center;
        gap: var(--dp-space-2);
        padding: 0;
        background: none;
        border: none;
        cursor: pointer;
        font: inherit;
        color: inherit;
    }

    .dp-toggle:disabled {
        cursor: not-allowed;
        opacity: 0.5;
    }

    .dp-toggle-track {
        position: relative;
        width: 44px;
        height: 24px;
        border-radius: var(--dp-radius-full);
        background: var(--dp-void-700);
        border: 1px solid oklch(35% 0.05 195 / 0.3);
        transition: all var(--dp-transition-fast);
    }

    .dp-toggle[aria-checked="true"] .dp-toggle-track {
        background: var(--dp-teal-600);
        border-color: var(--dp-teal-400);
    }

    .dp-toggle-thumb {
        position: absolute;
        top: 2px;
        left: 2px;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: var(--dp-text-primary);
        transition: transform var(--dp-transition-fast);
        box-shadow: 0 2px 4px oklch(5% 0.02 250 / 0.3);
    }

    .dp-toggle[aria-checked="true"] .dp-toggle-thumb {
        transform: translateX(20px);
    }

    .dp-toggle-label {
        font-size: var(--dp-text-sm);
        color: var(--dp-text-secondary);
    }

    .dp-toggle:focus-visible .dp-toggle-track {
        outline: 2px solid var(--dp-teal-400);
        outline-offset: 2px;
    }
</style>
