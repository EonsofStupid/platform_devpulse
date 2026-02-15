// Side-effect imports: register recipes + blueprints
import "$lib/design/recipes/components/dialog/index.js";
import "$lib/design/blueprints/components/dialog/index.js";
import "$lib/design/recipes/components/combobox/index.js";
import "$lib/design/blueprints/components/combobox/index.js";
import "$lib/design/recipes/components/tabs/index.js";
import "$lib/design/blueprints/components/tabs/index.js";
import "$lib/design/recipes/components/panel/index.js";
import "$lib/design/blueprints/components/panel/index.js";
import "$lib/design/recipes/layouts/shell/index.js";

export * as Combobox from "./combobox/index.js";
// Component exports
export * as Dialog from "./dialog/index.js";
export * as Panel from "./panel/index.js";
export * as Tabs from "./tabs/index.js";
export type { ComponentSurfaceProps } from "./types.js";
