/**
 * @file sys/contracts/routing/domain.contract.ts
 * @module @devpulse/sys/contracts/routing
 * @description Domain metadata contracts for dynamic routing
 */

import type { Registry } from '../core/registry.contract.js';

/** Domain status for navigation */
export type DomainStatus = 'active' | 'coming-soon' | 'hidden';

/** Domain metadata for registry */
export interface DomainMetadata {
  /** Domain identifier (e.g., "devpulse") */
  id: string;
  /** Human-readable label */
  label: string;
  /** Icon identifier (emoji or icon name) */
  icon: string;
  /** Domain status */
  status: DomainStatus;
  /** Import path for main page component */
  pageModule: string;
  /** Default feature to show */
  defaultFeature?: string;
  /** Order in navigation (lower = first) */
  order: number;
}

/** Domain registry interface */
export interface DomainRegistry extends Registry<DomainMetadata> {
  /** Get all active domains sorted by order */
  getActive(): DomainMetadata[];
  /** Get domains by status */
  getByStatus(status: DomainStatus): DomainMetadata[];
  /** Get all visible domains (active + coming-soon) */
  getVisible(): DomainMetadata[];
}
