/**
 * @file design/taxonomy/api/adapter/coldlight/coldlight.registry.ts
 * @layer taxonomy
 *
 * This registry is the SSOT for allowed enums.
 * Slots + states are explicit (no guessing later).
 */

import type { ColdLightPrimitiveKind, ColdLightPrimitiveRuntime } from './types.js';

export const coldlightRegistry = {
  // ============================================
  // BUTTONS & TOGGLES
  // ============================================
  button: {
    kind: 'button',
    slots: ['root', 'icon', 'label'] as const,
    states: ['idle', 'hover', 'pressed', 'disabled'] as const,
  },
  toggle: {
    kind: 'toggle',
    slots: ['root'] as const,
    states: ['on', 'off', 'disabled'] as const,
  },
  toggleGroup: {
    kind: 'toggleGroup',
    slots: ['root', 'item'] as const,
    states: ['idle', 'disabled'] as const,
  },
  switch: {
    kind: 'switch',
    slots: ['root', 'thumb'] as const,
    states: ['on', 'off', 'disabled'] as const,
  },

  // ============================================
  // INPUTS & FORMS
  // ============================================
  checkbox: {
    kind: 'checkbox',
    slots: ['root', 'indicator'] as const,
    states: ['checked', 'unchecked', 'indeterminate', 'disabled'] as const,
  },
  radioGroup: {
    kind: 'radioGroup',
    slots: ['root', 'item', 'indicator'] as const,
    states: ['checked', 'unchecked', 'disabled'] as const,
  },
  slider: {
    kind: 'slider',
    slots: ['root', 'track', 'range', 'thumb'] as const,
    states: ['idle', 'dragging', 'disabled'] as const,
  },
  label: {
    kind: 'label',
    slots: ['root'] as const,
    states: ['idle'] as const,
  },
  input: {
    kind: 'input',
    slots: ['root', 'label', 'control', 'help', 'error'] as const,
    states: ['idle', 'focus', 'invalid', 'disabled'] as const,
  },
  textarea: {
    kind: 'textarea',
    slots: ['root'] as const,
    states: ['idle', 'focus', 'invalid', 'disabled'] as const,
  },
  select: {
    kind: 'select',
    slots: ['root', 'trigger', 'value', 'content', 'viewport', 'item', 'label', 'separator'] as const,
    states: ['open', 'closed', 'disabled'] as const,
  },
  combobox: {
    kind: 'combobox',
    slots: ['root', 'input', 'trigger', 'content', 'item', 'empty'] as const,
    states: ['open', 'closed', 'disabled'] as const,
  },

  // ============================================
  // DATE & TIME
  // ============================================
  calendar: {
    kind: 'calendar',
    slots: ['root', 'header', 'heading', 'grid', 'cell', 'day'] as const,
    states: ['idle', 'disabled'] as const,
  },
  dateField: {
    kind: 'dateField',
    slots: ['root', 'label', 'input', 'segment'] as const,
    states: ['idle', 'focus', 'invalid', 'disabled'] as const,
  },
  datePicker: {
    kind: 'datePicker',
    slots: ['root', 'trigger', 'content', 'calendar'] as const,
    states: ['open', 'closed', 'disabled'] as const,
  },
  timeField: {
    kind: 'timeField',
    slots: ['root', 'label', 'input', 'segment'] as const,
    states: ['idle', 'focus', 'invalid', 'disabled'] as const,
  },

  // ============================================
  // DIALOGS & OVERLAYS
  // ============================================
  dialog: {
    kind: 'dialog',
    slots: ['root', 'trigger', 'portal', 'overlay', 'content', 'header', 'title', 'description', 'footer', 'close'] as const,
    states: ['open', 'closed'] as const,
  },
  alertDialog: {
    kind: 'alertDialog',
    slots: ['root', 'trigger', 'portal', 'overlay', 'content', 'header', 'title', 'description', 'footer', 'cancel', 'action'] as const,
    states: ['open', 'closed'] as const,
  },
  popover: {
    kind: 'popover',
    slots: ['root', 'trigger', 'content', 'arrow', 'close'] as const,
    states: ['open', 'closed'] as const,
  },
  hoverCard: {
    kind: 'hoverCard',
    slots: ['root', 'trigger', 'content', 'arrow'] as const,
    states: ['open', 'closed'] as const,
  },
  tooltip: {
    kind: 'tooltip',
    slots: ['root', 'trigger', 'content', 'arrow'] as const,
    states: ['open', 'closed'] as const,
  },
  contextMenu: {
    kind: 'contextMenu',
    slots: ['root', 'trigger', 'content', 'item', 'separator', 'sub', 'subTrigger', 'subContent'] as const,
    states: ['open', 'closed'] as const,
  },
  dropdownMenu: {
    kind: 'dropdownMenu',
    slots: ['root', 'trigger', 'content', 'item', 'separator', 'sub', 'subTrigger', 'subContent', 'checkboxItem', 'radioGroup', 'radioItem'] as const,
    states: ['open', 'closed'] as const,
  },

  // ============================================
  // NAVIGATION
  // ============================================
  tabs: {
    kind: 'tabs',
    slots: ['root', 'list', 'trigger', 'content'] as const,
    states: ['idle', 'active', 'disabled'] as const,
  },
  accordion: {
    kind: 'accordion',
    slots: ['root', 'item', 'trigger', 'content'] as const,
    states: ['open', 'closed', 'disabled'] as const,
  },
  collapsible: {
    kind: 'collapsible',
    slots: ['root', 'trigger', 'content'] as const,
    states: ['open', 'closed', 'disabled'] as const,
  },
  navigationMenu: {
    kind: 'navigationMenu',
    slots: ['root', 'list', 'item', 'trigger', 'content', 'link', 'indicator', 'viewport'] as const,
    states: ['idle'] as const,
  },
  menubar: {
    kind: 'menubar',
    slots: ['root', 'menu', 'trigger', 'content', 'item', 'separator', 'sub', 'subTrigger', 'subContent'] as const,
    states: ['open', 'closed'] as const,
  },
  pagination: {
    kind: 'pagination',
    slots: ['root', 'list', 'item', 'prev', 'next', 'ellipsis'] as const,
    states: ['idle', 'disabled'] as const,
  },
  breadcrumb: {
    kind: 'breadcrumb',
    slots: ['root', 'list', 'item', 'link', 'separator', 'page'] as const,
    states: ['idle'] as const,
  },

  // ============================================
  // LAYOUT & DISPLAY
  // ============================================
  aspectRatio: {
    kind: 'aspectRatio',
    slots: ['root'] as const,
    states: ['idle'] as const,
  },
  avatar: {
    kind: 'avatar',
    slots: ['root', 'image', 'fallback'] as const,
    states: ['loading', 'loaded', 'error'] as const,
  },
  separator: {
    kind: 'separator',
    slots: ['root'] as const,
    states: ['idle'] as const,
  },
  scrollArea: {
    kind: 'scrollArea',
    slots: ['root', 'viewport', 'scrollbar', 'thumb'] as const,
    states: ['idle', 'scrolling'] as const,
  },
  progress: {
    kind: 'progress',
    slots: ['root', 'indicator'] as const,
    states: ['loading', 'complete', 'error'] as const,
  },

  // ============================================
  // SEARCH & COMMANDS
  // ============================================
  command: {
    kind: 'command',
    slots: ['root', 'input', 'list', 'empty', 'group', 'item', 'separator'] as const,
    states: ['idle', 'loading'] as const,
  },

  // ============================================
  // FEEDBACK
  // ============================================
  toast: {
    kind: 'toast',
    slots: ['root', 'title', 'description', 'action', 'close'] as const,
    states: ['idle', 'success', 'error', 'warning', 'info'] as const,
  },
  alert: {
    kind: 'alert',
    slots: ['root', 'title', 'description'] as const,
    states: ['idle', 'success', 'error', 'warning', 'info'] as const,
  },
  badge: {
    kind: 'badge',
    slots: ['root'] as const,
    states: ['idle'] as const,
  },
  skeleton: {
    kind: 'skeleton',
    slots: ['root'] as const,
    states: ['loading'] as const,
  },
  spinner: {
    kind: 'spinner',
    slots: ['root'] as const,
    states: ['spinning'] as const,
  },

  // ============================================
  // UTILITIES
  // ============================================
  portal: {
    kind: 'portal',
    slots: ['root'] as const,
    states: ['idle'] as const,
  },
  presence: {
    kind: 'presence',
    slots: ['root'] as const,
    states: ['present', 'hidden'] as const,
  },
  focusTrap: {
    kind: 'focusTrap',
    slots: ['root'] as const,
    states: ['active', 'inactive'] as const,
  },
  visuallyHidden: {
    kind: 'visuallyHidden',
    slots: ['root'] as const,
    states: ['idle'] as const,
  },
  liveStatus: {
    kind: 'liveStatus',
    slots: ['root'] as const,
    states: ['idle'] as const,
  },
  kbd: {
    kind: 'kbd',
    slots: ['root'] as const,
    states: ['idle'] as const,
  },

  // ============================================
  // DATA DISPLAY
  // ============================================
  dataTable: {
    kind: 'dataTable',
    slots: ['root', 'header', 'body', 'row', 'cell', 'headerCell'] as const,
    states: ['idle', 'loading', 'empty'] as const,
  },
  chart: {
    kind: 'chart',
    slots: ['root', 'canvas', 'legend', 'tooltip'] as const,
    states: ['idle', 'loading', 'empty'] as const,
  },
} as const satisfies Record<ColdLightPrimitiveKind, ColdLightPrimitiveRuntime<ColdLightPrimitiveKind>>;

// ============================================
// DERIVED TYPES
// ============================================

/** Extract slots for a specific primitive kind */
export type ColdLightSlots<K extends ColdLightPrimitiveKind> =
  (typeof coldlightRegistry)[K]['slots'][number];

/** Extract states for a specific primitive kind */
export type ColdLightStates<K extends ColdLightPrimitiveKind> =
  (typeof coldlightRegistry)[K]['states'][number];
