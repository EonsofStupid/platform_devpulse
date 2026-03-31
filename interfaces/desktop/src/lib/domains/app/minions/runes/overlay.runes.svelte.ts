/**
 * @file Minion Overlay State
 * @module @devpulse/domains/app/minions/runes/overlay
 *
 * Controls which minions appear on screen and their animation states.
 * Listens to MAESTRO signals (future) — for now, expose manual controls.
 */

import type { ActiveMinion, MinionAnimationState } from "$lib/design/overlays/types.js";

class MinionOverlayState {
	active = $state<ActiveMinion[]>([]);
	enabled = $state(true);

	/** Activate a minion — appears on screen. */
	activate(minionId: string): void {
		if (this.active.some((m) => m.minionId === minionId)) return;

		// Random position along the bottom edge
		const x = Math.random() * (window.innerWidth - 100) + 50;
		const y = window.innerHeight - 100;

		this.active.push({
			minionId,
			state: "walking",
			x,
			y,
			targetX: Math.random() * (window.innerWidth - 200) + 100,
			targetY: window.innerHeight - 120 - Math.random() * 60,
			flipped: Math.random() > 0.5,
		});
	}

	/** Deactivate a minion — removes from screen. */
	deactivate(minionId: string): void {
		this.active = this.active.filter((m) => m.minionId !== minionId);
	}

	/** Set a minion's animation state. */
	setState(minionId: string, state: MinionAnimationState): void {
		const minion = this.active.find((m) => m.minionId === minionId);
		if (minion) {
			minion.state = state;
		}
	}

	/** Escalate a minion — glow animation. */
	escalate(minionId: string): void {
		this.setState(minionId, "escalated");
	}

	/** Set minion to working state. */
	setWorking(minionId: string): void {
		this.setState(minionId, "working");
	}

	/** Set minion to idle. */
	setIdle(minionId: string): void {
		this.setState(minionId, "idle");
	}

	/** Toggle overlay visibility. */
	toggle(): void {
		this.enabled = !this.enabled;
	}

	/** Clear all minions from overlay. */
	clear(): void {
		this.active = [];
	}
}

export const minionOverlayState = new MinionOverlayState();
