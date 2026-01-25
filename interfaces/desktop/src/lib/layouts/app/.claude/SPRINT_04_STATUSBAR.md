# Sprint 04: StatusBar.svelte CSS Rewrite

> **Target**: `layouts/app/StatusBar.svelte`
> **Goal**: Replace broken tokens. Crisp glass panel. Status dot with glow. Mono text.

---

## Current State

Script is minimal (good):
- Hardcoded status object (TODO: connect to actual system state)
- No runes needed yet (will use when connected to engine)

CSS has broken tokens that must be replaced.

---

## CSS Rewrite

Replace the entire `<style>` block with:

```css
<style>
    .statusbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        height: 100%;
        padding: 0 16px;
        box-sizing: border-box;
    }

    .statusbar-left,
    .statusbar-center,
    .statusbar-right {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .statusbar-left {
        flex: 0 0 auto;
    }

    .statusbar-center {
        flex: 1;
        justify-content: center;
    }

    .statusbar-right {
        flex: 0 0 auto;
    }

    /* Status Indicator Dot */
    .status-indicator {
        width: 8px;
        height: 8px;
        border-radius: 9999px;
        background: rgba(255, 255, 255, 0.4);
        transition: all 0.3s ease;
    }

    /* Online - Green glow */
    .status-indicator.online {
        background: rgba(34, 197, 94, 1);
        box-shadow:
            0 0 8px rgba(34, 197, 94, 0.8),
            0 0 16px rgba(34, 197, 94, 0.4);
        animation: pulse-glow 2s ease-in-out infinite;
    }

    /* Offline - Red, no glow */
    .status-indicator.offline {
        background: rgba(239, 68, 68, 1);
        box-shadow: none;
    }

    @keyframes pulse-glow {
        0%, 100% {
            box-shadow:
                0 0 8px rgba(34, 197, 94, 0.8),
                0 0 16px rgba(34, 197, 94, 0.4);
        }
        50% {
            box-shadow:
                0 0 12px rgba(34, 197, 94, 1),
                0 0 24px rgba(34, 197, 94, 0.6);
        }
    }

    /* Status Text - Mono font */
    .status-text {
        font-size: 0.75rem;
        font-family: "JetBrains Mono", "Fira Code", monospace;
        color: rgba(255, 255, 255, 0.7);
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .status-text.muted {
        color: rgba(255, 255, 255, 0.4);
    }

    /* Hover effect on status items */
    .statusbar-left:hover .status-text,
    .statusbar-center:hover .status-text,
    .statusbar-right:hover .status-text {
        color: rgba(255, 255, 255, 0.9);
        transition: color 0.2s ease;
    }

    .statusbar-left:hover .status-indicator.online {
        box-shadow:
            0 0 12px rgba(34, 197, 94, 1),
            0 0 24px rgba(34, 197, 94, 0.6);
    }
</style>
```

---

## Status Indicator States

| State | Color | Glow | Animation |
|-------|-------|------|-----------|
| Online | `rgba(34, 197, 94, 1)` (green) | Yes, pulsing | `pulse-glow 2s` |
| Offline | `rgba(239, 68, 68, 1)` (red) | No | None |
| Default | `rgba(255, 255, 255, 0.4)` | No | None |

---

## Typography

| Element | Font | Size | Color |
|---------|------|------|-------|
| Status text | JetBrains Mono | 0.75rem | `rgba(255,255,255,0.7)` |
| Muted text | JetBrains Mono | 0.75rem | `rgba(255,255,255,0.4)` |
| Hover | JetBrains Mono | 0.75rem | `rgba(255,255,255,0.9)` |

---

## Verification

1. [ ] `pnpm check` passes
2. [ ] Status dot is green when online
3. [ ] Green dot has pulsing glow animation
4. [ ] Text uses monospace font
5. [ ] Muted text is dimmer
6. [ ] Hover brightens text
7. [ ] Hover intensifies online glow

---

## Future Enhancement (TODO)

When connecting to engine facade:
```typescript
// Replace hardcoded status with:
import { getConnectionStatus, getSystemUptime } from '$lib/sys/engine/facade';

let status = $state({
    connection: 'offline',
    uptime: '0d 0h',
    version: '0.1.0'
});

$effect(() => {
    // Subscribe to engine events
});
```

---

## Execution Command

```
Read StatusBar.svelte → Replace <style> block → Run pnpm check → Visual verify
```
