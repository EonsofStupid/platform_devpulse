<!--
  @file src/lib/design/components/Toggle.svelte
  @layer components

  @description
  Switch/toggle component for COLD LIGHT design system.
  Binary on/off control with gradient active state and glow.
  Uses dp-toggle + data-* attributes for recipe-driven styling.

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
