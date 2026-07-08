# Sprint 01: Frame.svelte - FULL HUD AESTHETIC

> **Target**: `layouts/app/Frame.svelte`
> **Vision**: Deep sci-fi HUD. NEON GLOW borders. Liquid gradient overlays. Multi-layer depth.
> **References**: DASHBOARD-REFERENCE-01.png, reference-liquid-metal.png, pulseos-effect-glass.ds.css

---

## Design Language (From OLD_PROJECTS_CSS)

The patterns to replicate:
- **pulseos-glass-topbar**: `::before` + `::after` for liquid gradient overlays
- **Multi-layer shadows**: 6+ shadow layers for depth (inset highlights, inset shadows, outer glow, elevation)
- **Neon glow**: `0 0 20px hsl(191 100% 56% / 0.5)` pattern
- **HSL color approach**: For future ColdLight token conversion
- **Radial gradients**: For 3D depth illusion

---

## CSS Rewrite

Replace the entire `<style>` block with:

```css
<style>
    /* =============================================
       APP FRAME - SCI-FI HUD AESTHETIC
       Pattern: pulseos-glass-topbar from OLD_PROJECTS
       Future: Convert to ColdLight tokens
       ============================================= */
    .app-frame {
        display: grid;
        grid-template-rows: 48px 1fr 32px;
        grid-template-columns: 64px 1fr;
        grid-template-areas:
            "topbar  topbar"
            "sidebar content"
            "status  status";
        width: 100%;
        height: 100%;
        overflow: hidden;
        /* Deep void - multi-layer radial gradients for depth */
        background:
            radial-gradient(ellipse 120% 80% at 50% 0%, hsl(210 60% 15% / 0.4) 0%, transparent 50%),
            radial-gradient(ellipse 80% 60% at 80% 100%, hsl(191 100% 60% / 0.08) 0%, transparent 40%),
            radial-gradient(ellipse 60% 40% at 10% 80%, hsl(320 100% 60% / 0.06) 0%, transparent 40%),
            linear-gradient(180deg, hsl(222 70% 6% / 1) 0%, hsl(222 60% 8% / 1) 100%);
        color: hsl(0 0% 98% / 0.95);
        font-family: "Rajdhani", "Inter", system-ui, sans-serif;
    }

    /* =============================================
       TOPBAR - Pattern: pulseos-glass-topbar
       Liquid gradients via ::before + ::after
       ============================================= */
    .frame-topbar {
        grid-area: topbar;
        position: relative;
        width: 100%;
        height: 100%;
        /* Base glass - matches pulseos-glass-panel-bg-hsl */
        background: hsl(222 48% 11% / 0.85);
        backdrop-filter: blur(24px) saturate(180%);
        -webkit-backdrop-filter: blur(24px) saturate(180%);
        /* NEON GLOW border */
        border-bottom: 1px solid hsl(191 100% 60% / 0.5);
        /* Complex depth - 6 layer shadow stack */
        box-shadow:
            /* Inset highlight top */
            inset 0 1px 0 hsl(0 0% 100% / 0.15),
            inset 0 2px 0 hsl(191 100% 60% / 0.1),
            /* Inset shadow bottom */
            inset 0 -1px 0 hsl(0 0% 0% / 0.4),
            inset 0 -2px 0 hsl(320 100% 60% / 0.08),
            /* NEON GLOW - the HUD signature */
            0 0 20px hsl(191 100% 60% / 0.25),
            /* Elevation */
            0 4px 24px hsl(0 0% 0% / 0.5);
        z-index: 100;
        overflow: hidden;
    }

    /* Liquid gradient overlay - cyan to pink */
    .frame-topbar::before {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(
            90deg,
            hsl(191 100% 60% / 0.12) 0%,
            hsl(191 100% 60% / 0.08) 30%,
            hsl(320 100% 60% / 0.06) 70%,
            hsl(320 100% 60% / 0.10) 100%
        );
        pointer-events: none;
        z-index: 0;
    }

    /* Radial depth overlay - 3D illusion */
    .frame-topbar::after {
        content: '';
        position: absolute;
        inset: 0;
        background:
            radial-gradient(ellipse 600px 150px at 15% 50%, hsl(191 100% 60% / 0.10) 0%, transparent 60%),
            radial-gradient(ellipse 600px 150px at 85% 50%, hsl(320 100% 60% / 0.08) 0%, transparent 60%);
        pointer-events: none;
        z-index: 0;
    }

    /* =============================================
       SIDEBAR - Deep inset channel + neon edge
       ============================================= */
    .frame-sidebar {
        grid-area: sidebar;
        position: relative;
        width: 100%;
        height: 100%;
        /* Deeper than topbar */
        background: hsl(222 60% 7% / 0.95);
        backdrop-filter: blur(20px) saturate(160%);
        -webkit-backdrop-filter: blur(20px) saturate(160%);
        /* Neon edge */
        border-right: 1px solid hsl(191 100% 60% / 0.35);
        box-shadow:
            /* Deep inset channel */
            inset -4px 0 12px hsl(0 0% 0% / 0.5),
            inset 2px 0 0 hsl(0 0% 100% / 0.03),
            /* Edge glow */
            4px 0 16px hsl(191 100% 60% / 0.12);
        overflow-y: auto;
        overflow-x: hidden;
    }

    /* Vertical gradient overlay */
    .frame-sidebar::before {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(
            180deg,
            hsl(191 100% 60% / 0.04) 0%,
            transparent 30%,
            transparent 70%,
            hsl(320 100% 60% / 0.03) 100%
        );
        pointer-events: none;
        z-index: 0;
    }

    /* =============================================
       CONTENT - Recessed void + grid texture
       ============================================= */
    .frame-content {
        grid-area: content;
        position: relative;
        width: 100%;
        height: 100%;
        overflow: hidden;
        /* Deepest layer */
        background: hsl(222 70% 5% / 0.9);
        box-shadow:
            /* Heavy recess */
            inset 4px 4px 16px hsl(0 0% 0% / 0.6),
            inset -2px -2px 8px hsl(0 0% 100% / 0.02),
            inset 0 0 40px hsl(0 0% 0% / 0.4);
    }

    /* HUD grid texture */
    .frame-content::before {
        content: '';
        position: absolute;
        inset: 0;
        background-image:
            linear-gradient(hsl(191 100% 60% / 0.03) 1px, transparent 1px),
            linear-gradient(90deg, hsl(191 100% 60% / 0.03) 1px, transparent 1px);
        background-size: 40px 40px;
        pointer-events: none;
        z-index: 0;
        opacity: 0.5;
    }

    .content-scroll {
        position: relative;
        width: 100%;
        height: 100%;
        overflow-y: auto;
        overflow-x: hidden;
        padding: 16px;
        z-index: 1;
    }

    /* =============================================
       STATUSBAR - Neon glow upward
       ============================================= */
    .frame-statusbar {
        grid-area: status;
        position: relative;
        width: 100%;
        height: 100%;
        background: hsl(222 48% 11% / 0.9);
        backdrop-filter: blur(20px) saturate(180%);
        -webkit-backdrop-filter: blur(20px) saturate(180%);
        /* Neon border */
        border-top: 1px solid hsl(191 100% 60% / 0.4);
        box-shadow:
            /* Crisp bevel */
            inset 0 1px 0 hsl(191 100% 60% / 0.12),
            inset 0 -1px 0 hsl(0 0% 0% / 0.4),
            /* Neon glow upward */
            0 -2px 16px hsl(191 100% 60% / 0.15),
            0 -4px 32px hsl(191 100% 60% / 0.08);
        z-index: 100;
        overflow: hidden;
    }

    /* Liquid gradient */
    .frame-statusbar::before {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(
            90deg,
            hsl(191 100% 60% / 0.06) 0%,
            transparent 40%,
            transparent 60%,
            hsl(320 100% 60% / 0.05) 100%
        );
        pointer-events: none;
        z-index: 0;
    }

    /* =============================================
       SCROLLBARS - Cyber glass + neon
       ============================================= */
    .content-scroll::-webkit-scrollbar {
        width: 8px;
    }
    .content-scroll::-webkit-scrollbar-track {
        background: hsl(222 70% 5% / 0.8);
        border-left: 1px solid hsl(191 100% 60% / 0.1);
    }
    .content-scroll::-webkit-scrollbar-thumb {
        background: linear-gradient(
            180deg,
            hsl(191 100% 60% / 0.5) 0%,
            hsl(267 100% 56% / 0.4) 50%,
            hsl(191 100% 60% / 0.5) 100%
        );
        border-radius: 4px;
        border: 1px solid hsl(191 100% 60% / 0.3);
        box-shadow: 0 0 8px hsl(191 100% 60% / 0.3);
    }
    .content-scroll::-webkit-scrollbar-thumb:hover {
        background: linear-gradient(
            180deg,
            hsl(191 100% 60% / 0.7) 0%,
            hsl(267 100% 56% / 0.6) 50%,
            hsl(191 100% 60% / 0.7) 100%
        );
        box-shadow: 0 0 16px hsl(191 100% 60% / 0.5);
    }

    /* Sidebar scrollbar */
    .frame-sidebar::-webkit-scrollbar {
        width: 4px;
    }
    .frame-sidebar::-webkit-scrollbar-track {
        background: transparent;
    }
    .frame-sidebar::-webkit-scrollbar-thumb {
        background: hsl(191 100% 60% / 0.3);
        border-radius: 2px;
        box-shadow: 0 0 4px hsl(191 100% 60% / 0.2);
    }
    .frame-sidebar::-webkit-scrollbar-thumb:hover {
        background: hsl(191 100% 60% / 0.5);
        box-shadow: 0 0 8px hsl(191 100% 60% / 0.4);
    }

    /* =============================================
       Z-INDEX: Content above pseudo-elements
       ============================================= */
    .frame-topbar > :global(*),
    .frame-sidebar > :global(*),
    .frame-statusbar > :global(*) {
        position: relative;
        z-index: 1;
    }
</style>
```

---

## HSL Color Map (For ColdLight Conversion)

| Role | HSL Value | Notes |
|------|-----------|-------|
| Void base | `hsl(222 70% 6%)` | Deepest background |
| Panel glass | `hsl(222 48% 11% / 0.85)` | TopBar, StatusBar |
| Sidebar deep | `hsl(222 60% 7% / 0.95)` | Sidebar channel |
| Content void | `hsl(222 70% 5% / 0.9)` | Main content |
| Cyan accent | `hsl(191 100% 60%)` | Primary neon |
| Pink accent | `hsl(320 100% 60%)` | Secondary gradient |
| Purple accent | `hsl(267 100% 56%)` | Tertiary scrollbar |

---

## Verification

1. [ ] `pnpm check` passes
2. [ ] TopBar has visible CYAN GLOW border
3. [ ] Sidebar has inset channel depth + edge glow
4. [ ] Content shows faint grid lines (HUD texture)
5. [ ] StatusBar glows upward
6. [ ] Scrollbar thumb has neon glow
7. [ ] Feels like SCI-FI CONTROL PANEL from references

---

## Execution Command

```
Read Frame.svelte -> Replace <style> block -> Run pnpm check -> Visual verify
```
