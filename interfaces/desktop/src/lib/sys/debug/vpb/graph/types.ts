/**
 * @file VPB Graph Types — @xyflow/svelte custom node/edge types
 * @layer vpb
 */

import type { Edge, Node } from "@xyflow/svelte";
import type { BlockNode } from "$lib/design/blocks/schema.js";

export interface VpbFlowNode extends Node {
	type: "vpbBlock";
	data: {
		blockNode: BlockNode;
		slotName?: string;
		depth: number;
	};
}

export interface VpbFlowEdge extends Edge {
	type: "slot";
	data: {
		slotName: string;
	};
}
