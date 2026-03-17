import { createAnatomy } from "../../schema/anatomy.schema.js";

export const containerAnatomy = createAnatomy("container", ["root"] as const);
