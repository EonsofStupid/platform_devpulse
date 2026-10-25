/**
 * @file sys/contracts/state/state.contract.ts
 * @module @devpulse/sys/contracts/state
 * @description State module contracts for domain state management
 */

import type { Registry } from '../core/registry.contract.js';

/** State module metadata for registry */
export interface StateModuleMetadata {
  /** Module identifier e.g. 'devpulse.dashboard' */
  id: string;
  /** Namespace e.g. 'app' */
  namespace: string;
  /** Domain e.g. 'devpulse' */
  domain: string;
  /** Feature path within domain (optional) */
  feature?: string;
  /** File path relative to src/ */
  path: string;
  /** Exported state class/object name */
  exportName: string;
  /** State properties exposed */
  properties: StatePropertyDef[];
  /** Actions/methods exposed */
  actions: StateActionDef[];
}

/** State property definition */
export interface StatePropertyDef {
  name: string;
  type: string; // TypeScript type as string
  reactive: boolean; // Uses $state()
  derived: boolean; // Uses $derived()
  readonly: boolean;
}

/** State action definition */
export interface StateActionDef {
  name: string;
  params: Array<{ name: string; type: string }>;
  returnType: string;
  async: boolean;
}

/** State module contract - what a *.state.svelte.ts must export */
export interface StateModuleContract<T = unknown> {
  /** The singleton state instance */
  readonly state: T;
  /** Reset state to initial values */
  reset?(): void;
  /** Serialize state for persistence */
  serialize?(): string;
  /** Hydrate state from serialized data */
  hydrate?(data: string): void;
}

/** Domain state namespace pattern */
export type DomainStatePath = `domains/${string}/${string}/state/${string}.state.svelte.ts`;

/** State registry contract */
export interface StateRegistry extends Registry<StateModuleMetadata> {
  /** Get state modules by namespace */
  getByNamespace(namespace: string): StateModuleMetadata[];
  /** Get state modules by domain */
  getByDomain(namespace: string, domain: string): StateModuleMetadata[];
  /** Get state module by feature path */
  getByFeature(namespace: string, domain: string, feature: string): StateModuleMetadata | undefined;
}
