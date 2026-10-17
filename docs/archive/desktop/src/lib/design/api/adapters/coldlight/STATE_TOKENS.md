# ColdLight State Token Vocabulary

> **SSOT for `data-state` token values.**
>
> Space-separated tokens. CSS uses `[data-state~="token"]`.

---

## Format

```html
<div data-state="open focused invalid">...</div>
```

```css
[data-state~="open"] { ... }
[data-state~="focused"] { ... }
```

---

## Shared State Tokens

These tokens are **reusable across all primitives**.

### Presence

| Token | Description |
|-------|-------------|
| `present` | Element exists in DOM |
| `hidden` | Element is visually hidden but present |

### Primary States

| Token | Description |
|-------|-------------|
| `open` | Expanded/visible (dialog, accordion, popover) |
| `closed` | Collapsed/hidden |
| `active` | Currently active item |
| `inactive` | Not currently active |
| `selected` | Item is selected |
| `unselected` | Item is not selected |

### Interaction States

| Token | Description |
|-------|-------------|
| `hovered` | Mouse is over element |
| `pressed` | Element is being pressed/clicked |

### Focus States

| Token | Description |
|-------|-------------|
| `focused` | Element has focus |
| `focus-visible` | Focus is visible (keyboard navigation) |

### Availability States

| Token | Description |
|-------|-------------|
| `disabled` | Element is disabled |
| `readonly` | Element is read-only |

### Validation States

| Token | Description |
|-------|-------------|
| `valid` | Input passes validation |
| `invalid` | Input fails validation |

### Lifecycle States

| Token | Description |
|-------|-------------|
| `dirty` | Value has been modified |
| `pristine` | Value has not been modified |
| `touched` | Element has been interacted with |
| `untouched` | Element has not been interacted with |

### Drag States

| Token | Description |
|-------|-------------|
| `dragging` | Element is being dragged |
| `over-before` | Drag target is before this element |
| `over-after` | Drag target is after this element |

### System States

| Token | Description |
|-------|-------------|
| `loading` | Content is loading |
| `pending` | Action is pending |
| `empty` | No content/value |
| `filled` | Has content/value |

---

## Primitive-Specific Tokens

These tokens are **only valid on specific primitives**.

### Tabs

| Token | Applies To | Description |
|-------|-----------|-------------|
| `horizontal` | root, list | Horizontal orientation |
| `vertical` | root, list | Vertical orientation |
| `overflowing` | list | Tabs exceed container |
| `closable` | tab | Tab can be closed |

### Accordion

| Token | Applies To | Description |
|-------|-----------|-------------|
| `expanded` | item | Item is expanded (alias for `open`) |
| `collapsed` | item | Item is collapsed (alias for `closed`) |

### Checkbox / Switch

| Token | Applies To | Description |
|-------|-----------|-------------|
| `checked` | root | Checked state |
| `unchecked` | root | Unchecked state |
| `indeterminate` | root | Indeterminate state |

### Progress

| Token | Applies To | Description |
|-------|-----------|-------------|
| `complete` | root | Progress is 100% |
| `indeterminate` | root | Unknown progress |

### Input

| Token | Applies To | Description |
|-------|-----------|-------------|
| `required` | root | Field is required |

---

## Token Combinations

### Common Patterns

```html
<!-- Open and focused dialog -->
<div data-state="open focused">

<!-- Disabled button -->
<button data-state="disabled">

<!-- Invalid, touched input -->
<input data-state="invalid touched dirty">

<!-- Active, selected tab -->
<div data-state="active selected focused">

<!-- Dragging tab -->
<div data-state="dragging">

<!-- Drop target -->
<div data-state="over-after">

<!-- Hidden but present panel -->
<div data-state="hidden present inactive">
```

---

## CSS Patterns

### Single Token

```css
[data-state~="open"] {
  display: block;
}

[data-state~="closed"] {
  display: none;
}
```

### Multiple Tokens (AND)

```css
/* Must have BOTH open AND focused */
[data-state~="open"][data-state~="focused"] {
  outline: 2px solid blue;
}
```

### Either Token (OR)

```css
/* Has disabled OR readonly */
[data-state~="disabled"],
[data-state~="readonly"] {
  opacity: 0.5;
  pointer-events: none;
}
```

### Negation (NOT)

```css
/* NOT disabled */
[data-kind="button"]:not([data-state~="disabled"]) {
  cursor: pointer;
}
```

---

## Tailwind Arbitrary Variants

```html
<!-- Single token -->
<div class="data-[state~=open]:block data-[state~=closed]:hidden">

<!-- Multiple tokens -->
<div class="data-[state~=open]:data-[state~=focused]:ring-2">
```

---

## TypeScript Types

```typescript
// Shared state tokens (global vocabulary)
export type SharedStateToken =
  | 'present' | 'hidden'
  | 'open' | 'closed' | 'active' | 'inactive' | 'selected' | 'unselected'
  | 'hovered' | 'pressed'
  | 'focused' | 'focus-visible'
  | 'disabled' | 'readonly'
  | 'valid' | 'invalid'
  | 'dirty' | 'pristine' | 'touched' | 'untouched'
  | 'dragging' | 'over-before' | 'over-after'
  | 'loading' | 'pending' | 'empty' | 'filled';

// State string is space-separated tokens
export type StateString = string; // e.g., "open focused"

// Helper to build state string
export function buildStateString(...tokens: string[]): string {
  return tokens.filter(Boolean).join(' ');
}

// Helper to check if state includes token
export function hasState(state: string, token: string): boolean {
  return state.split(' ').includes(token);
}
```

---

## Rules

1. **Always lowercase kebab-case**
2. **Space-separated in `data-state`**
3. **Use shared tokens when possible**
4. **Primitive-specific tokens only when necessary**
5. **CSS uses `~=` for token matching**
6. **No arbitrary tokens — only from this vocabulary**

---

**This is the canonical state token vocabulary.**
