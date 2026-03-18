import { createAnatomy } from "../../schema/anatomy.schema.js";

export const tableAnatomy = createAnatomy("table", [
	"root",
	"header",
	"body",
	"row",
	"cell",
	"column-header",
] as const);
