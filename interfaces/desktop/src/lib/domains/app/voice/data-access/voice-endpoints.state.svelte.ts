/**
 * @file Speech endpoint bindings rune — which saved connection and model
 * speech-to-text and text-to-speech run through.
 * @domain voice
 *
 * The kernel decides; a refusal keeps Rust's message in `error`.
 */

import type {
	SavedConnection,
	SpeechBinding,
	SpeechEndpoints,
	SpeechRole,
} from "#lib/sys/generated/bindings.js";
import { logError } from "#lib/sys/logger.js";
import * as service from "./voice.service.js";

class VoiceEndpointsState {
	current = $state<SpeechEndpoints | null>(null);
	/** A choice is on its way to Rust. */
	busy = $state(false);
	error = $state<string | null>(null);

	/** The saved choice for one role. */
	binding(role: SpeechRole): SpeechBinding | null {
		return this.current?.[role] ?? null;
	}

	private async run(intent: () => Promise<SpeechEndpoints>): Promise<void> {
		this.busy = true;
		this.error = null;
		try {
			this.current = await intent();
		} catch (e) {
			this.error = e instanceof Error ? e.message : String(e);
			logError("voice.endpoints", this.error);
		} finally {
			this.busy = false;
		}
	}

	load = (): Promise<void> => this.run(service.listSpeechEndpoints);

	choose = (role: SpeechRole, connection: SavedConnection, model: string): Promise<void> =>
		this.run(() => service.setSpeechEndpoint(role, connection.id, connection.revision, model));

	stopUsing = (role: SpeechRole): Promise<void> =>
		this.run(() => service.clearSpeechEndpoint(role));
}

export const voiceEndpointsState = new VoiceEndpointsState();
