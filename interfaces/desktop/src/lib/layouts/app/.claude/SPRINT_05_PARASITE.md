# Sprint 05: Parasite CSS Fix - Strong Crisp Bevels

> **Target**: `lib/design/plugins/parasite/parasite.css`
> **Goal**: Replace soft rounded bevels with STRONG CRISP bevels. Same treatment as all layout components.

---

## Current Problem

The current `.parasite-letter` has soft bevels:
```css
text-shadow:
    var(--dp-space-1) var(--dp-space-1) 0px var(--dp-bevel-dark-strong),
    calc(-1 * var(--dp-space-1)) calc(-1 * var(--dp-space-1)) 0px var(--dp-bevel-light),
    var(--dp-space-1) var(--dp-space-1) var(--dp-space-2) var(--dp-inset-dark),  /* <-- soft blur */
    0 0 var(--dp-space-4) var(--dp-glass-tint-teal);  /* <-- diffuse glow */
```

This creates rounded, pillowy look. We need HARD CARVED GLASS.

---

## CSS Rewrite

Replace the `.parasite-letter` text-shadow with strong crisp bevel:

```css
/* Deep Glass Bevel Effect on Each Letter - STRONG CRISP */
.parasite-letter {
    display: inline-block;
    position: relative;
    /* HARD CRISP BEVEL - no blur, sharp offsets */
    text-shadow:
        /* Dark shadow bottom-right - hard edge */
        2px 2px 0 rgba(0, 0, 0, 0.7),
        /* Light highlight top-left - hard edge */
        -1px -1px 0 rgba(255, 255, 255, 0.2),
        /* Subtle depth layer */
        3px 3px 0 rgba(0, 0, 0, 0.4),
        /* Teal accent glow - minimal spread */
        0 0 8px rgba(65, 240, 219, 0.5);
    /* Crisp dark stroke */
    -webkit-text-stroke: 0.5px rgba(0, 0, 0, 0.6);
}

/* Base color - hardcoded teal */
.parasite-letter {
    color: rgba(65, 240, 219, 0.95);
    transition: color 2.5s cubic-bezier(0.33, 1, 0.68, 1);
}
```

---

## Token Replacement Map

| Old Token | Replace With |
|-----------|--------------|
| `var(--dp-space-1)` | `4px` |
| `var(--dp-space-2)` | `8px` |
| `var(--dp-space-3)` | `12px` |
| `var(--dp-space-4)` | `16px` |
| `var(--dp-bevel-dark-strong)` | `rgba(0, 0, 0, 0.7)` |
| `var(--dp-bevel-light)` | `rgba(255, 255, 255, 0.2)` |
| `var(--dp-inset-dark)` | `rgba(0, 0, 0, 0.4)` |
| `var(--dp-glass-tint-teal)` | `rgba(65, 240, 219, 0.3)` |
| `var(--dp-glass-tint-purple)` | `rgba(147, 51, 234, 0.3)` |
| `var(--dp-matte-dark)` | `rgba(0, 0, 0, 0.6)` |
| `var(--dp-teal-400)` | `rgba(65, 240, 219, 0.95)` |
| `var(--dp-ease-out)` | `cubic-bezier(0.33, 1, 0.68, 1)` |
| `var(--dp-font-sans)` | `"Inter", system-ui, sans-serif` |
| `var(--dp-radius-md)` | `8px` |
| `var(--dp-duration-slow)` | `500ms` |
| `var(--dp-text-lg)` | `1.125rem` |
| `var(--dp-text-2xl)` | `1.5rem` |
| `var(--dp-hue-teal)` | `180` |
| `var(--dp-hue-purple)` | `280` |
| `var(--dp-hue-electric)` | `220` |
| `var(--dp-hue-magenta)` | `320` |

---

## Full Rewritten File

```css
/**
 * @file parasite.css
 * @layer plugins
 * @description Parasite effect - STRONG CRISP BEVELS, hardcoded values
 * @since 1.0.0
 */

/* =================================================================
   Parasite - Glass Typography with Ink Creep
   STRONG CRISP BEVELS - Hard carved glass
   ================================================================= */

/* Base Container */
.parasite {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-family: "Inter", system-ui, sans-serif;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    position: relative;
    overflow: visible;
}

/* Deep Glass Bevel Effect - STRONG CRISP */
.parasite-letter {
    display: inline-block;
    position: relative;
    color: rgba(65, 240, 219, 0.95);
    /* HARD CRISP BEVEL - no blur on offsets */
    text-shadow:
        2px 2px 0 rgba(0, 0, 0, 0.7),
        -1px -1px 0 rgba(255, 255, 255, 0.2),
        3px 3px 0 rgba(0, 0, 0, 0.4),
        0 0 8px rgba(65, 240, 219, 0.5);
    -webkit-text-stroke: 0.5px rgba(0, 0, 0, 0.6);
    transition: color 2.5s cubic-bezier(0.33, 1, 0.68, 1);
}

/* Staggered animation delays */
.parasite-letter:nth-child(1) { animation-delay: 0s; }
.parasite-letter:nth-child(2) { animation-delay: 0.3s; }
.parasite-letter:nth-child(3) { animation-delay: 0.6s; }
.parasite-letter:nth-child(4) { animation-delay: 0.9s; }
.parasite-letter:nth-child(5) { animation-delay: 1.2s; }
.parasite-letter:nth-child(6) { animation-delay: 1.5s; }
.parasite-letter:nth-child(7) { animation-delay: 1.8s; }
.parasite-letter:nth-child(8) { animation-delay: 2.1s; }

/* Ink Creep Keyframes - 4 Cyber Colors */
@keyframes ink-creep {
    0%, 100% { color: oklch(70% 0.18 180); }
    25% { color: oklch(65% 0.22 280); }
    50% { color: oklch(75% 0.20 220); }
    75% { color: oklch(70% 0.25 320); }
}

.parasite[data-animate="true"] .parasite-letter {
    animation: ink-creep 10s cubic-bezier(0.33, 1, 0.68, 1) infinite;
}

/* =================================================================
   Sporadic Pulse Overlay
   ================================================================= */

.parasite::after {
    content: '';
    position: absolute;
    inset: -12px;
    border-radius: 8px;
    background: linear-gradient(
        135deg,
        rgba(65, 240, 219, 0.2) 0%,
        rgba(147, 51, 234, 0.2) 100%
    );
    opacity: 0;
    pointer-events: none;
    z-index: 1;
}

.parasite[data-pulse="true"]::after {
    animation: sporadic-pulse 500ms cubic-bezier(0.33, 1, 0.68, 1) forwards;
}

@keyframes sporadic-pulse {
    0% { opacity: 0; transform: scale(0.95); }
    50% { opacity: 0.8; }
    100% { opacity: 0; transform: scale(1.05); }
}

/* =================================================================
   Size Variants
   ================================================================= */

.parasite[data-size="sm"] { font-size: 1.125rem; }
.parasite[data-size="md"] { font-size: 1.5rem; }
.parasite[data-size="lg"] { font-size: clamp(2rem, 4vw, 3.5rem); }
.parasite[data-size="hero"] { font-size: clamp(3rem, 8vw, 6rem); }

/* =================================================================
   Reduced Motion
   ================================================================= */

@media (prefers-reduced-motion: reduce) {
    .parasite-letter,
    .parasite::after {
        animation: none !important;
        transition: none !important;
    }
}
```

---

## Verification

1. [ ] `pnpm check` passes
2. [ ] Letters have HARD CRISP bevel (not soft/rounded)
3. [ ] Ink creep animation still works
4. [ ] Pulse effect still works
5. [ ] Reduced motion respected

---

## Execution Command

```
Read parasite.css → Replace entire file → Run pnpm check → Visual verify in TopBar
```
