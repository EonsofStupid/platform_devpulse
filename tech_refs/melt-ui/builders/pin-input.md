# PIN Input Builder

> OTP/PIN entry with single-character inputs.

---

## Import

```typescript
import { createPinInput, melt } from '@melt-ui/svelte';
```

---

## createPinInput(options?)

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `placeholder` | `string` | `"○"` | Character for empty inputs |
| `type` | `'text' \| 'password'` | `'text'` | Mask input values |
| `disabled` | `boolean` | `false` | Disable entire input |
| `name` | `string` | — | Form field name |
| `defaultValue` | `string[]` | — | Initial values array |
| `value` | `Writable<string[]>` | — | Controlled values |
| `onValueChange` | `ChangeFn` | — | Value change callback |
| `ids` | `{ ... }` | — | Custom ID overrides |

---

## Return Value

```typescript
const {
  elements: {
    root,        // Container wrapper
    input,       // Individual input fields (function)
    hiddenInput, // Form submission
  },
  states: {
    value,       // Writable<string[]> - array of values
    valueStr,    // Derived<string> - concatenated string
  },
  helpers: {
    clear,       // () => void - reset all inputs
  },
} = createPinInput();
```

---

## Element Data Attributes

### root
- `[data-melt-pin-input]`
- `[data-complete]` — present when all inputs filled

### input
- `[data-melt-pin-input-input]`

### hiddenInput
- `[data-melt-pin-input-hidden-input]`

---

## ColdLight Pattern

```svelte
<script lang="ts">
  import { createPinInput, melt } from '@melt-ui/svelte';

  const pinInput = createPinInput({
    placeholder: '•',
    type: 'password',  // Mask values
  });

  const { elements: { root, input }, states } = pinInput;

  // 6-digit PIN
  const length = 6;
</script>

<div
  use:melt={$root}
  class={rootClass}
  data-kind="pin-input"
  data-slot="root"
>
  {#each Array(length) as _, i}
    <input
      use:melt={$input()}
      class={inputClass}
      data-kind="pin-input"
      data-slot="input"
    />
  {/each}
</div>

<!-- Access value -->
<p>PIN: {$states.valueStr}</p>
```

---

## Keyboard

| Key | Action |
|-----|--------|
| `ArrowLeft` | Move to previous input |
| `ArrowRight` | Move to next input |
| `Backspace` | Delete current; if empty, delete previous |
| `Delete` | Clear current input |
| `Ctrl+V` | Paste across all inputs |
| `0-9, a-z` | Enter character, auto-advance |

---

## Clipboard Support

- **Paste**: Automatically distributes characters across inputs
- Characters exceeding input count are ignored
- Works with `Ctrl+V` or right-click paste

---

## Form Integration

```svelte
<form>
  <div use:melt={$root}>
    {#each Array(6) as _, i}
      <input use:melt={$input()} />
    {/each}
  </div>

  <!-- Hidden input for form submission -->
  <input use:melt={$hiddenInput} />

  <button type="submit">Verify</button>
</form>
```

---

## Validation Pattern

```svelte
<script>
  const isComplete = $derived($states.value.length === 6 && $states.value.every(v => v));
  const isValid = $derived($states.valueStr === expectedCode);
</script>

{#if isComplete && !isValid}
  <p class="error">Invalid code</p>
{/if}
```

---

## Notes

- Each input accepts exactly ONE character
- Auto-advances focus on character entry
- Auto-retreats focus on backspace from empty input
- `valueStr` provides concatenated value for verification
- Use `type: 'password'` for sensitive codes
