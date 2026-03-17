import { createAnatomy } from "../../schema/anatomy.schema.js";

export const popoverAnatomy = createAnatomy("popover", ["trigger", "content", "arrow", "close"] as const);
