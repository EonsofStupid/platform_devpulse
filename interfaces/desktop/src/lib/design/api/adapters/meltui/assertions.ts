/**
 * @file design/api/adapters/meltui/assertions.ts
 * @layer internal
 *
 * RUNTIME ENFORCEMENT.
 * These functions throw if patterns are violated.
 */

import { isPrimitiveKind, type PrimitiveKind } from '$lib/design/taxonomy/kind/primitives/primitiveKind.js';
import { isValidSlot, getPrimitiveSlots } from '$lib/design/taxonomy/primitiveRegistry.js';
import { isMeltPrimitive, getBuilderName } from '$lib/design/taxonomy/provider/types.js';

// Check if we're in development mode
const isDev = import.meta.env?.DEV ?? process.env.NODE_ENV !== 'production';

// ============================================
// ASSERTION FUNCTIONS
// ============================================

/**
 * Assert that a kind is registered in taxonomy.
 * Throws in development if not registered.
 */
export function assertKindRegistered(kind: string, component: string): asserts kind is PrimitiveKind {
  if (!isPrimitiveKind(kind)) {
    const msg = `[ColdLight] Invalid kind "${kind}" in ${component}. ` +
      `Register in taxonomy/primitiveKinds.ts first.`;
    if (isDev) throw new Error(msg);
    console.error(msg);
  }
}

/**
 * Assert that a slot is valid for the kind.
 * Throws in development if not registered.
 */
export function assertSlotValid(kind: PrimitiveKind, slot: string, component: string): void {
  if (!isValidSlot(kind, slot)) {
    const validSlots = getPrimitiveSlots(kind);
    const msg = `[ColdLight] Invalid slot "${slot}" for kind "${kind}" in ${component}. ` +
      `Valid slots: ${validSlots.join(', ')}`;
    if (isDev) throw new Error(msg);
    console.error(msg);
  }
}

/**
 * Assert that a Melt primitive has a builder.
 * Throws in development if builder not mapped.
 */
export function assertBuilderExists(kind: PrimitiveKind, component: string): void {
  if (isMeltPrimitive(kind) && !getBuilderName(kind)) {
    const msg = `[ColdLight] Kind "${kind}" is marked as Melt primitive but has no builder in BUILDER_MAP. ` +
      `Add mapping in taxonomy/provider/types.ts.`;
    if (isDev) throw new Error(msg);
    console.error(msg);
  }
}

/**
 * Assert that data-kind attribute exists on element.
 * For use in tests.
 */
export function assertDataKind(element: Element | null, expectedKind: string): void {
  if (!element) {
    throw new Error(`[ColdLight Test] Element is null`);
  }
  const kind = element.getAttribute('data-kind');
  if (kind !== expectedKind) {
    throw new Error(`[ColdLight Test] Expected data-kind="${expectedKind}", got "${kind}"`);
  }
}

/**
 * Assert that data-slot attribute exists on element.
 * For use in tests.
 */
export function assertDataSlot(element: Element | null, expectedSlot: string): void {
  if (!element) {
    throw new Error(`[ColdLight Test] Element is null`);
  }
  const slot = element.getAttribute('data-slot');
  if (slot !== expectedSlot) {
    throw new Error(`[ColdLight Test] Expected data-slot="${expectedSlot}", got "${slot}"`);
  }
}

/**
 * Assert that data-state attribute has expected value.
 * For use in tests.
 */
export function assertDataState(element: Element | null, expectedState: string): void {
  if (!element) {
    throw new Error(`[ColdLight Test] Element is null`);
  }
  const state = element.getAttribute('data-state');
  if (state !== expectedState) {
    throw new Error(`[ColdLight Test] Expected data-state="${expectedState}", got "${state}"`);
  }
}
