/**
 * @file design/api/adapters/meltui/state.ts
 * @layer internal
 *
 * State extraction for ColdLight data-state attributes.
 * These functions convert Melt state to data-state strings.
 */

// ============================================
// STATE TYPES
// ============================================

export type OpenState = 'open' | 'closed';
export type CheckedState = 'checked' | 'unchecked' | 'indeterminate';
export type ActiveState = 'active' | 'inactive';
export type OnOffState = 'on' | 'off';
export type ProgressState = 'loading' | 'complete' | 'error';

// ============================================
// EXTRACTORS
// ============================================

export function extractOpenState(open: boolean): OpenState {
  return open ? 'open' : 'closed';
}

export function extractCheckedState(checked: boolean | 'indeterminate'): CheckedState {
  if (checked === 'indeterminate') return 'indeterminate';
  return checked ? 'checked' : 'unchecked';
}

export function extractActiveState(active: boolean): ActiveState {
  return active ? 'active' : 'inactive';
}

export function extractOnOffState(on: boolean): OnOffState {
  return on ? 'on' : 'off';
}

export function extractProgressState(value: number, max: number, hasError = false): ProgressState {
  if (hasError) return 'error';
  return value >= max ? 'complete' : 'loading';
}

// ============================================
// PRESENCE EXTRACTORS (for data-* presence attributes)
// ============================================

export function extractPresence(value: boolean): '' | undefined {
  return value ? '' : undefined;
}

export const extractSelected = extractPresence;
export const extractHighlighted = extractPresence;
export const extractDisabled = extractPresence;
