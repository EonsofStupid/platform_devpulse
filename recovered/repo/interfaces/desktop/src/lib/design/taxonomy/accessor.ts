/**
 * @file Contract Accessor
 * @description Runtime access to primitive contracts with caching.
 *
 * Contracts are static — they don't change at runtime. This module provides:
 * - Lazy loading of contracts via dynamic import
 * - Caching to avoid repeated imports
 * - Synchronous access for preloaded contracts
 * - Bulk preloading for app initialization
 *
 * Usage:
 *   // Async (lazy load)
 *   const contract = await getContract("button");
 *
 *   // Sync (must be preloaded)
 *   const contract = getContractSync("button");
 *
 *   // Preload all at app start
 *   await preloadContracts();
 */

import type { PrimitiveContract } from "./types";

/**
 * All primitive kinds with taxonomy contracts.
 * Derived from filesystem scan.
 */
export const PRIMITIVE_KINDS = [
	"accordion",
	"alert",
	"alert-dialog",
	"avatar",
	"badge",
	"breadcrumb",
	"button",
	"card",
	"checkbox",
	"collapsible",
	"combobox",
	"command",
	"context-menu",
	"dialog",
	"dropdown-menu",
	"hover-card",
	"input",
	"label",
	"menubar",
	"navigation-menu",
	"pagination",
	"pin-input",
	"popover",
	"progress",
	"radio-group",
	"scroll-area",
	"select",
	"separator",
	"sheet",
	"skeleton",
	"slider",
	"spinner",
	"switch",
	"tabs",
	"textarea",
	"toggle",
	"toggle-group",
	"toolbar",
	"tooltip",
	"visually-hidden",
] as const;

export type PrimitiveKind = (typeof PRIMITIVE_KINDS)[number];

/**
 * Contract cache - Map from kind to contract.
 */
const contractCache = new Map<string, PrimitiveContract>();

/**
 * Get a contract asynchronously (lazy loads if not cached).
 *
 * @param kind - The primitive kind
 * @returns The primitive contract
 * @throws If no contract exists for the kind
 */
export async function getContract(kind: string): Promise<PrimitiveContract> {
	// Return cached if available
	const cached = contractCache.get(kind);
	if (cached) {
		return cached;
	}

	// Dynamic import
	try {
		const module = await import(`./kinds/primitives/${kind}/contract`);
		const contract = module.contract as PrimitiveContract;

		// Validate it's the right kind
		if (contract.kind !== kind) {
			throw new Error(`Contract mismatch: expected kind "${kind}", got "${contract.kind}"`);
		}

		// Cache and return
		contractCache.set(kind, contract);
		return contract;
	} catch (e) {
		throw new Error(`No contract found for primitive kind "${kind}": ${e}`);
	}
}

/**
 * Get a contract synchronously (must be preloaded).
 *
 * @param kind - The primitive kind
 * @returns The contract, or undefined if not preloaded
 */
export function getContractSync(kind: string): PrimitiveContract | undefined {
	return contractCache.get(kind);
}

/**
 * Check if a contract is loaded.
 *
 * @param kind - The primitive kind
 * @returns True if contract is in cache
 */
export function hasContract(kind: string): boolean {
	return contractCache.has(kind);
}

/**
 * Get all loaded contracts.
 *
 * @returns Array of loaded contracts
 */
export function getLoadedContracts(): PrimitiveContract[] {
	return Array.from(contractCache.values());
}

/**
 * Preload all primitive contracts.
 *
 * Call this at app initialization to enable synchronous access.
 * Uses parallel loading for performance.
 *
 * @returns Promise that resolves when all contracts are loaded
 */
export async function preloadContracts(): Promise<void> {
	await Promise.all(PRIMITIVE_KINDS.map(getContract));
}

/**
 * Clear the contract cache (for testing).
 */
export function clearContractCache(): void {
	contractCache.clear();
}

/**
 * Get contract by kind with type narrowing.
 *
 * @param kind - The primitive kind
 * @returns Contract if loaded, throws if not
 */
export function requireContract(kind: string): PrimitiveContract {
	const contract = getContractSync(kind);
	if (!contract) {
		throw new Error(`Contract for "${kind}" not loaded. Call preloadContracts() first.`);
	}
	return contract;
}
