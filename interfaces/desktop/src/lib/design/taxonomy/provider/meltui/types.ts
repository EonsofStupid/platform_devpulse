/**
 * @file taxonomy/provider/types.ts
 * @layer taxonomy
 *
 * Provider port contract — ENFORCEMENT TYPES.
 * Any ARIA provider must implement this contract.
 */

import type { Action } from 'svelte/action';
import type { Readable, Writable } from 'svelte/store';
import type { PrimitiveKind } from '../primitiveKinds.js';

// ============================================
// PROVIDER IDENTITY
// ============================================

export type ProviderId = 'melt-ui' | 'ark-ui' | 'custom';

export interface ProviderInfo {
  readonly id: ProviderId;
  readonly name: string;
  readonly version: string;
}

// ============================================
// BUILDER CAPABILITIES (ENFORCEMENT)
// ============================================

export interface BuilderCapabilities {
  /** Handles ARIA via action */
  readonly aria: boolean;
  /** Handles focus management */
  readonly focus: boolean;
  /** Handles keyboard navigation */
  readonly keyboard: boolean;
  /** Handles click outside */
  readonly clickOutside: boolean;
  /** Handles escape key */
  readonly escape: boolean;
  /** Handles scroll lock */
  readonly scrollLock: boolean;
  /** Handles floating positioning */
  readonly floating: boolean;
  /** Handles portal rendering */
  readonly portal: boolean;
  /** Handles typeahead */
  readonly typeahead: boolean;
}

// ============================================
// BUILDER MAPPING (ENFORCEMENT)
// ============================================

/**
 * Maps PrimitiveKind to Melt UI builder name.
 * THIS IS THE SOURCE OF TRUTH.
 */
export const BUILDER_MAP: Partial<Record<PrimitiveKind, string>> = {
  // Buttons & Toggles
  toggle: 'createToggle',
  toggleGroup: 'createToggleGroup',
  switch: 'createSwitch',

  // Inputs & Forms
  checkbox: 'createCheckbox',
  radioGroup: 'createRadioGroup',
  slider: 'createSlider',
  label: 'createLabel',
  select: 'createSelect',
  combobox: 'createCombobox',

  // Date & Time
  calendar: 'createCalendar',
  dateField: 'createDateField',
  datePicker: 'createDatePicker',

  // Dialogs & Overlays
  dialog: 'createDialog',
  alertDialog: 'createDialog', // same builder, role=alertdialog
  popover: 'createPopover',
  hoverCard: 'createLinkPreview',
  tooltip: 'createTooltip',
  contextMenu: 'createContextMenu',
  dropdownMenu: 'createDropdownMenu',

  // Navigation
  tabs: 'createTabs',
  accordion: 'createAccordion',
  collapsible: 'createCollapsible',
  menubar: 'createMenubar',
  pagination: 'createPagination',

  // Layout & Display
  avatar: 'createAvatar',
  separator: 'createSeparator',
  scrollArea: 'createScrollArea',
  progress: 'createProgress',

  // Feedback
  toast: 'createToaster',
} as const;

/**
 * Get the Melt builder name for a primitive kind.
 * Returns undefined for custom primitives.
 */
export function getBuilderName(kind: PrimitiveKind): string | undefined {
  return BUILDER_MAP[kind];
}

/**
 * Check if a kind uses Melt UI.
 */
export function isMeltPrimitive(kind: PrimitiveKind): boolean {
  return kind in BUILDER_MAP;
}

// ============================================
// PROVIDER CONTRACT
// ============================================

export interface ProviderContract {
  readonly info: ProviderInfo;
  readonly capabilities: BuilderCapabilities;
  readonly actionName: string;
  readonly importPath: string;
}
