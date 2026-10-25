<script lang="ts">
  let {
    type = 'text',
    value = $bindable(''),
    placeholder = '',
    disabled = false,
    class: className = '',
    id,
    name,
    ...rest
  }: {
    type?: 'text' | 'email' | 'password' | 'number' | 'search' | 'tel' | 'url';
    value?: string;
    placeholder?: string;
    disabled?: boolean;
    class?: string;
    id?: string;
    name?: string;
    [key: string]: any;
  } = $props();
</script>

<input
  {type}
  bind:value
  {placeholder}
  {disabled}
  {id}
  {name}
  class="input {className}"
  {...rest}
/>

<style>
  .input {
    width: 100%;
    padding: 0.625rem 0.875rem;
    font-family: var(--font-sans);
    font-size: 0.875rem;
    background: var(--input-background);
    border: 1px solid rgba(130, 111, 214, 0.3);
    border-radius: var(--radius);
    color: var(--foreground);
    transition: all var(--transition-fast);
    box-shadow:
      inset 0 1px 3px rgba(0, 0, 0, 0.2),
      inset 0 -1px 1px rgba(255, 255, 255, 0.02);
  }

  .input::placeholder {
    color: var(--foreground-muted);
    opacity: 0.6;
  }

  .input:focus {
    outline: none;
    border-color: var(--border-focus);
    box-shadow:
      inset 0 1px 3px rgba(0, 0, 0, 0.2),
      0 0 0 3px rgba(36, 120, 120, 0.2),
      0 0 15px rgba(36, 120, 120, 0.1);
  }

  .input:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background: rgba(90, 156, 11, 0.05);
  }
</style>
