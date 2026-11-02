/**
 * @file Providers service — the only place the providers domain talks to
 * Rust: look at every provider again, and run one of the vendor's own
 * actions. A failure becomes a thrown `Error` carrying Rust's message, and
 * is logged (plan 0001 B3.6).
 * @module @devpulse/domains/app/providers/data-access/providers.service
 */

import type { Result } from "$lib/sys/bindings/_shared/index.js";
import {
	type ProviderAction,
	type ProviderId,
	type ProvidersState,
	providerConnectionCheck,
	providerConnectionOptions,
	providerConnectionRemove,
	providerConnectionSave,
	providerConnectionTest,
	providersCheck,
	providersCheckSignedIn,
	providersRunAction,
} from "$lib/sys/bindings/providers/index.js";
import type { ConnectionOption, SaveConnection } from "$lib/sys/generated/bindings.js";
import { logError } from "$lib/sys/logger.js";

async function unwrap<T>(name: string, call: Promise<Result<T, string>>): Promise<T> {
	const result = await call;
	if (result.status === "error") {
		logError("providers.service", `${name} failed: ${result.error}`);
		throw new Error(result.error);
	}
	return result.data;
}

/** Look at every provider on this machine again. */
export const check = (): Promise<ProvidersState> => unwrap("providersCheck", providersCheck());

/** Ask one provider again whether you are signed in (its status command only). */
export const checkSignedIn = (providerId: ProviderId): Promise<ProvidersState> =>
	unwrap("providersCheckSignedIn", providersCheckSignedIn(providerId));

/** Run one of a provider's actions (the vendor's own command, or Try it). */
export const runAction = (
	providerId: ProviderId,
	action: ProviderAction,
): Promise<ProvidersState> => unwrap("providersRunAction", providersRunAction(providerId, action));

export const connectionOptions = (): Promise<ConnectionOption[]> => providerConnectionOptions();
export const saveConnection = (request: SaveConnection): Promise<ProvidersState> =>
	unwrap("providerConnectionSave", providerConnectionSave(request));
export const checkConnection = (id: string): Promise<ProvidersState> =>
	unwrap("providerConnectionCheck", providerConnectionCheck(id));
export const removeConnection = (id: string): Promise<ProvidersState> =>
	unwrap("providerConnectionRemove", providerConnectionRemove(id));
export const testConnection = (id: string, model: string): Promise<ProvidersState> =>
	unwrap("providerConnectionTest", providerConnectionTest(id, model));
