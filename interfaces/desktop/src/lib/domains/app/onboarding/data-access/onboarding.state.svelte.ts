/**
 * @file onboardingState — first run as Rust publishes it.
 * @module @devpulse/domains/app/onboarding/data-access/onboarding.state
 *
 * The value arrives as the `onboarding` state signal (replayed to late
 * windows). Intents go to Rust, which checks them, writes to Turso and
 * publishes the new state; nothing here decides a transition. A refusal
 * keeps Rust's message in `error`.
 */

import { signalFabric } from "#lib/sys/events/signal-fabric.js";
import type { OnboardingState } from "../util/onboarding.types.js";
import * as intents from "./onboarding.service.js";

class OnboardingStore {
	current = $state<OnboardingState | null>(null);
	busy = $state(false);
	error = $state<string | null>(null);
	private off: (() => void) | null = null;

	/** First run is showing. */
	get isOpen(): boolean {
		return this.current?.status === "open";
	}

	/** Follow the `onboarding` signal. Returns the teardown. */
	start(): () => void {
		this.off ??= signalFabric.on("onboarding", (state) => {
			this.current = state;
		});
		return () => {
			this.off?.();
			this.off = null;
		};
	}

	private async run(intent: () => Promise<OnboardingState>): Promise<void> {
		this.busy = true;
		this.error = null;
		try {
			this.current = await intent();
		} catch (e) {
			this.error = e instanceof Error ? e.message : String(e);
		} finally {
			this.busy = false;
		}
	}

	next = (): Promise<void> => this.run(intents.next);
	back = (): Promise<void> => this.run(intents.back);
	later = (): Promise<void> => this.run(intents.later);
	reopen = (): Promise<void> => this.run(intents.reopen);
}

export const onboardingState = new OnboardingStore();
