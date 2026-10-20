/**
 * @file containersState — containers for your projects, as Rust publishes them.
 * @module @devpulse/domains/app/containers/data-access/containers.state
 *
 * What this machine has, your three answers, the recommendation and the step
 * running arrive as the `containers` state signal (replayed to late
 * windows). Intents go to Rust, which checks, advises and runs each step only
 * when asked; nothing here decides anything. A refusal keeps Rust's message
 * in `error`.
 */

import { signalFabric } from "$lib/sys/events/signal-fabric.js";
import type { Answers, ContainersState, Result, Step } from "$lib/sys/generated/bindings.js";
import { commands } from "$lib/sys/generated/bindings.js";
import { logError } from "$lib/sys/logger.js";

export type { Answers, ContainersState, Step };

const LOG_TARGET = "domains.containers";

const message = (e: unknown): string => (e instanceof Error ? e.message : String(e));

class ContainersStore {
	current = $state<ContainersState | null>(null);
	/** An intent is on its way to Rust. */
	busy = $state(false);
	error = $state<string | null>(null);
	private off: (() => void) | null = null;

	/** Follow the `containers` signal. Returns the teardown. */
	start(): () => void {
		this.off ??= signalFabric.on("containers", (state) => {
			this.current = state;
		});
		return () => {
			this.off?.();
			this.off = null;
		};
	}

	private async run(
		name: string,
		intent: () => Promise<Result<ContainersState, string>>,
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

	check = (): Promise<void> => this.run("containersCheck", () => commands.containersCheck());

	answer = (answers: Answers): Promise<void> =>
		this.run("containersAnswer", () => commands.containersAnswer(answers));

	runStep = (step: Step): Promise<void> =>
		this.run("containersRunStep", () => commands.containersRunStep(step));
}

export const containersState = new ContainersStore();
