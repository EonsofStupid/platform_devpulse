/**
 * @file sys/registries/streams/streams.registry.ts
 * @module @devpulse/sys/registries/streams
 * @description Streams registry for subscription management
 */

import type { StreamMetadata, StreamsRegistry as IStreamsRegistry } from '../../contracts/index.js';
import { BaseRegistry } from '../base.registry.js';

/**
 * Streams registry implementation
 * Manages active subscriptions and stream metadata
 */
class StreamsRegistryImpl extends BaseRegistry<StreamMetadata> implements IStreamsRegistry {
  private typeIndex = new Map<string, Set<string>>(); // type -> ids

  getByType(type: string): StreamMetadata[] {
    const ids = this.typeIndex.get(type);
    if (!ids) return [];
    return Array.from(ids).map(id => this.get(id)!).filter(Boolean);
  }

  getActive(): StreamMetadata[] {
    return Array.from(this.items.values()).filter(
      s => s.status === 'active' || s.status === 'connecting'
    );
  }

  override register(id: string, item: StreamMetadata): void {
    super.register(id, item);

    if (!this.typeIndex.has(item.type)) {
      this.typeIndex.set(item.type, new Set());
    }
    this.typeIndex.get(item.type)!.add(id);
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
  updateStatus(id: string, status: StreamMetadata['status'], error?: string): void {
    const item = this.get(id);
    if (item) {
      const updated: StreamMetadata = {
        ...item,
        status,
        error: status === 'error' ? error : undefined,
        lastMessageAt: status === 'active' ? new Date() : item.lastMessageAt,
      };
      this.items.set(id, updated);
    }
  }
}

/** Singleton streams registry */
export const streamsRegistry = new StreamsRegistryImpl();
