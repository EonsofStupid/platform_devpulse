/** What this route folder says about itself as a page (plan 0008); its tier facts are in +layout.ts. */

import { Cpu } from "lucide-svelte";
import type { DevtoolNav } from "#lib/devtools/devtool-nav.js";
import type { RouteNav } from "#lib/sys/routing/index.js";

export const _nav: RouteNav = { icon: Cpu };
export const _devtool: DevtoolNav = { accent: "ember" };
