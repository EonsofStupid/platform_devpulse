import { createAnatomy } from "../../schema/anatomy.schema.js";

export const buttonAnatomy = createAnatomy("button", ["root", "icon", "label"] as const);
