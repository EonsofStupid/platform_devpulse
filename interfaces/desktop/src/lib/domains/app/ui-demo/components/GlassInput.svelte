<!--
    GlassInput - Glass with inset bevel and colored shadows
-->
<script lang="ts">
    interface Props {
        type?: "text" | "email" | "password" | "search";
        placeholder?: string;
        value?: string;
        disabled?: boolean;
        label?: string;
    }

    let {
        type = "text",
        placeholder = "",
        value = $bindable(""),
        disabled = false,
        label,
    }: Props = $props();
</script>

<div class="glass-input-wrapper">
    <input
        {type}
        {placeholder}
        bind:value
        {disabled}
        aria-label={label}
        class="glass-input"
    />
</div>

<style>
    .glass-input-wrapper {
        position: relative;
        width: 100%;
        max-width: 400px;
    }

    .glass-input {
        width: 100%;
        padding: var(--space-3) var(--space-4);
        font-family: var(--font-sans);
        font-size: var(--text-base);
        color: var(--text-primary);
        background: var(--glass-deep);
        backdrop-filter: blur(var(--glass-deep-blur));
        border: var(--border-rise-subtle);
        border-radius: var(--radius-md);
        box-shadow: var(--bevel-pressed);
        outline: none;
        transition: all var(--duration-fast) var(--ease-out);
    }

    .glass-input::placeholder {
        color: var(--text-muted);
    }

    .glass-input:focus {
        border-color: var(--teal-400);
        box-shadow: var(--bevel-pressed), var(--glow-teal);
    }

    .glass-input:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
</style>
