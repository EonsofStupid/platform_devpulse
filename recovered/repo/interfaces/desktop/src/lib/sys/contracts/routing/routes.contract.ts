/**
 * @file sys/contracts/routing/routes.contract.ts
 * @module @devpulse/sys/contracts/routing
 * @description Route type contracts for typed route generation
 */

import type { Registry } from '../core/registry.contract.js';

/** Route parameter types */
export type RouteParamType = 'string' | 'number' | 'boolean';

/** Single route parameter definition */
export interface RouteParam {
  name: string;
  type: RouteParamType;
  optional: boolean;
  rest: boolean; // [...rest] params
}

/** Search parameter definition with defaults */
export interface SearchParamDef {
  type: RouteParamType;
  default?: string | number | boolean;
  required?: boolean;
}

/** Form action definition */
export interface FormActionDef {
  name: string;
  params?: Record<string, RouteParamType>;
}

/** Complete route metadata */
export interface RouteMetadata {
  /** Route path pattern e.g. '/devpulse/settings' */
  path: string;
  /** Route group e.g. '(app)' */
  group: string | null;
  /** Path parameters e.g. [id], [...rest] */
  params: RouteParam[];
  /** Search parameters with types and defaults */
  searchParams: Record<string, SearchParamDef>;
  /** Form actions from +page.server.ts */
  actions: FormActionDef[];
  /** Has +page.ts load function */
  hasLoad: boolean;
  /** Has +page.server.ts */
  hasServerLoad: boolean;
  /** Has +layout.ts */
  hasLayout: boolean;
}

/** Hub metadata for navigation grouping */
export interface HubMetadata {
  label: string;
  description: string;
  icon?: string;
}

/** Route inventory item for navigation */
export interface RouteInventoryItem {
  path: string;
  label: string;
  isIndex?: boolean;
  icon?: string;
  description?: string;
}

/** Route group in inventory */
export interface RouteGroupInventory {
  label: string;
  hubs?: Record<string, {
    label: string;
    description: string;
    icon?: string;
    routes: RouteInventoryItem[];
  }>;
  routes?: RouteInventoryItem[];
}

/** Complete routes inventory structure */
export interface RoutesInventory {
  groups: Record<string, RouteGroupInventory>;
  meta: {
    generated: string;
    routeCount: number;
    version: string;
  };
}

/** Route function overload types (for codegen) */
export type RouteFunction = {
  // Static routes
  (path: string): string;
  // Routes with path params
  (path: string, params: Record<string, string | number>): string;
  // Form actions
  (action: `${string} ${string}`, params?: Record<string, string | number>): string;
};

/** Routes registry contract */
export interface RoutesRegistry extends Registry<RouteMetadata> {
  /** Get route by path pattern */
  getByPath(path: string): RouteMetadata | undefined;
  /** Get routes by group */
  getByGroup(group: string): RouteMetadata[];
  /** Get routes for a hub */
  getByHub(hub: string): RouteMetadata[];
  /** Get the full inventory */
  getInventory(): RoutesInventory;
  /** Resolve a route with params */
  resolve(path: string, params?: Record<string, string | number>): string;
}
