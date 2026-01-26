/**
 * @file design/api/adapters/meltui/_internal/checkbox.internal.ts
 * @layer internal
 *
 * Checkbox primitive: MeltUI → ColdLight runtime mapping.
 */

import type { MeltUIInternalAdapter } from './types.js';

export const meltCheckboxInternal: MeltUIInternalAdapter<'checkbox'> = {
  kind: 'checkbox',

  build(options = {}) {
    const checked = options.checked as boolean | 'indeterminate' | undefined;
    const disabled = options.disabled as boolean | undefined;

    let state: string;
    if (disabled) {
      state = 'disabled';
    } else if (checked === 'indeterminate') {
      state = 'indeterminate';
    } else if (checked) {
      state = 'checked';
    } else {
      state = 'unchecked';
    }

    return {
      root: {
        'data-kind': 'checkbox',
        'data-slot': 'root',
        'data-state': state,
      },
      indicator: {
        'data-kind': 'checkbox',
        'data-slot': 'indicator',
        'data-state': state,
      },
    };
  },
};
