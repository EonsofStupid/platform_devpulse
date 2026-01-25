/**
 * @file sys/registries/state/state.registry.ts
 * @module @devpulse/sys/registries/state
 * @description State modules registry for domain state lookup
 */

import type { StateModuleMetadata, StateRegistry as IStateRegistry } from '../../contracts/index.js';
import { BaseRegistry } from '../base.registry.js';

/**
 * State registry implementation
 * Tracks all *.state.svelte.ts modules across domains
 */
class StateRegistryImpl extends BaseRegistry<StateModuleMetadata> implements IStateRegistry {
  private namespaceIndex = new Map<string, Set<string>>(); // namespace -> ids
  private domainIndex = new Map<string, Set<string>>(); // namespace/domain -> ids

  getByNamespace(namespace: string): StateModuleMetadata[] {
    const ids = this.namespaceIndex.get(namespace);
    if (!ids) return [];
    return Array.from(ids).map(id => this.get(id)!).filter(Boolean);
  }

  getByDomain(namespace: string, domain: string): StateModuleMetadata[] {
    const key = `${namespace}/${domain}`;
    const ids = this.domainIndex.get(key);
    if (!ids) return [];
    return Array.from(ids).map(id => this.get(id)!).filter(Boolean);
  }

  getByFeature(namespace: string, domain: string, feature: string): StateModuleMetadata | undefined {
    const domainModules = this.getByDomain(namespace, domain);
    return domainModules.find(m => m.feature === feature);
  }

  override register(id: string, item: StateModuleMetadata): void {
    super.register(id, item);

    // Update namespace index
    if (!this.namespaceIndex.has(item.namespace)) {
      this.namespaceIndex.set(item.namespace, new Set());
    }
    this.namespaceIndex.get(item.namespace)!.add(id);

    // Update domain index
    const domainKey = `${item.namespace}/${item.domain}`;
    if (!this.domainIndex.has(domainKey)) {
      this.domainIndex.set(domainKey, new Set());
    }
    this.domainIndex.get(domainKey)!.add(id);
  }

  override unregister(id: string): boolean {
    const item = this.get(id);
    if (item) {
      this.namespaceIndex.get(item.namespace)?.delete(id);
      this.domainIndex.get(`${item.namespace}/${item.domain}`)?.delete(id);
    }
    return super.unregister(id);
  }

  override clear(): void {
    super.clear();
    this.namespaceIndex.clear();
    this.domainIndex.clear();
  }
}

/** Singleton state registry */
export const stateRegistry = new StateRegistryImpl();
