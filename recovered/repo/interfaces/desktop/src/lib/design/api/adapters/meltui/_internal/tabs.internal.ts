/**
 * @file design/api/adapters/meltui/_internal/tabs.internal.ts
 * @layer internal
 *
 * Tabs primitive: MeltUI → ColdLight runtime mapping.
 */

import type { MeltUIInternalAdapter } from './types.js';

export const meltTabsInternal: MeltUIInternalAdapter<'tabs'> = {
  kind: 'tabs',

  build() {
    return {
      root: {
        'data-kind': 'tabs',
        'data-slot': 'root',
        'data-state': 'idle',
      },
      list: {
        'data-kind': 'tabs',
        'data-slot': 'list',
      },
      trigger: {
        'data-kind': 'tabs',
        'data-slot': 'trigger',
        'data-state': 'idle',
      },
      content: {
        'data-kind': 'tabs',
        'data-slot': 'content',
      },
    };
  },
};
