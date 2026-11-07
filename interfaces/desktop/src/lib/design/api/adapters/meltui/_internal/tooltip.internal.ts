/**
 * @file design/api/adapters/meltui/_internal/tooltip.internal.ts
 * @layer internal
 *
 * Tooltip primitive: MeltUI → ColdLight runtime mapping.
 */

import type { MeltUIInternalAdapter } from './types.js';

export const meltTooltipInternal: MeltUIInternalAdapter<'tooltip'> = {
  kind: 'tooltip',

  build(options = {}) {
    const open = options.open as boolean | undefined;
    const state = open ? 'open' : 'closed';

    return {
      root: {
        'data-kind': 'tooltip',
        'data-slot': 'root',
        'data-state': state,
      },
      trigger: {
        'data-kind': 'tooltip',
        'data-slot': 'trigger',
      },
      content: {
        'data-kind': 'tooltip',
        'data-slot': 'content',
        'data-state': state,
      },
      arrow: {
        'data-kind': 'tooltip',
        'data-slot': 'arrow',
      },
    };
  },
};
