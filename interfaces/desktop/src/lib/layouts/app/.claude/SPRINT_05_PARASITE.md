# Sprint 05: Parasite.css - LIQUID METAL TEXT

> **Target**: `lib/design/plugins/parasite/parasite.css`
> **Vision**: Liquid metal typography with NEON GLOW. Crisp bevels. Ink creep animation.
> **References**: reference-liquid-metal.png, pulseos-effect-hero.ds.css

---

## Design Patterns (From OLD_PROJECTS_CSS)

- **pulseos-hero-title-word**: Multi-layer text-shadow for depth
- **Liquid metal**: Hard crisp shadows (0 blur) + subtle neon glow
- **Ink creep**: OKLCH color cycling through cyber palette
- **Font**: Display font (Orbitron/Rajdhani) for brand weight

---

## CSS Rewrite

Replace the entire file with:

```css
/**
 * @file parasite.css
 * @layer plugins
 * @description Parasite effect - LIQUID METAL typography with ink creep
 * Pattern: pulseos-effect-hero.ds.css
 * @since 1.0.0
 */

/* =================================================================
   Parasite - Liquid Metal Typography
   HARD CRISP BEVELS + NEON GLOW
   Reference: reference-liquid-metal.png
   ================================================================= */

/* Base Container */
.parasite {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    font-family: "Orbitron", "Rajdhani", system-ui, sans-serif;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    position: relative;
    overflow: visible;
}

/* =============================================
   LIQUID METAL LETTER - Deep Glass Bevel
   ============================================= */
.parasite-letter {
    display: inline-block;
    position: relative;
    /* Base color - bright cyan */
    color: hsl(191 100% 65%);
    /* LIQUID METAL EFFECT - Multi-layer crisp shadows */
    text-shadow:
        /* Layer 1: Hard dark shadow (depth) */
        2px 2px 0 hsl(222 70% 8%),
        /* Layer 2: Light highlight top-left (reflection) */
        -1px -1px 0 hsl(0 0% 100% / 0.25),
        /* Layer 3: Deeper shadow layer */
        3px 3px 0 hsl(222 60% 6%),
        /* Layer 4: Third depth layer for liquid metal */
        4px 4px 0 hsl(222 50% 4%),
        /* Layer 5: NEON GLOW - the brand signature */
        0 0 12px hsl(191 100% 60% / 0.7),
        0 0 24px hsl(191 100% 60% / 0.4),
        0 0 48px hsl(191 100% 60% / 0.2);
    /* Crisp edge definition */
    -webkit-text-stroke: 0.5px hsl(222 70% 10%);
    /* Smooth color transition for ink creep */
    transition: color 2.5s cubic-bezier(0.33, 1, 0.68, 1);
}

/* =============================================
   STAGGERED ANIMATION DELAYS
   ============================================= */
.parasite-letter:nth-child(1) { animation-delay: 0s; }
.parasite-letter:nth-child(2) { animation-delay: 0.4s; }
.parasite-letter:nth-child(3) { animation-delay: 0.8s; }
.parasite-letter:nth-child(4) { animation-delay: 1.2s; }
.parasite-letter:nth-child(5) { animation-delay: 1.6s; }
.parasite-letter:nth-child(6) { animation-delay: 2.0s; }
.parasite-letter:nth-child(7) { animation-delay: 2.4s; }
.parasite-letter:nth-child(8) { animation-delay: 2.8s; }
.parasite-letter:nth-child(9) { animation-delay: 3.2s; }
.parasite-letter:nth-child(10) { animation-delay: 3.6s; }

/* =============================================
   INK CREEP ANIMATION - OKLCH Cyber Palette
   ============================================= */
@keyframes ink-creep {
    0%, 100% {
        color: oklch(75% 0.20 191);  /* Cyan */
        text-shadow:
            2px 2px 0 hsl(222 70% 8%),
            -1px -1px 0 hsl(0 0% 100% / 0.25),
            3px 3px 0 hsl(222 60% 6%),
            4px 4px 0 hsl(222 50% 4%),
            0 0 12px hsl(191 100% 60% / 0.7),
            0 0 24px hsl(191 100% 60% / 0.4),
            0 0 48px hsl(191 100% 60% / 0.2);
    }
    25% {
        color: oklch(68% 0.24 320);  /* Pink/Magenta */
        text-shadow:
            2px 2px 0 hsl(222 70% 8%),
            -1px -1px 0 hsl(0 0% 100% / 0.25),
            3px 3px 0 hsl(222 60% 6%),
            4px 4px 0 hsl(222 50% 4%),
            0 0 12px hsl(320 100% 60% / 0.7),
            0 0 24px hsl(320 100% 60% / 0.4),
            0 0 48px hsl(320 100% 60% / 0.2);
    }
    50% {
        color: oklch(72% 0.22 267);  /* Purple */
        text-shadow:
            2px 2px 0 hsl(222 70% 8%),
            -1px -1px 0 hsl(0 0% 100% / 0.25),
            3px 3px 0 hsl(222 60% 6%),
            4px 4px 0 hsl(222 50% 4%),
            0 0 12px hsl(267 100% 60% / 0.7),
            0 0 24px hsl(267 100% 60% / 0.4),
            0 0 48px hsl(267 100% 60% / 0.2);
    }
    75% {
        color: oklch(78% 0.18 220);  /* Electric Blue */
        text-shadow:
            2px 2px 0 hsl(222 70% 8%),
            -1px -1px 0 hsl(0 0% 100% / 0.25),
            3px 3px 0 hsl(222 60% 6%),
            4px 4px 0 hsl(222 50% 4%),
            0 0 12px hsl(220 100% 60% / 0.7),
            0 0 24px hsl(220 100% 60% / 0.4),
            0 0 48px hsl(220 100% 60% / 0.2);
    }
}

.parasite[data-animate="true"] .parasite-letter {
    animation: ink-creep 12s cubic-bezier(0.33, 1, 0.68, 1) infinite;
}

/* =============================================
   NEON PULSE OVERLAY
   ============================================= */
.parasite::after {
    content: '';
    position: absolute;
    inset: -16px;
    border-radius: 12px;
    background: linear-gradient(
        135deg,
        hsl(191 100% 60% / 0.15) 0%,
        hsl(320 100% 60% / 0.10) 50%,
        hsl(267 100% 60% / 0.15) 100%
    );
    opacity: 0;
    pointer-events: none;
    z-index: -1;
}

.parasite[data-pulse="true"]::after {
    animation: neon-pulse 600ms cubic-bezier(0.33, 1, 0.68, 1) forwards;
}

@keyframes neon-pulse {
    0% {
        opacity: 0;
        transform: scale(0.9);
        filter: blur(8px);
    }
    50% {
        opacity: 0.9;
        filter: blur(4px);
    }
    100% {
        opacity: 0;
        transform: scale(1.1);
        filter: blur(12px);
    }
}

/* =============================================
   SIZE VARIANTS
   ============================================= */
.parasite[data-size="sm"] {
    font-size: 1.125rem;
    letter-spacing: 0.08em;
}
.parasite[data-size="md"] {
    font-size: 1.5rem;
    letter-spacing: 0.10em;
}
.parasite[data-size="lg"] {
    font-size: clamp(2rem, 4vw, 3.5rem);
    letter-spacing: 0.12em;
}
.parasite[data-size="hero"] {
    font-size: clamp(3rem, 8vw, 6rem);
    letter-spacing: 0.15em;
}

/* Adjust shadow intensity for smaller sizes */
.parasite[data-size="sm"] .parasite-letter {
    text-shadow:
        1px 1px 0 hsl(222 70% 8%),
        -1px -1px 0 hsl(0 0% 100% / 0.2),
        2px 2px 0 hsl(222 60% 6%),
        0 0 8px hsl(191 100% 60% / 0.6),
        0 0 16px hsl(191 100% 60% / 0.3);
    -webkit-text-stroke: 0.3px hsl(222 70% 10%);
}

/* =============================================
   HOVER STATE - Intensified Glow
   ============================================= */
.parasite:hover .parasite-letter {
    text-shadow:
        2px 2px 0 hsl(222 70% 8%),
        -1px -1px 0 hsl(0 0% 100% / 0.3),
        3px 3px 0 hsl(222 60% 6%),
        4px 4px 0 hsl(222 50% 4%),
        0 0 16px hsl(191 100% 60% / 0.9),
        0 0 32px hsl(191 100% 60% / 0.6),
        0 0 64px hsl(191 100% 60% / 0.3);
    transition: text-shadow 0.3s ease;
}

/* =============================================
   REDUCED MOTION
   ============================================= */
@media (prefers-reduced-motion: reduce) {
    .parasite-letter,
    .parasite::after {
        animation: none !important;
        transition: none !important;
    }
}
```

---

## Liquid Metal Effect Breakdown

| Layer | Purpose | Value |
|-------|---------|-------|
| 1 | Hard dark depth | `2px 2px 0 hsl(222 70% 8%)` |
| 2 | Light reflection | `-1px -1px 0 hsl(0 0% 100% / 0.25)` |
| 3 | Medium depth | `3px 3px 0 hsl(222 60% 6%)` |
| 4 | Deep shadow | `4px 4px 0 hsl(222 50% 4%)` |
| 5-7 | NEON GLOW | `0 0 12/24/48px hsl(191 100% 60% / 0.7/0.4/0.2)` |

---

## Ink Creep Color Palette

| Phase | Color | OKLCH |
|-------|-------|-------|
| 0%/100% | Cyan | `oklch(75% 0.20 191)` |
| 25% | Pink/Magenta | `oklch(68% 0.24 320)` |
| 50% | Purple | `oklch(72% 0.22 267)` |
| 75% | Electric Blue | `oklch(78% 0.18 220)` |

---

## Verification

1. [ ] `pnpm check` passes
2. [ ] Letters have LIQUID METAL depth (4 shadow layers visible)
3. [ ] Letters have NEON GLOW (3 glow layers visible)
4. [ ] Ink creep animation cycles through all 4 colors
5. [ ] Glow color matches current letter color
6. [ ] Hover intensifies the glow
7. [ ] Pulse effect works on trigger
8. [ ] Reduced motion respected

---

## Execution Command

```
Read parasite.css -> Replace entire file -> Run pnpm check -> Visual verify in TopBar
```
