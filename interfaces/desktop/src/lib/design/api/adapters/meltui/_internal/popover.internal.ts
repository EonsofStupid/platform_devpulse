/**
 * @file design/api/adapters/meltui/_internal/popover.internal.ts
 * @layer internal
 *
 * Popover primitive: MeltUI → ColdLight runtime mapping.
 */

import type { MeltUIInternalAdapter } from './types.js';

export const meltPopoverInternal: MeltUIInternalAdapter<'popover'> = {
  kind: 'popover',

  build(options = {}) {
    const open = options.open as boolean | undefined;
    const state = open ? 'open' : 'closed';

    return {
      root: {
        'data-kind': 'popover',
        'data-slot': 'root',
        'data-state': state,
      },
      trigger: {
        'data-kind': 'popover',
        'data-slot': 'trigger',
      },
      content: {
        'data-kind': 'popover',
        'data-slot': 'content',
        'data-state': state,
      },
      arrow: {
        'data-kind': 'popover',
        'data-slot': 'arrow',
      },
      close: {
        'data-kind': 'popover',
        'data-slot': 'close',
      },
    };
  },
};
