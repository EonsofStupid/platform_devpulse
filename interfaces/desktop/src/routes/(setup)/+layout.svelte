<script lang="ts">
import { DynamicBackground } from "$lib/design/components/dynamic-background/index.js";

let { children } = $props();
</script>

<DynamicBackground variant="boot" animated />

<div class="setup-shell" data-layout="setup">
	{@render children()}
</div>

<style>
	/* ──────────────────────────────────────────────────────────────
	   Setup wizard shell
	   Defines the --wiz-* token layer the wizard steps consume.
	   These were previously referenced but never defined anywhere, so
	   every step rendered on flat black. Each token maps to a
	   ColdLight design token (fluid `--space-*` + `--radius-*` +
	   `--shadow-z*` where one exists) so the wizard scales with the
	   rest of the platform instead of freezing at a single size.

	   Role colours follow the owner's 10 Commandments:
	   - brain    → purple
	   - minion   → green
	   - encoder  → blue
	   - voice    → orange/coral
	   ────────────────────────────────────────────────────────────── */
	.setup-shell {
		/* Role accents (Commandment #4) */
		--wiz-role-brain: var(--accent-purple-main, oklch(0.65 0.2 300));
		--wiz-role-minion: var(--brand-green, oklch(0.75 0.2 145));
		--wiz-role-encoder: var(--brand-blue, oklch(0.7 0.18 240));
		--wiz-role-voice: var(--brand-coral, oklch(0.72 0.18 30));

		/* Role glows — wider, softer drop-shadows used on hover. Radius
		   uses the fluid --space-24 token so the glow scales with the
		   same clamp() range as everything else. */
		--wiz-glow-purple: 0 0 var(--space-24) oklch(0.65 0.2 300 / 0.35);
		--wiz-glow-green: 0 0 var(--space-24) oklch(0.75 0.2 145 / 0.35);
		--wiz-glow-cyan: 0 0 var(--space-24) oklch(0.75 0.18 200 / 0.35);
		--wiz-glow-ember: 0 0 var(--space-24) oklch(0.72 0.18 30 / 0.35);

		/* Role fills — semi-transparent tints for full-card backgrounds */
		--wiz-fill-purple: oklch(0.65 0.2 300 / 0.08);
		--wiz-fill-green: oklch(0.75 0.2 145 / 0.08);
		--wiz-fill-cyan: oklch(0.75 0.18 200 / 0.08);
		--wiz-fill-ember: oklch(0.72 0.18 30 / 0.1);
		--wiz-fill-magenta: oklch(0.65 0.22 340 / 0.08);

		/* Brand colours reused by buttons, badges, progress bars */
		--wiz-cyan: var(--brand-cyan, oklch(0.78 0.17 200));
		--wiz-green: var(--brand-green, oklch(0.75 0.2 145));
		--wiz-blue: var(--brand-blue, oklch(0.7 0.18 240));
		--wiz-coral: var(--brand-coral, oklch(0.72 0.18 30));
		--wiz-gold: var(--brand-gold, oklch(0.82 0.17 85));
		--wiz-hotpink: var(--brand-hotpink, oklch(0.7 0.22 350));
		--wiz-salmon: var(--brand-salmon, oklch(0.72 0.2 20));

		/* Ember variants used by error states */
		--wiz-ember-200: oklch(0.82 0.12 30);
		--wiz-ember-300: oklch(0.78 0.15 30);
		--wiz-ember-600: oklch(0.55 0.2 30);

		/* Surfaces — deep glass on top of the DynamicBackground */
		--wiz-card: var(--glass-deep, oklch(0.12 0.02 224 / 0.72));
		--wiz-card-raised: var(--glass-smoke, oklch(0.16 0.02 224 / 0.78));
		--wiz-inset: var(--surface-inset, oklch(0.08 0.015 224 / 0.85));
		--wiz-overlay: oklch(0.05 0.015 224 / 0.88);

		/* Void scale used by borders + progress tracks */
		--wiz-void-950: oklch(0.05 0.015 224);
		--wiz-void-800: oklch(0.14 0.015 224);
		--wiz-void-700: oklch(0.2 0.015 224);
		--wiz-void-600: oklch(0.28 0.015 224);
		--wiz-void-500: oklch(0.4 0.012 224);
		--wiz-void-400: oklch(0.56 0.01 224);

		/* Borders */
		--wiz-border: var(--border-subtle, oklch(0.3 0.01 224 / 0.5));
		--wiz-border-strong: var(--border-default, oklch(0.45 0.015 224 / 0.75));
		--wiz-border-focus: var(--brand-cyan, oklch(0.78 0.17 200));

		/* Text */
		--wiz-text: var(--text-primary, oklch(0.95 0.01 224));
		--wiz-text-sub: var(--text-secondary, oklch(0.78 0.012 224));
		--wiz-text-muted: var(--text-muted, oklch(0.58 0.01 224));

		/* Type scale */
		--wiz-text-xs: 0.75rem;
		--wiz-text-sm: 0.875rem;

		/* Radii — map onto the fluid --radius-* token family */
		--wiz-radius-xs: var(--radius-xs);
		--wiz-radius-sm: var(--radius-sm);
		--wiz-radius-md: var(--radius-md);
		--wiz-radius-lg: var(--radius-lg);
		--wiz-radius-xl: var(--radius-xl);
		--wiz-radius-full: var(--radius-full);

		/* Shadows — reuse the fluid --shadow-z* elevation scale */
		--wiz-shadow-md: var(--shadow-z2);
		--wiz-shadow-lg: var(--shadow-z3);
		--wiz-shadow-xl: var(--shadow-z4);

		/* Motion */
		--wiz-duration-fast: var(--motion-duration-fast, 160ms);
		--wiz-duration-normal: var(--motion-duration-normal, 240ms);

		/* Z-index */
		--wiz-z-tooltip: 1000;
		--wiz-z-modal: 1100;

		/* Layout */
		position: relative;
		height: 100vh;
		width: 100vw;
		overflow: auto;
		color: var(--wiz-text);
	}
</style>
