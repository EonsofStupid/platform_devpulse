import { createAnatomy } from "../../schema/anatomy.schema.js";

export const tabsAnatomy = createAnatomy("tabs", ["root", "list", "trigger", "content"] as const);
