<!--
    Toggle - Switch component
    ARIA: role="switch" with aria-checked
    Uses OKLCH tokens only
-->
<script lang="ts">
    interface Props {
        checked?: boolean;
        disabled?: boolean;
        label?: string;
        onchange?: (checked: boolean) => void;
    }

    let {
        checked = $bindable(false),
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
    role="switch"
    aria-checked={checked}
    aria-label={label}
    {disabled}
    class="toggle"
    class:checked
    onclick={toggle}
>
    <span class="toggle-thumb"></span>
</button>

<style>
    .toggle {
        position: relative;
        width: 44px;
        height: 24px;
        padding: 2px;
        background: var(--glass-deep);
        border: var(--border-soft);
        border-radius: var(--radius-full);
        cursor: pointer;
        transition: all var(--duration-fast) var(--ease-out);
    }

    .toggle:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .toggle.checked {
        background: linear-gradient(135deg, var(--teal-500), var(--cyan-500));
        box-shadow: var(--glow-teal);
    }

    .toggle-thumb {
        display: block;
        width: 20px;
        height: 20px;
        background: var(--text-primary);
        border-radius: var(--radius-full);
        box-shadow: var(--shadow-z2);
        transition: transform var(--duration-fast) var(--ease-bounce);
    }

    .toggle.checked .toggle-thumb {
        transform: translateX(20px);
    }
</style>
