import { createAnatomy } from "../../schema/anatomy.schema.js";

export const tooltipAnatomy = createAnatomy("tooltip", ["trigger", "content"] as const);
