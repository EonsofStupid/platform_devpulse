/** What this devtool's route folder says about itself (plan 0008). */

import { RotateCw } from "lucide-svelte";
import type { DevtoolNav } from "#lib/devtools/devtool-nav.js";
import type { RouteNav } from "#lib/sys/routing/index.js";

export const _nav: RouteNav = { icon: RotateCw, order: 20 };
export const _devtool: DevtoolNav = { accent: "purple" };
