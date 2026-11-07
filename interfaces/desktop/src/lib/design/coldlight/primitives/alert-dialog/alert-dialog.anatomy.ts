import { createAnatomy } from "../../schema/anatomy.schema.js";

export const alertDialogAnatomy = createAnatomy("alert-dialog", [
	"trigger",
	"overlay",
	"content",
	"title",
	"description",
	"cancel",
	"action",
] as const);
