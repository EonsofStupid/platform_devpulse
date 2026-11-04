/**
 * @file sys/contracts/registry/registry.contract.ts
 * @module @devpulse/sys/contracts/registry
 * @description Registry contracts for runtime lookup systems
 *
 * The owner's text from SPRINT-01 Task 1.3. The barrel once pointed at
 * `core/registry.contract.ts`, which never reached git; this folder is the
 * named bucket SPRINT-01B locked in place of `/core/`.
 */

/** Base registry interface */
export interface Registry<T> {
	/** Get item by id */
	get(id: string): T | undefined;
	/** Check if item exists */
	has(id: string): boolean;
	/** Get all items */
	getAll(): Map<string, T>;
	/** Get all item ids */
	getIds(): string[];
	/** Register a new item */
	register(id: string, item: T): void;
	/** Unregister an item */
	unregister(id: string): boolean;
	/** Clear all items */
	clear(): void;
}

/** Registry events for reactivity */
export type RegistryEvent<T> =
	| { type: "register"; id: string; item: T }
	| { type: "unregister"; id: string }
	| { type: "clear" };

/** What happened to a registry. */
export type RegistryEventType<T = unknown> = RegistryEvent<T>["type"];

/** Registry with event subscription */
export interface ObservableRegistry<T> extends Registry<T> {
	subscribe(callback: (event: RegistryEvent<T>) => void): () => void;
}
