/**
 * @file design/api/adapters/meltui/_internal/accordion.internal.ts
 * @layer internal
 *
 * Accordion primitive: MeltUI → ColdLight runtime mapping.
 */

import type { MeltUIInternalAdapter } from './types.js';

export const meltAccordionInternal: MeltUIInternalAdapter<'accordion'> = {
  kind: 'accordion',

  build() {
    return {
      root: {
        'data-kind': 'accordion',
        'data-slot': 'root',
        'data-state': 'closed',
      },
      item: {
        'data-kind': 'accordion',
        'data-slot': 'item',
        'data-state': 'closed',
      },
      trigger: {
        'data-kind': 'accordion',
        'data-slot': 'trigger',
      },
      content: {
        'data-kind': 'accordion',
        'data-slot': 'content',
      },
    };
  },
};
