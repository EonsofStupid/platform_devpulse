/**
 * @file src/lib/sys/registries/base.registry.ts
 * @module @devpulse/sys/registries/base
 * @description Base registry implementation with observable pattern
 */

import type { ObservableRegistry, RegistryEvent } from "../contracts/index.js";

/**
 * Base registry implementation
 * Uses Map for O(1) lookup, supports event subscription
 */
export class BaseRegistry<T> implements ObservableRegistry<T> {
	protected items = new Map<string, T>();
	protected listeners = new Set<(event: RegistryEvent<T>) => void>();

	get(id: string): T | undefined {
		return this.items.get(id);
	}

	has(id: string): boolean {
		return this.items.has(id);
	}

	getAll(): Map<string, T> {
		return new Map(this.items);
	}

	getIds(): string[] {
		return Array.from(this.items.keys());
	}

	register(id: string, item: T): void {
		this.items.set(id, item);
		this.emit({ type: "register", id, item });
	}

	unregister(id: string): boolean {
		const existed = this.items.delete(id);
		if (existed) {
			this.emit({ type: "unregister", id });
		}
		return existed;
	}

	clear(): void {
		this.items.clear();
		this.emit({ type: "clear" });
	}

	subscribe(callback: (event: RegistryEvent<T>) => void): () => void {
		this.listeners.add(callback);
		return () => this.listeners.delete(callback);
	}

	protected emit(event: RegistryEvent<T>): void {
		this.listeners.forEach((listener) => {
			listener(event);
		});
	}
}
