import { createAnatomy } from "../../schema/anatomy.schema.js";

export const treeAnatomy = createAnatomy("tree", ["root", "item", "group"] as const);
