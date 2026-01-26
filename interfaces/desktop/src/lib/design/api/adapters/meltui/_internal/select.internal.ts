/**
 * @file design/api/adapters/meltui/_internal/select.internal.ts
 * @layer internal
 *
 * Select primitive: MeltUI → ColdLight runtime mapping.
 */

import type { MeltUIInternalAdapter } from './types.js';

export const meltSelectInternal: MeltUIInternalAdapter<'select'> = {
  kind: 'select',

  build(options = {}) {
    const open = options.open as boolean | undefined;
    const disabled = options.disabled as boolean | undefined;

    let state = open ? 'open' : 'closed';
    if (disabled) state = 'disabled';

    return {
      root: {
        'data-kind': 'select',
        'data-slot': 'root',
        'data-state': state,
      },
      trigger: {
        'data-kind': 'select',
        'data-slot': 'trigger',
        'data-state': state,
      },
      value: {
        'data-kind': 'select',
        'data-slot': 'value',
      },
      content: {
        'data-kind': 'select',
        'data-slot': 'content',
        'data-state': state,
      },
      viewport: {
        'data-kind': 'select',
        'data-slot': 'viewport',
      },
      item: {
        'data-kind': 'select',
        'data-slot': 'item',
      },
      label: {
        'data-kind': 'select',
        'data-slot': 'label',
      },
      separator: {
        'data-kind': 'select',
        'data-slot': 'separator',
      },
    };
  },
};
