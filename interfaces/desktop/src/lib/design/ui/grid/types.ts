/**
 * @file Grid UI Types
 * @kind grid
 * @layer ui
 */

import type { GridComponentProps, GridColumns, GridGap, GridRows } from "$lib/design/components/grid/types.js";
import type { ColdLightProps } from "$lib/design/components/_base/types.js";

export type { GridColumns, GridGap, GridRows } from "$lib/design/components/grid/types.js";

export interface GridUIProps extends GridComponentProps, ColdLightProps {
	columns?: GridColumns;
	gap?: GridGap;
	rows?: GridRows;
}
