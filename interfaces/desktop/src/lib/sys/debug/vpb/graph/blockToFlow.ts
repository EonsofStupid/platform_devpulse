/**
 * @file Block-to-Flow Converter — BlockNode[] → SvelteFlow nodes/edges
 * @layer vpb
 *
 * Converts a BlockNode tree into @xyflow/svelte Nodes and Edges
 * with automatic layout positioning.
 */

import type { BlockNode } from "$lib/design/blocks/schema.js";
import type { VpbFlowNode, VpbFlowEdge } from "./types.js";

const NODE_WIDTH = 220;
const NODE_HEIGHT = 60;
const H_GAP = 280;
const V_GAP = 80;

export function blockTreeToFlow(roots: BlockNode[]): {
	nodes: VpbFlowNode[];
	edges: VpbFlowEdge[];
} {
	const nodes: VpbFlowNode[] = [];
	const edges: VpbFlowEdge[] = [];

	function walk(
		block: BlockNode,
		parentId: string | null,
		slotName: string | null,
		depth: number,
		x: number,
		y: number,
	): number {
		nodes.push({
			id: block.id,
			type: "vpbBlock",
			position: { x, y },
			data: {
				blockNode: block,
				slotName: slotName ?? undefined,
				depth,
			},
			width: NODE_WIDTH,
			height: NODE_HEIGHT,
		});

		if (parentId) {
			edges.push({
				id: `${parentId}-${block.id}`,
				source: parentId,
				target: block.id,
				type: "slot",
				data: { slotName: slotName ?? "default" },
			});
		}

		let currentY = y;

		if (block.slots) {
			for (const [slot, children] of Object.entries(block.slots)) {
				for (const child of children) {
					currentY = walk(child, block.id, slot, depth + 1, x + H_GAP, currentY);
					currentY += V_GAP;
				}
			}
		}

		return Math.max(currentY, y + NODE_HEIGHT);
	}

	let y = 0;
	for (const root of roots) {
		y = walk(root, null, null, 0, 0, y);
		y += V_GAP;
	}

	return { nodes, edges };
}
