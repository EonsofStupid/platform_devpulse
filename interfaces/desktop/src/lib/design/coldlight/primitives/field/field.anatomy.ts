import { createAnatomy } from "../../schema/anatomy.schema.js";

export const fieldAnatomy = createAnatomy("field", ["root", "label", "control", "description", "error"] as const);
