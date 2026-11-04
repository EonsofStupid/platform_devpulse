/**
 * @file sys/registries/streams/streams.registry.ts
 * @module @devpulse/sys/registries/streams
 * @description Streams registry for subscription management
 *
 * The app's live subscriptions, reported by the signal fabric and
 * `createTauriEvent`. A read model: messages never pass through here.
 */

import {
	type StreamsRegistry as IStreamsRegistry,
	type StreamMetadata,
	StreamMetadataContract,
} from "../../contracts/index.js";
import { BaseRegistry } from "../base.registry.js";

/**
 * Streams registry implementation
 * Manages active subscriptions and stream metadata
 */
class StreamsRegistryImpl extends BaseRegistry<StreamMetadata> implements IStreamsRegistry {
	private typeIndex = new Map<string, Set<string>>(); // type -> ids

	getByType(type: string): StreamMetadata[] {
		const ids = this.typeIndex.get(type);
		if (!ids) return [];
		return Array.from(ids).flatMap((id) => this.get(id) ?? []);
	}

	getActive(): StreamMetadata[] {
		return Array.from(this.items.values()).filter(
			(s) => s.status === "active" || s.status === "connecting",
		);
	}

	override register(id: string, item: StreamMetadata): void {
		StreamMetadataContract.assert(item);
		super.register(id, item);

		const ids = this.typeIndex.get(item.type) ?? new Set<string>();
		this.typeIndex.set(item.type, ids.add(id));
	}

	override unregister(id: string): boolean {
		const item = this.get(id);
		if (item) {
			this.typeIndex.get(item.type)?.delete(id);
		}
		return super.unregister(id);
	}

	override clear(): void {
		super.clear();
		this.typeIndex.clear();
	}

	/** Update stream status */
	updateStatus(id: string, status: StreamMetadata["status"], error?: string): void {
		const item = this.get(id);
		if (item) {
			const { error: _previous, ...rest } = item;
			this.items.set(id, {
				...rest,
				status,
				...(status === "error" && error !== undefined ? { error } : {}),
			});
		}
	}

	/** A message arrived on a stream. */
	recordMessage(id: string): void {
		const item = this.get(id);
		if (item) {
			this.items.set(id, { ...item, status: "active", lastMessageAt: new Date() });
		}
	}
}

/** Singleton streams registry */
export const streamsRegistry = new StreamsRegistryImpl();
