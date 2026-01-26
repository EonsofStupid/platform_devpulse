/**
 * @file design/taxonomy/api/adapter/coldlight/types.ts
 * @layer taxonomy
 *
 * ColdLight "kinds" are the stable discriminants.
 * These are the ONLY identities primitives/recipes/etc can reference.
 */

// ============================================
// PRIMITIVE KINDS (SSOT)
// ============================================

export const coldlightPrimitiveKinds = [
  'button',
  'toggle',
  'toggleGroup',
  'switch',
  'checkbox',
  'radioGroup',
  'slider',
  'label',
  'input',
  'textarea',
  'select',
  'combobox',
  'calendar',
  'dateField',
  'datePicker',
  'timeField',
  'dialog',
  'alertDialog',
  'popover',
  'hoverCard',
  'tooltip',
  'contextMenu',
  'dropdownMenu',
  'tabs',
  'accordion',
  'collapsible',
  'navigationMenu',
  'menubar',
  'pagination',
  'breadcrumb',
  'aspectRatio',
  'avatar',
  'separator',
  'scrollArea',
  'progress',
  'command',
  'toast',
  'alert',
  'badge',
  'skeleton',
  'spinner',
  'portal',
  'presence',
  'focusTrap',
  'visuallyHidden',
  'liveStatus',
  'kbd',
  'dataTable',
  'chart',
] as const;

export type ColdLightPrimitiveKind = (typeof coldlightPrimitiveKinds)[number];

// ============================================
// DATA ATTRIBUTES
// ============================================

export type ColdLightDataAttrs = {
  'data-kind': ColdLightPrimitiveKind;
  'data-slot': string;
  'data-state'?: string;
};

// ============================================
// RUNTIME SHAPE
// ============================================

/**
 * Contract shape that every adapter must output.
 * This is the stable runtime "shape" primitives depend on.
 */
export type ColdLightPrimitiveRuntime<K extends ColdLightPrimitiveKind> = {
  kind: K;
  slots: readonly string[];
  states: readonly string[];
};
