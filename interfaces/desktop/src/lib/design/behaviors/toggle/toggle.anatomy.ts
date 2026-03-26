import { createAnatomy } from "../../schema/anatomy.schema.js";

export const toggleAnatomy = createAnatomy("toggle", ["root"] as const);
