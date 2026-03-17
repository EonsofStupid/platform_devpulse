import { createAnatomy } from "../../schema/anatomy.schema.js";

export const progressAnatomy = createAnatomy("progress", ["root", "track", "fill", "label"] as const);
