/**
 * @file design/api/adapters/meltui/_internal/switch.internal.ts
 * @layer internal
 *
 * Switch primitive: MeltUI → ColdLight runtime mapping.
 */

import type { MeltUIInternalAdapter } from './types.js';

export const meltSwitchInternal: MeltUIInternalAdapter<'switch'> = {
  kind: 'switch',

  build(options = {}) {
    const checked = options.checked as boolean | undefined;
    const disabled = options.disabled as boolean | undefined;

    let state = checked ? 'on' : 'off';
    if (disabled) state = 'disabled';

    return {
      root: {
        'data-kind': 'switch',
        'data-slot': 'root',
        'data-state': state,
      },
      thumb: {
        'data-kind': 'switch',
        'data-slot': 'thumb',
        'data-state': state,
      },
    };
  },
};
