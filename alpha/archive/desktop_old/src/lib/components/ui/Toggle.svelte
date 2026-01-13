<script lang="ts">
  let {
    checked = $bindable(false),
    disabled = false,
    id,
    class: className = '',
    onchange,
  }: {
    checked?: boolean;
    disabled?: boolean;
    id?: string;
    class?: string;
    onchange?: (checked: boolean) => void;
  } = $props();

  function handleChange() {
    if (!disabled) {
      checked = !checked;
      onchange?.(checked);
    }
  }
</script>

<button
  role="switch"
  aria-checked={checked}
  {disabled}
  {id}
  class="toggle {className}"
  class:checked
  onclick={handleChange}
>
  <span class="toggle-thumb"></span>
</button>

<style>
  .toggle {
    position: relative;
    width: 44px;
    height: 24px;
    border-radius: var(--radius-full);
    background: rgba(28, 26, 71, 0.8);
    border: 1px solid rgba(130, 111, 214, 0.3);
    cursor: pointer;
    transition: all var(--transition-normal);
    box-shadow:
      inset 0 1px 3px rgba(0, 0, 0, 0.3);
  }

  .toggle:hover:not(:disabled) {
    border-color: rgba(130, 111, 214, 0.5);
  }

  .toggle:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .toggle.checked {
    background: linear-gradient(
      135deg,
      var(--accent) 0%,
      rgba(127, 47, 168, 0.7) 100%
    );
    border-color: rgba(130, 111, 214, 0.6);
    box-shadow:
      0 0 15px rgba(127, 47, 168, 0.3),
      inset 0 1px 1px rgba(255, 255, 255, 0.2);
  }

  .toggle-thumb {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: var(--foreground);
    transition: all var(--transition-normal);
    box-shadow:
      0 2px 4px rgba(0, 0, 0, 0.3),
      0 0 8px rgba(145, 235, 235, 0.2);
  }

  .toggle.checked .toggle-thumb {
    left: calc(100% - 20px);
    background: var(--primary-foreground);
    box-shadow:
      0 2px 4px rgba(0, 0, 0, 0.3),
      0 0 12px rgba(245, 155, 86, 0.4);
  }
</style>
