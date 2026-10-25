/**
 * @file design/api/adapters/meltui/_internal/button.internal.ts
 * @layer internal
 *
 * Button primitive: MeltUI → ColdLight runtime mapping.
 */

import type { MeltUIInternalAdapter } from './types.js';

export const meltButtonInternal: MeltUIInternalAdapter<'button'> = {
  kind: 'button',

  build(options = {}) {
    const disabled = options.disabled as boolean | undefined;
    const state = disabled ? 'disabled' : 'idle';

    return {
      root: {
        'data-kind': 'button',
        'data-slot': 'root',
        'data-state': state,
      },
      icon: {
        'data-kind': 'button',
        'data-slot': 'icon',
      },
      label: {
        'data-kind': 'button',
        'data-slot': 'label',
      },
    };
  },
};
