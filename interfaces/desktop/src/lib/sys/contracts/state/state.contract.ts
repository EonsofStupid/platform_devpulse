/**
 * @file sys/contracts/state/state.contract.ts
 * @module @devpulse/sys/contracts/state
 * @description State module contracts for domain state management
 */

import { type } from "arktype";
import type { Registry } from "../registry/registry.contract.js";

/** State module metadata for registry */
export const StateModuleMetadataContract = type({
	/** Module identifier e.g. 'app.devpulse.devpulse' */
	id: "string > 0",
	/** Namespace e.g. 'app' */
	namespace: "string > 0",
	/** Domain e.g. 'devpulse' */
	domain: "string > 0",
	/** Feature path within domain (optional) */
	"feature?": "string > 0",
	/** File path relative to src/ */
	path: "string > 0",
});

export type StateModuleMetadata = typeof StateModuleMetadataContract.infer;

/** State module contract - what the singleton of a *.state.svelte.ts implements */
export interface StateModuleContract {
	/** The domain this state belongs to */
	readonly domain: string;
	/** Reset state to initial values */
	reset?(): void;
	/** Serialize state for persistence */
	serialize?(): string;
	/** Hydrate state from serialized data */
	hydrate?(data: string): void;
}

/** Domain state namespace pattern */
export type DomainStatePath =
	| `lib/domains/${string}/data-access/${string}.state.svelte.ts`
	| `lib/domains/${string}/feature/${string}/data-access/${string}.state.svelte.ts`;

/** State registry contract */
export interface StateRegistry extends Registry<StateModuleMetadata> {
	/** Get state modules by namespace */
	getByNamespace(namespace: string): StateModuleMetadata[];
	/** Get state modules by domain */
	getByDomain(namespace: string, domain: string): StateModuleMetadata[];
	/** Get state module by feature path */
	getByFeature(namespace: string, domain: string, feature: string): StateModuleMetadata | undefined;
	/** Get the state modules of a hub's owner folder (e.g. "app/devpulse") */
	getByOwner(owner: string): StateModuleMetadata[];
}
