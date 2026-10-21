/**
 * @file providersState — your AI providers, as Rust publishes them.
 * @module @devpulse/domains/app/providers/data-access/providers.state
 *
 * Which subscriptions and apps are on this machine, their versions, whether
 * you are signed in, and the action running arrive as the `providers` state
 * signal (replayed to late windows). Intents go to Rust, which runs the
 * vendor's own commands; nothing here decides anything. A refusal keeps
 * Rust's message in `error`.
 */

import { signalFabric } from "$lib/sys/events/signal-fabric.js";
import type { ProviderAction, ProvidersState, Result } from "$lib/sys/generated/bindings.js";
import { commands } from "$lib/sys/generated/bindings.js";
import { logError } from "$lib/sys/logger.js";

export type { ProviderAction, ProvidersState };

const LOG_TARGET = "domains.providers";

const message = (e: unknown): string => (e instanceof Error ? e.message : String(e));

class ProvidersStore {
	current = $state<ProvidersState | null>(null);
	/** An intent is on its way to Rust. */
	busy = $state(false);
	error = $state<string | null>(null);
	private off: (() => void) | null = null;

	/** Follow the `providers` signal. Returns the teardown. */
	start(): () => void {
		this.off ??= signalFabric.on("providers", (state) => {
			this.current = state;
		});
		return () => {
			this.off?.();
			this.off = null;
		};
	}

	private async run(
		name: string,
		intent: () => Promise<Result<ProvidersState, string>>,
	): Promise<void> {
		this.busy = true;
		this.error = null;
		try {
			const result = await intent();
			if (result.status === "error") throw new Error(result.error);
			this.current = result.data;
		} catch (e) {
			this.error = message(e);
			logError(LOG_TARGET, `${name} failed — ${this.error}`);
		} finally {
			this.busy = false;
		}
	}

	check = (): Promise<void> => this.run("providersCheck", () => commands.providersCheck());

	act = (providerId: string, action: ProviderAction): Promise<void> =>
		this.run("providersRunAction", () => commands.providersRunAction(providerId, action));
}

export const providersState = new ProvidersStore();
