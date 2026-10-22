/**
 * @file VPB Graph Types — @xyflow/svelte custom node/edge types
 * @layer vpb
 */

import type { BlockNode } from "@devpulse/coldlight/blocks";
import type { Edge, Node } from "@xyflow/svelte";

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
