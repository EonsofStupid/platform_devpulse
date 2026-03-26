import { createAnatomy } from "../../schema/anatomy.schema.js";

export const breadcrumbsAnatomy = createAnatomy("breadcrumbs", [
	"root",
	"list",
	"item",
	"link",
	"separator",
] as const);
