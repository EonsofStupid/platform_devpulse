/**
 * @file HStack UI Types
 * @kind hstack
 * @layer ui
 */

import type { HStackComponentProps, HStackGap, HStackAlign, HStackJustify } from "$lib/design/components/hstack/types.js";
import type { ColdLightProps } from "$lib/design/components/_base/types.js";

export type { HStackGap, HStackAlign, HStackJustify } from "$lib/design/components/hstack/types.js";

export interface HStackUIProps extends HStackComponentProps, ColdLightProps {
	gap?: HStackGap;
	align?: HStackAlign;
	justify?: HStackJustify;
}
