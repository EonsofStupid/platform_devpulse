/**
 * @file Container UI Types
 * @kind container
 * @layer ui
 */

import type { ContainerComponentProps, ContainerSize } from "$lib/design/components/container/types.js";
import type { ColdLightProps } from "$lib/design/components/_base/types.js";

export type { ContainerSize } from "$lib/design/components/container/types.js";

export interface ContainerUIProps extends ContainerComponentProps, Omit<ColdLightProps, "size"> {
	size?: ContainerSize;
}
