/**
 * @file design/api/adapters/meltui/_internal/input.internal.ts
 * @layer internal
 *
 * Input primitive: MeltUI → ColdLight runtime mapping.
 */

import type { MeltUIInternalAdapter } from './types.js';

export const meltInputInternal: MeltUIInternalAdapter<'input'> = {
  kind: 'input',

  build(options = {}) {
    const disabled = options.disabled as boolean | undefined;
    const invalid = options.invalid as boolean | undefined;

    let state = 'idle';
    if (disabled) state = 'disabled';
    else if (invalid) state = 'invalid';

    return {
      root: {
        'data-kind': 'input',
        'data-slot': 'root',
        'data-state': state,
      },
      label: {
        'data-kind': 'input',
        'data-slot': 'label',
      },
      control: {
        'data-kind': 'input',
        'data-slot': 'control',
        'data-state': state,
      },
      help: {
        'data-kind': 'input',
        'data-slot': 'help',
      },
      error: {
        'data-kind': 'input',
        'data-slot': 'error',
      },
    };
  },
};
