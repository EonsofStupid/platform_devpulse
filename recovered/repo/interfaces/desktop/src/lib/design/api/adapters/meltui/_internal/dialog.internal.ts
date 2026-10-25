/**
 * @file design/api/adapters/meltui/_internal/dialog.internal.ts
 * @layer internal
 *
 * Dialog primitive: MeltUI → ColdLight runtime mapping.
 */

import type { MeltUIInternalAdapter } from './types.js';

export const meltDialogInternal: MeltUIInternalAdapter<'dialog'> = {
  kind: 'dialog',

  build(options = {}) {
    const open = options.open as boolean | undefined;
    const state = open ? 'open' : 'closed';

    return {
      root: {
        'data-kind': 'dialog',
        'data-slot': 'root',
        'data-state': state,
      },
      trigger: {
        'data-kind': 'dialog',
        'data-slot': 'trigger',
      },
      portal: {
        'data-kind': 'dialog',
        'data-slot': 'portal',
      },
      overlay: {
        'data-kind': 'dialog',
        'data-slot': 'overlay',
        'data-state': state,
      },
      content: {
        'data-kind': 'dialog',
        'data-slot': 'content',
        'data-state': state,
      },
      header: {
        'data-kind': 'dialog',
        'data-slot': 'header',
      },
      title: {
        'data-kind': 'dialog',
        'data-slot': 'title',
      },
      description: {
        'data-kind': 'dialog',
        'data-slot': 'description',
      },
      footer: {
        'data-kind': 'dialog',
        'data-slot': 'footer',
      },
      close: {
        'data-kind': 'dialog',
        'data-slot': 'close',
      },
    };
  },
};
