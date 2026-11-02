/** @file Tree composition context; behavior remains owned by ColdLight. */
import { getContext, setContext } from "svelte";
import type { UseTreeReturn } from "#coldlight/behaviors/navigation/tree/index.js";
import type { TreeVariant } from "./tree.generated.js";

const treeKey = Symbol("coldlight-tree");
const levelKey = Symbol("coldlight-tree-level");

export interface TreeContext {
	readonly behavior: UseTreeReturn;
	readonly variant: TreeVariant;
}

export function setTreeContext(context: TreeContext): void {
	setContext(treeKey, context);
	setContext(levelKey, 1);
}

export function getTreeContext(): TreeContext {
	const context = getContext<TreeContext | undefined>(treeKey);
	if (!context) throw new Error("TreeItem must be inside a Tree");
	return context;
}

export function childLevel(): number {
	const level = getContext<number>(levelKey);
	setContext(levelKey, level + 1);
	return level;
}
