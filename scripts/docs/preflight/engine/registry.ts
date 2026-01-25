/**
 * @file preflight/engine/registry.ts
 * @description Check and fixer registry - central registration point
 */

import type { Check, Fixer } from '../types.js';

class CheckRegistry {
  private checks = new Map<string, Check>();
  private fixers = new Map<string, Fixer>();

  registerCheck(check: Check): void {
    if (this.checks.has(check.id)) {
      throw new Error(`Check "${check.id}" is already registered`);
    }
    this.checks.set(check.id, check);
  }

  registerFixer(fixer: Fixer): void {
    if (this.fixers.has(fixer.id)) {
      throw new Error(`Fixer "${fixer.id}" is already registered`);
    }
    this.fixers.set(fixer.id, fixer);
  }

  getCheck(id: string): Check | undefined {
    return this.checks.get(id);
  }

  getFixer(id: string): Fixer | undefined {
    return this.fixers.get(id);
  }

  getAllChecks(): Check[] {
    return Array.from(this.checks.values());
  }

  getAllFixers(): Fixer[] {
    return Array.from(this.fixers.values());
  }

  getCheckIds(): string[] {
    return Array.from(this.checks.keys());
  }

  getFixerIds(): string[] {
    return Array.from(this.fixers.keys());
  }

  /** Find fixers that can handle a specific check result */
  findFixersFor(checkId: string): Fixer[] {
    return this.getAllFixers().filter(fixer => {
      // Convention: fixer id starts with "fix." and maps to check id
      // e.g., "fix.naming" can fix "naming-conventions" check
      const fixerCheckId = fixer.id.replace('fix.', '').replace(/-/g, '');
      const normalizedCheckId = checkId.replace(/-/g, '');
      return normalizedCheckId.includes(fixerCheckId) || fixerCheckId.includes(normalizedCheckId);
    });
  }
}

// Singleton registry
export const registry = new CheckRegistry();

// Re-export for convenience
export { CheckRegistry };
