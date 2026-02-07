# SPRINT: Token Prefix Purge

> **Status**: EXECUTING
> **Priority**: CRITICAL
> **Goal**: Eliminate ALL --dp- and --cl- prefixes from the codebase

## Problem Statement

ColdLight is a **first-party design system**. First-party tokens do not need prefixes.
- `--glass-void` ✅ CORRECT
- `--dp-glass-void` ❌ WRONG
- `--cl-glass-void` ❌ WRONG

Previous sessions introduced prefix drift. This sprint eliminates it permanently.

## Token Mapping

### Surface Materials
| OLD (--dp-) | NEW (unprefixed) |
|-------------|------------------|
| `--dp-glass-void` | `--glass-void` |
| `--dp-glass-deep` | `--glass-deep` |
| `--dp-glass-smoke` | `--glass-smoke` |
| `--dp-glass-frost` | `--glass-frost` |

### Colors
| OLD (--dp-) | NEW (unprefixed) |
|-------------|------------------|
| `--dp-teal-{N}` | `--color-teal-{N}` |
| `--dp-purple-{N}` | `--color-purple-{N}` |
| `--dp-ember-{N}` | `--color-ember-{N}` |

### Text
| OLD (--dp-) | NEW (unprefixed) |
|-------------|------------------|
| `--dp-text-primary` | `--text-primary` |
| `--dp-text-secondary` | `--text-secondary` |
| `--dp-text-muted` | `--text-muted` |
| `--dp-text-white` | `--text-primary` (remap) |

### Spacing
| OLD (--dp-) | NEW (unprefixed) |
|-------------|------------------|
| `--dp-space-{N}` | `--space-{N}` |

### Radius
| OLD (--dp-) | NEW (unprefixed) |
|-------------|------------------|
| `--dp-radius-sm` | `--radius-sm` |
| `--dp-radius-md` | `--radius-md` |
| `--dp-radius-lg` | `--radius-lg` |

### Blur
| OLD (--dp-) | NEW (unprefixed) |
|-------------|------------------|
| `--dp-blur-md` | `--blur-md` |
| `--dp-blur-lg` | `--blur-lg` |

### Shadows
| OLD (--dp-) | NEW (unprefixed) |
|-------------|------------------|
| `--dp-shadow-z1` | `--shadow-z1` |
| `--dp-shadow-z2` | `--shadow-z2` |

### Duration
| OLD (--dp-) | NEW (unprefixed) |
|-------------|------------------|
| `--dp-transition-fast` | `--duration-fast` |

## Files to Fix

### CSS Files (Active Code)
1. `layouts/app/styles/surfaces.css`
2. `layouts/app/styles/depth.css`
3. `layouts/app/styles/shell.css`
4. `layouts/app/styles/index.css`
5. `layouts/common/styles/typography.css`
6. `layouts/common/styles/focus.css`
7. `layouts/common/styles/scrollbars.css`
8. `layouts/common/styles/index.css`
9. `layouts/chat/styles/shell.css`
10. `layouts/chat/styles/depth.css`
11. `layouts/chat/styles/interactions.css`
12. `layouts/chat/styles/index.css`

### Documentation Files (Reference Only)
- Various .md files mentioning --dp- as examples
- These will be updated to reflect correct tokens

## Verification

After completion:
```bash
cd interfaces/desktop
pnpm svelte-check
grep -r "\-\-dp-\|\-\-cl-" src/lib/layouts/  # Should return empty
```

## Notes

- Fallback values in CSS are kept for resilience
- All fallback values use raw oklch() values (no token references)
- data-* attributes remain unchanged (they're correct)
