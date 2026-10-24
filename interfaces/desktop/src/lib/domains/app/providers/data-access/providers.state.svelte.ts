/**
 * @file providersState — your AI providers, as Rust publishes them.
 * @module @devpulse/domains/app/providers/data-access/providers.state
 *
 * Which subscriptions and apps are on this machine, their versions, whether
 * you are signed in, and the action running arrive as the `providers` state
 * signal (replayed to late windows). Intents go to Rust through the service,
 * which runs the vendor's own commands; nothing here decides anything. A
 * refusal keeps Rust's message in `error`.
 *
 * While anything follows the state, coming back to the window looks at the
 * providers again (at most once a minute), so a sign-in finished in the
 * vendor's own tool shows without a click.
 */

import type {
	ProviderAction,
	ProviderId,
	ProvidersState,
} from "$lib/sys/bindings/providers/index.js";
import { signalFabric } from "$lib/sys/events/signal-fabric.js";
import { check, runAction } from "./providers.service.js";

export type { ProviderAction, ProvidersState };

/** The shortest time between two checks started by returning to the window. */
const FOCUS_RECHECK_MS = 60_000;

const message = (e: unknown): string => (e instanceof Error ? e.message : String(e));

class ProvidersStore {
	current = $state<ProvidersState | null>(null);
	/** An intent is on its way to Rust. */
	busy = $state(false);
	error = $state<string | null>(null);
	/** How many views follow the state; the subscriptions end with the last. */
	private followers = 0;
	private stop: (() => void) | null = null;
	private lastCheck = 0;

	/** Follow the `providers` signal and the window's focus. Returns the teardown. */
	start(): () => void {
		this.followers += 1;
		if (!this.stop) {
			const off = signalFabric.on("providers", (state) => {
				this.current = state;
			});
			const onFocus = (): void => this.recheck();
			window.addEventListener("focus", onFocus);
			this.stop = () => {
				off();
				window.removeEventListener("focus", onFocus);
			};
		}
		return () => {
			this.followers -= 1;
			if (this.followers === 0) {
				this.stop?.();
				this.stop = null;
			}
		};
	}

	/** Back in the window: look again, unless something is already running. */
	private recheck(): void {
		const idle = !this.busy && !this.current?.checking && !this.current?.running;
		if (idle && Date.now() - this.lastCheck >= FOCUS_RECHECK_MS) {
			void this.check();
		}
	}

	private async run(intent: () => Promise<ProvidersState>): Promise<void> {
		this.busy = true;
		this.error = null;
		try {
			this.current = await intent();
		} catch (e) {
			this.error = message(e);
		} finally {
			this.busy = false;
		}
	}

	check = (): Promise<void> => {
		this.lastCheck = Date.now();
		return this.run(check);
	};

	act = (providerId: ProviderId, action: ProviderAction): Promise<void> =>
		this.run(() => runAction(providerId, action));
}

export const providersState = new ProvidersStore();
