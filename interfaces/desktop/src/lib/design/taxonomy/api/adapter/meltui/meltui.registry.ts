/**
 * @file design/taxonomy/api/adapter/meltui/meltui.registry.ts
 * @layer taxonomy
 *
 * This registry is the SSOT for mapping MeltUI → ColdLight.
 * No primitives get written until this exists.
 */

import type { MeltUIAdapterRegistry } from './types.js';

const INTERNAL_PATH = '$lib/design/api/adapters/meltui/_internal';

export const meltuiRegistry: MeltUIAdapterRegistry = {
  // ============================================
  // BUTTONS & TOGGLES
  // ============================================
  button: {
    kind: 'button',
    internalImpl: `${INTERNAL_PATH}/button.internal.ts`,
    stateMap: { disabled: 'disabled', pressed: 'pressed', hover: 'hover', idle: 'idle' },
    slotMap: { root: 'root', icon: 'icon', label: 'label' },
  },
  toggle: {
    kind: 'toggle',
    internalImpl: `${INTERNAL_PATH}/toggle.internal.ts`,
    stateMap: { pressed: 'on', '': 'off', disabled: 'disabled' },
    slotMap: { root: 'root' },
  },
  toggleGroup: {
    kind: 'toggleGroup',
    internalImpl: `${INTERNAL_PATH}/toggleGroup.internal.ts`,
    stateMap: { disabled: 'disabled', '': 'idle' },
    slotMap: { root: 'root', item: 'item' },
  },
  switch: {
    kind: 'switch',
    internalImpl: `${INTERNAL_PATH}/switch.internal.ts`,
    stateMap: { checked: 'on', unchecked: 'off', disabled: 'disabled' },
    slotMap: { root: 'root', thumb: 'thumb' },
  },

  // ============================================
  // INPUTS & FORMS
  // ============================================
  checkbox: {
    kind: 'checkbox',
    internalImpl: `${INTERNAL_PATH}/checkbox.internal.ts`,
    stateMap: { checked: 'checked', unchecked: 'unchecked', indeterminate: 'indeterminate', disabled: 'disabled' },
    slotMap: { root: 'root', indicator: 'indicator' },
  },
  radioGroup: {
    kind: 'radioGroup',
    internalImpl: `${INTERNAL_PATH}/radioGroup.internal.ts`,
    stateMap: { checked: 'checked', unchecked: 'unchecked', disabled: 'disabled' },
    slotMap: { root: 'root', item: 'item', indicator: 'indicator' },
  },
  slider: {
    kind: 'slider',
    internalImpl: `${INTERNAL_PATH}/slider.internal.ts`,
    stateMap: { '': 'idle', disabled: 'disabled' },
    slotMap: { root: 'root', track: 'track', range: 'range', thumb: 'thumb' },
  },
  label: {
    kind: 'label',
    internalImpl: `${INTERNAL_PATH}/label.internal.ts`,
    stateMap: { '': 'idle' },
    slotMap: { root: 'root' },
  },
  input: {
    kind: 'input',
    internalImpl: `${INTERNAL_PATH}/input.internal.ts`,
    stateMap: { focus: 'focus', invalid: 'invalid', disabled: 'disabled', '': 'idle' },
    slotMap: { root: 'root', label: 'label', input: 'control', help: 'help', error: 'error' },
  },
  textarea: {
    kind: 'textarea',
    internalImpl: `${INTERNAL_PATH}/textarea.internal.ts`,
    stateMap: { focus: 'focus', invalid: 'invalid', disabled: 'disabled', '': 'idle' },
    slotMap: { root: 'root' },
  },
  select: {
    kind: 'select',
    internalImpl: `${INTERNAL_PATH}/select.internal.ts`,
    stateMap: { open: 'open', closed: 'closed', disabled: 'disabled' },
    slotMap: { root: 'root', trigger: 'trigger', value: 'value', content: 'content', viewport: 'viewport', item: 'item', label: 'label', separator: 'separator' },
  },
  combobox: {
    kind: 'combobox',
    internalImpl: `${INTERNAL_PATH}/combobox.internal.ts`,
    stateMap: { open: 'open', closed: 'closed', disabled: 'disabled' },
    slotMap: { root: 'root', input: 'input', trigger: 'trigger', content: 'content', item: 'item', empty: 'empty' },
  },

  // ============================================
  // DATE & TIME
  // ============================================
  calendar: {
    kind: 'calendar',
    internalImpl: `${INTERNAL_PATH}/calendar.internal.ts`,
    stateMap: { disabled: 'disabled', '': 'idle' },
    slotMap: { root: 'root', header: 'header', heading: 'heading', grid: 'grid', cell: 'cell', day: 'day' },
  },
  dateField: {
    kind: 'dateField',
    internalImpl: `${INTERNAL_PATH}/dateField.internal.ts`,
    stateMap: { focus: 'focus', invalid: 'invalid', disabled: 'disabled', '': 'idle' },
    slotMap: { root: 'root', label: 'label', input: 'input', segment: 'segment' },
  },
  datePicker: {
    kind: 'datePicker',
    internalImpl: `${INTERNAL_PATH}/datePicker.internal.ts`,
    stateMap: { open: 'open', closed: 'closed', disabled: 'disabled' },
    slotMap: { root: 'root', trigger: 'trigger', content: 'content', calendar: 'calendar' },
  },
  timeField: {
    kind: 'timeField',
    internalImpl: `${INTERNAL_PATH}/timeField.internal.ts`,
    stateMap: { focus: 'focus', invalid: 'invalid', disabled: 'disabled', '': 'idle' },
    slotMap: { root: 'root', label: 'label', input: 'input', segment: 'segment' },
  },

  // ============================================
  // DIALOGS & OVERLAYS
  // ============================================
  dialog: {
    kind: 'dialog',
    internalImpl: `${INTERNAL_PATH}/dialog.internal.ts`,
    stateMap: { open: 'open', closed: 'closed' },
    slotMap: { root: 'root', trigger: 'trigger', portal: 'portal', overlay: 'overlay', content: 'content', header: 'header', title: 'title', description: 'description', footer: 'footer', close: 'close' },
  },
  alertDialog: {
    kind: 'alertDialog',
    internalImpl: `${INTERNAL_PATH}/alertDialog.internal.ts`,
    stateMap: { open: 'open', closed: 'closed' },
    slotMap: { root: 'root', trigger: 'trigger', portal: 'portal', overlay: 'overlay', content: 'content', header: 'header', title: 'title', description: 'description', footer: 'footer', cancel: 'cancel', action: 'action' },
  },
  popover: {
    kind: 'popover',
    internalImpl: `${INTERNAL_PATH}/popover.internal.ts`,
    stateMap: { open: 'open', closed: 'closed' },
    slotMap: { root: 'root', trigger: 'trigger', content: 'content', arrow: 'arrow', close: 'close' },
  },
  hoverCard: {
    kind: 'hoverCard',
    internalImpl: `${INTERNAL_PATH}/hoverCard.internal.ts`,
    stateMap: { open: 'open', closed: 'closed' },
    slotMap: { root: 'root', trigger: 'trigger', content: 'content', arrow: 'arrow' },
  },
  tooltip: {
    kind: 'tooltip',
    internalImpl: `${INTERNAL_PATH}/tooltip.internal.ts`,
    stateMap: { open: 'open', closed: 'closed' },
    slotMap: { root: 'root', trigger: 'trigger', content: 'content', arrow: 'arrow' },
  },
  contextMenu: {
    kind: 'contextMenu',
    internalImpl: `${INTERNAL_PATH}/contextMenu.internal.ts`,
    stateMap: { open: 'open', closed: 'closed' },
    slotMap: { root: 'root', trigger: 'trigger', content: 'content', item: 'item', separator: 'separator', sub: 'sub', subTrigger: 'subTrigger', subContent: 'subContent' },
  },
  dropdownMenu: {
    kind: 'dropdownMenu',
    internalImpl: `${INTERNAL_PATH}/dropdownMenu.internal.ts`,
    stateMap: { open: 'open', closed: 'closed' },
    slotMap: { root: 'root', trigger: 'trigger', content: 'content', item: 'item', separator: 'separator', sub: 'sub', subTrigger: 'subTrigger', subContent: 'subContent', checkboxItem: 'checkboxItem', radioGroup: 'radioGroup', radioItem: 'radioItem' },
  },

  // ============================================
  // NAVIGATION
  // ============================================
  tabs: {
    kind: 'tabs',
    internalImpl: `${INTERNAL_PATH}/tabs.internal.ts`,
    stateMap: { active: 'active', disabled: 'disabled', '': 'idle' },
    slotMap: { root: 'root', list: 'list', trigger: 'trigger', content: 'content' },
  },
  accordion: {
    kind: 'accordion',
    internalImpl: `${INTERNAL_PATH}/accordion.internal.ts`,
    stateMap: { open: 'open', closed: 'closed', disabled: 'disabled' },
    slotMap: { root: 'root', item: 'item', trigger: 'trigger', content: 'content' },
  },
  collapsible: {
    kind: 'collapsible',
    internalImpl: `${INTERNAL_PATH}/collapsible.internal.ts`,
    stateMap: { open: 'open', closed: 'closed', disabled: 'disabled' },
    slotMap: { root: 'root', trigger: 'trigger', content: 'content' },
  },
  navigationMenu: {
    kind: 'navigationMenu',
    internalImpl: `${INTERNAL_PATH}/navigationMenu.internal.ts`,
    stateMap: { '': 'idle' },
    slotMap: { root: 'root', list: 'list', item: 'item', trigger: 'trigger', content: 'content', link: 'link', indicator: 'indicator', viewport: 'viewport' },
  },
  menubar: {
    kind: 'menubar',
    internalImpl: `${INTERNAL_PATH}/menubar.internal.ts`,
    stateMap: { open: 'open', closed: 'closed' },
    slotMap: { root: 'root', menu: 'menu', trigger: 'trigger', content: 'content', item: 'item', separator: 'separator', sub: 'sub', subTrigger: 'subTrigger', subContent: 'subContent' },
  },
  pagination: {
    kind: 'pagination',
    internalImpl: `${INTERNAL_PATH}/pagination.internal.ts`,
    stateMap: { disabled: 'disabled', '': 'idle' },
    slotMap: { root: 'root', list: 'list', item: 'item', prev: 'prev', next: 'next', ellipsis: 'ellipsis' },
  },
  breadcrumb: {
    kind: 'breadcrumb',
    internalImpl: `${INTERNAL_PATH}/breadcrumb.internal.ts`,
    stateMap: { '': 'idle' },
    slotMap: { root: 'root', list: 'list', item: 'item', link: 'link', separator: 'separator', page: 'page' },
  },

  // ============================================
  // LAYOUT & DISPLAY
  // ============================================
  aspectRatio: {
    kind: 'aspectRatio',
    internalImpl: `${INTERNAL_PATH}/aspectRatio.internal.ts`,
    stateMap: { '': 'idle' },
    slotMap: { root: 'root' },
  },
  avatar: {
    kind: 'avatar',
    internalImpl: `${INTERNAL_PATH}/avatar.internal.ts`,
    stateMap: { loading: 'loading', loaded: 'loaded', error: 'error' },
    slotMap: { root: 'root', image: 'image', fallback: 'fallback' },
  },
  separator: {
    kind: 'separator',
    internalImpl: `${INTERNAL_PATH}/separator.internal.ts`,
    stateMap: { '': 'idle' },
    slotMap: { root: 'root' },
  },
  scrollArea: {
    kind: 'scrollArea',
    internalImpl: `${INTERNAL_PATH}/scrollArea.internal.ts`,
    stateMap: { scrolling: 'scrolling', '': 'idle' },
    slotMap: { root: 'root', viewport: 'viewport', scrollbar: 'scrollbar', thumb: 'thumb' },
  },
  progress: {
    kind: 'progress',
    internalImpl: `${INTERNAL_PATH}/progress.internal.ts`,
    stateMap: { loading: 'loading', complete: 'complete', error: 'error' },
    slotMap: { root: 'root', indicator: 'indicator' },
  },

  // ============================================
  // SEARCH & COMMANDS
  // ============================================
  command: {
    kind: 'command',
    internalImpl: `${INTERNAL_PATH}/command.internal.ts`,
    stateMap: { loading: 'loading', '': 'idle' },
    slotMap: { root: 'root', input: 'input', list: 'list', empty: 'empty', group: 'group', item: 'item', separator: 'separator' },
  },

  // ============================================
  // FEEDBACK
  // ============================================
  toast: {
    kind: 'toast',
    internalImpl: `${INTERNAL_PATH}/toast.internal.ts`,
    stateMap: { success: 'success', error: 'error', warning: 'warning', info: 'info', '': 'idle' },
    slotMap: { root: 'root', title: 'title', description: 'description', action: 'action', close: 'close' },
  },
  alert: {
    kind: 'alert',
    internalImpl: `${INTERNAL_PATH}/alert.internal.ts`,
    stateMap: { success: 'success', error: 'error', warning: 'warning', info: 'info', '': 'idle' },
    slotMap: { root: 'root', title: 'title', description: 'description' },
  },
  badge: {
    kind: 'badge',
    internalImpl: `${INTERNAL_PATH}/badge.internal.ts`,
    stateMap: { '': 'idle' },
    slotMap: { root: 'root' },
  },
  skeleton: {
    kind: 'skeleton',
    internalImpl: `${INTERNAL_PATH}/skeleton.internal.ts`,
    stateMap: { '': 'loading' },
    slotMap: { root: 'root' },
  },
  spinner: {
    kind: 'spinner',
    internalImpl: `${INTERNAL_PATH}/spinner.internal.ts`,
    stateMap: { '': 'spinning' },
    slotMap: { root: 'root' },
  },

  // ============================================
  // UTILITIES
  // ============================================
  portal: {
    kind: 'portal',
    internalImpl: `${INTERNAL_PATH}/portal.internal.ts`,
    stateMap: { '': 'idle' },
    slotMap: { root: 'root' },
  },
  presence: {
    kind: 'presence',
    internalImpl: `${INTERNAL_PATH}/presence.internal.ts`,
    stateMap: { present: 'present', hidden: 'hidden' },
    slotMap: { root: 'root' },
  },
  focusTrap: {
    kind: 'focusTrap',
    internalImpl: `${INTERNAL_PATH}/focusTrap.internal.ts`,
    stateMap: { active: 'active', inactive: 'inactive' },
    slotMap: { root: 'root' },
  },
  visuallyHidden: {
    kind: 'visuallyHidden',
    internalImpl: `${INTERNAL_PATH}/visuallyHidden.internal.ts`,
    stateMap: { '': 'idle' },
    slotMap: { root: 'root' },
  },
  liveStatus: {
    kind: 'liveStatus',
    internalImpl: `${INTERNAL_PATH}/liveStatus.internal.ts`,
    stateMap: { '': 'idle' },
    slotMap: { root: 'root' },
  },
  kbd: {
    kind: 'kbd',
    internalImpl: `${INTERNAL_PATH}/kbd.internal.ts`,
    stateMap: { '': 'idle' },
    slotMap: { root: 'root' },
  },

  // ============================================
  // DATA DISPLAY
  // ============================================
  dataTable: {
    kind: 'dataTable',
    internalImpl: `${INTERNAL_PATH}/dataTable.internal.ts`,
    stateMap: { loading: 'loading', empty: 'empty', '': 'idle' },
    slotMap: { root: 'root', header: 'header', body: 'body', row: 'row', cell: 'cell', headerCell: 'headerCell' },
  },
  chart: {
    kind: 'chart',
    internalImpl: `${INTERNAL_PATH}/chart.internal.ts`,
    stateMap: { loading: 'loading', empty: 'empty', '': 'idle' },
    slotMap: { root: 'root', canvas: 'canvas', legend: 'legend', tooltip: 'tooltip' },
  },
} as const;
