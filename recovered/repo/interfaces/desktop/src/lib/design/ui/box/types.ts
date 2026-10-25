/**
 * @file Box UI Types
 * @kind box
 * @layer ui
 */

import type { BoxComponentProps, BoxPadding, BoxRadius } from "$lib/design/components/box/types.js";
import type { ColdLightProps } from "$lib/design/components/_base/types.js";

export type { BoxPadding, BoxRadius } from "$lib/design/components/box/types.js";

export interface BoxUIProps extends BoxComponentProps, Omit<ColdLightProps, "radius"> {
	padding?: BoxPadding;
	radius?: BoxRadius;
}
