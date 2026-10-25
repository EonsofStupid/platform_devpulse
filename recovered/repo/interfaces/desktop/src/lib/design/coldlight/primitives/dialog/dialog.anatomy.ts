import { createAnatomy } from "../../schema/anatomy.schema.js";

export const dialogAnatomy = createAnatomy("dialog", [
	"trigger",
	"overlay",
	"content",
	"title",
	"description",
	"close",
] as const);
