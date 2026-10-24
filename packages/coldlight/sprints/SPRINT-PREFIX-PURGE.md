# SPRINT: Token Prefix Purge

> **Status**: EXECUTING
> **Priority**: CRITICAL
> **Goal**: Eliminate ALL legacy prefixes from the codebase

## Problem Statement

ColdLight is a **first-party design system**. First-party tokens do not need prefixes.
- `--glass-void` ✅ CORRECT
- `--glass-void` ✅ CORRECT (no prefix)
- Previously prefixed tokens (e.g. `dp-glass-void`, `cl-glass-void`) were WRONG

Previous sessions introduced prefix drift. This sprint eliminates it permanently.

## Token Mapping

### Surface Materials
| CORRECT (unprefixed) |
|----------------------|
| `--glass-void` |
| `--glass-deep` |
| `--glass-smoke` |
| `--glass-frost` |

### Colors
| CORRECT (unprefixed) |
|----------------------|
| `--color-teal-{N}` |
| `--color-purple-{N}` |
| `--color-ember-{N}` |

### Text
| CORRECT (unprefixed) |
|----------------------|
| `--text-primary` |
| `--text-secondary` |
| `--text-muted` |

### Spacing
| CORRECT (unprefixed) |
|----------------------|
| `--space-{N}` |

### Radius
| CORRECT (unprefixed) |
|----------------------|
| `--radius-sm` |
| `--radius-md` |
| `--radius-lg` |

### Blur
| CORRECT (unprefixed) |
|----------------------|
| `--blur-md` |
| `--blur-lg` |

### Shadows
| CORRECT (unprefixed) |
|----------------------|
| `--shadow-z1` |
| `--shadow-z2` |

### Duration
| CORRECT (unprefixed) |
|----------------------|
| `--duration-fast` |

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
- Various .md files updated to unprefixed tokens
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
