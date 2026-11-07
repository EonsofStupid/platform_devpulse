/**
 * @file Stack UI Types
 * @kind stack
 * @layer ui
 */

import type { StackComponentProps, StackGap, StackAlign } from "$lib/design/components/stack/types.js";
import type { ColdLightProps } from "$lib/design/components/_base/types.js";

export type { StackGap, StackAlign } from "$lib/design/components/stack/types.js";

export interface StackUIProps extends StackComponentProps, ColdLightProps {
	gap?: StackGap;
	align?: StackAlign;
}
