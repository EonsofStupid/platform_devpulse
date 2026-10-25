/**
 * @file sys/registries/routing/routes.registry.ts
 * @module @devpulse/sys/registries/routing
 * @description Routes registry for typed route lookup
 */

import type { RouteMetadata, RoutesInventory, RoutesRegistry as IRoutesRegistry } from '../../contracts/index.js';
import { BaseRegistry } from '../base.registry.js';

/**
 * Routes registry implementation
 * Populated by route generator, used by route() helper
 */
class RoutesRegistryImpl extends BaseRegistry<RouteMetadata> implements IRoutesRegistry {
  private inventory: RoutesInventory | null = null;
  private pathIndex = new Map<string, string>(); // path -> id

  getByPath(path: string): RouteMetadata | undefined {
    const id = this.pathIndex.get(path);
    return id ? this.get(id) : undefined;
  }

  getByGroup(group: string): RouteMetadata[] {
    return Array.from(this.items.values()).filter(r => r.group === group);
  }

  getByHub(hub: string): RouteMetadata[] {
    // Hub is derived from first path segment after group
    return Array.from(this.items.values()).filter(r => {
      const pathParts = r.path.split('/').filter(Boolean);
      return pathParts[0] === hub;
    });
  }

  getInventory(): RoutesInventory {
    if (!this.inventory) {
      throw new Error('Routes inventory not loaded. Run route generator first.');
    }
    return this.inventory;
  }

  setInventory(inventory: RoutesInventory): void {
    this.inventory = inventory;
  }

  resolve(path: string, params?: Record<string, string | number>): string {
    if (!params) return path;

    let resolved = path;
    for (const [key, value] of Object.entries(params)) {
      // Handle [param] syntax
      resolved = resolved.replace(`[${key}]`, String(value));
      // Handle [...rest] syntax
      resolved = resolved.replace(`[...${key}]`, String(value));
      // Handle [[optional]] syntax
      resolved = resolved.replace(`[[${key}]]`, String(value));
    }
    return resolved;
  }

  override register(id: string, item: RouteMetadata): void {
    super.register(id, item);
    this.pathIndex.set(item.path, id);
  }

  override unregister(id: string): boolean {
    const item = this.get(id);
    if (item) {
      this.pathIndex.delete(item.path);
    }
    return super.unregister(id);
  }

  override clear(): void {
    super.clear();
    this.pathIndex.clear();
    this.inventory = null;
  }
}

/** Singleton routes registry */
export const routesRegistry = new RoutesRegistryImpl();
