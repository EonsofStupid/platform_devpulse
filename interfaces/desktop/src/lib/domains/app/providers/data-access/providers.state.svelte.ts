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
 *
 * Signing in (plan 0001 B3.7): opening a provider's sign-in steps asks that
 * one provider every few seconds whether you are signed in yet (its status
 * command only), until it says yes, the steps close, or ten minutes pass.
 */

import type {
	ProviderAction,
	ProviderId,
	ProvidersState,
} from "#lib/sys/bindings/providers/index.js";
import { signalFabric } from "#lib/sys/events/signal-fabric.js";
import type { ConnectionOption, SaveConnection } from "#lib/sys/generated/bindings.js";
import {
	check,
	checkConnection,
	checkSignedIn,
	connectionOptions,
	removeConnection,
	runAction,
	saveConnection,
	testConnection,
} from "./providers.service.js";

export type { ProviderAction, ProvidersState };

/** The shortest time between two checks started by returning to the window. */
const FOCUS_RECHECK_MS = 60_000;
/** How often an open sign-in asks whether you are signed in yet. */
const SIGN_IN_POLL_MS = 4_000;
/** How long an open sign-in keeps asking. */
const SIGN_IN_WATCH_MS = 10 * 60_000;

const message = (e: unknown): string => (e instanceof Error ? e.message : String(e));

class ProvidersStore {
	connectionOptions = $state<ConnectionOption[]>([]);
	current = $state<ProvidersState | null>(null);
	/** An intent is on its way to Rust. */
	busy = $state(false);
	error = $state<string | null>(null);
	/** The provider whose sign-in steps are open. */
	signingIn = $state<ProviderId | null>(null);
	/** The open sign-in is still asking whether you are signed in. */
	watchingSignIn = $state(false);
	/** How many views follow the state; the subscriptions end with the last. */
	private followers = 0;
	private stop: (() => void) | null = null;
	private lastCheck = 0;
	private signInTimer: ReturnType<typeof setInterval> | null = null;
	private signInStarted = 0;

	/** Follow the `providers` signal and the window's focus. Returns the teardown. */
	start(): () => void {
		if (this.connectionOptions.length === 0) {
			void connectionOptions()
				.then((options) => {
					this.connectionOptions = options;
				})
				.catch((error: unknown) => {
					this.error = message(error);
				});
		}
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
				this.closeSignIn();
			}
		};
	}

	/** Open a provider's sign-in steps and watch for the sign-in to finish. */
	openSignIn = (providerId: ProviderId): void => {
		this.closeSignIn();
		this.signingIn = providerId;
		this.signInStarted = Date.now();
		this.watchingSignIn = true;
		this.signInTimer = setInterval(() => void this.pollSignIn(), SIGN_IN_POLL_MS);
	};

	/** Close the sign-in steps and stop watching. */
	closeSignIn = (): void => {
		this.stopWatchingSignIn();
		this.signingIn = null;
	};

	private stopWatchingSignIn(): void {
		if (this.signInTimer) clearInterval(this.signInTimer);
		this.signInTimer = null;
		this.watchingSignIn = false;
	}

	private async pollSignIn(): Promise<void> {
		const id = this.signingIn;
		if (!id || Date.now() - this.signInStarted > SIGN_IN_WATCH_MS) {
			this.stopWatchingSignIn();
			return;
		}
		try {
			const observed = await checkSignedIn(id);
			const provider = observed.report?.providers.find((p) => p.id === id);
			if (provider?.signedIn === "yes") this.stopWatchingSignIn();
		} catch (e) {
			this.error = message(e);
			this.stopWatchingSignIn();
			return;
		}
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
			// Only the revision-checked signal stream owns displayed state. An IPC
			// reply can arrive after a newer update from another window.
			await intent();
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

	saveConnection = async (request: SaveConnection): Promise<boolean> => {
		let saved = false;
		await this.run(async () => {
			const state = await saveConnection(request);
			saved = true;
			return state;
		});
		return saved;
	};
	checkConnection = (id: string): Promise<void> => this.run(() => checkConnection(id));
	removeConnection = (id: string): Promise<void> => this.run(() => removeConnection(id));
	testConnection = (id: string, model: string): Promise<void> =>
		this.run(() => testConnection(id, model));
}

export const providersState = new ProvidersStore();
