import { createAnatomy } from "../../schema/anatomy.schema.js";

export const sheetAnatomy = createAnatomy("sheet", ["trigger", "overlay", "content", "title", "description", "close"] as const);
