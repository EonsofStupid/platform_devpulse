/**
 * @file wizardState — onboarding nav rune.
 * @module @devpulse/domains/app/models/feature/setup-wizard/wizard-state
 *
 * Tracks the open/closed state + currently-shown step of the model
 * setup wizard. The wizard is layman-facing and runs on first launch
 * (and on demand from the dashboard) to guide the user through:
 *
 *   1. `welcome`     — greeting + name capture
 *   2. `hardware`    — show detected GPU/VRAM, confirm tier
 *   3. `preset`      — pick a model preset matched to the tier
 *   4. `installing`  — download + install slot models, live progress
 *   5. `complete`    — handoff to dashboard, mark setup complete
 *
 * The rune is **navigation-only** — the actual data fetches
 * (`getWizardCopy`, `autoConfigure`, `installToSlot`) live in the
 * `SetupWizardOverlay` component which subscribes to this rune for
 * which step to render. Keeping nav separate from data lets the
 * overlay component own its own data lifecycle.
 *
 * The copy SSOT lives in the engine (`platform/wizard/` —
 * `copy.rs`, `tier_display.rs`); the Tauri commands
 * `getWizardCopy` + `getTierDisplay` expose them to the overlay.
 */

import { isFirstRun, markSetupComplete } from "$lib/sys/bindings/models/index.js";

export type WizardView =
	| "welcome"
	| "hardware"
	| "preset"
	| "endpoint"
	| "capability"
	| "slot-save"
	| "installing"
	| "clyffy-collab"
	| "complete";

/**
 * Order in which views advance via `next()` / `back()`. The customer
 * walk is `endpoint` (find/confirm a Clyffy) → `capability` (the
 * connected Clyffy's advertised senses — anatomy-tile constellation,
 * wire truth) → `complete`. `endpoint` sits first so the sense tiles
 * light up from the freshly connected endpoint's capability instead
 * of rendering empty. Skip on the endpoint step leaves the app
 * standalone (Tier-1) — a mode, never an error — and the tiles render
 * their honest awaiting-backend framing.
 *
 * `slot-save` stays in the type union so the older `SlotSaveView`
 * still type-checks against direct `goTo("slot-save")` callers, but
 * it's unreachable through `next()`/`back()` (retirement = 08/R6).
 * `clyffy-collab` sits between installing and complete so the Claude
 * collab option appears AFTER models finish landing; per the operator
 * ruling 2026-07-14 it becomes the "enable assist" surface and leaves
 * the forward walk in R6.
 */
const VIEW_ORDER: readonly WizardView[] = [
	"welcome",
	"hardware",
	"preset",
	"endpoint",
	"capability",
	"installing",
	"clyffy-collab",
	"complete",
] as const;

class WizardState {
	/** Whether the overlay is currently rendered. */
	isOpen = $state(false);
	/**
	 * Current step.
	 *
	 * The connect flow is TWO steps: `endpoint` (find/confirm a Clyffy)
	 * → `capability` (the connected Clyffy's advertised senses, wire
	 * truth) → `complete`. The wizard opens on `endpoint` — step 1 of 2.
	 * The legacy local-install views (welcome / hardware / preset /
	 * installing) remain reachable destinations (per-step `goTo()`),
	 * not the front door.
	 */
	view = $state<WizardView>("endpoint");
	/** Whether the platform reports this is the user's first launch. */
	firstRun = $state<boolean | null>(null);

	/** Open the wizard overlay. Idempotent. */
	open(): void {
		this.isOpen = true;
	}

	/** Close the wizard overlay. */
	close(): void {
		this.isOpen = false;
	}

	/** Jump to a specific view. */
	goTo(view: WizardView): void {
		this.view = view;
	}

	/** Advance to the next view. No-op past `complete`. */
	next(): void {
		const i = VIEW_ORDER.indexOf(this.view);
		if (i >= 0 && i < VIEW_ORDER.length - 1) {
			this.view = VIEW_ORDER[i + 1] as WizardView;
		}
	}

	/** Step back one view. No-op before `welcome`. */
	back(): void {
		const i = VIEW_ORDER.indexOf(this.view);
		if (i > 0) {
			this.view = VIEW_ORDER[i - 1] as WizardView;
		}
	}

	/**
	 * Refresh `firstRun` from the engine. Called by `BootOverlay` once
	 * boot completes so the overlay decides whether to auto-open.
	 */
	async refreshFirstRun(): Promise<void> {
		const r = await isFirstRun();
		if (r.status === "ok") {
			this.firstRun = r.data;
		} else {
			console.error("wizardState.refreshFirstRun failed:", r.error);
			this.firstRun = false;
		}
	}

	/**
	 * Mark setup complete with the engine + close the overlay. Called
	 * from the `complete` view's "Finish" button.
	 */
	async finish(): Promise<void> {
		const r = await markSetupComplete();
		if (r.status === "error") {
			console.error("wizardState.finish failed:", r.error);
			throw new Error(`markSetupComplete failed: ${r.error}`);
		}
		this.firstRun = false;
		this.close();
	}
}

export const wizardState = new WizardState();
