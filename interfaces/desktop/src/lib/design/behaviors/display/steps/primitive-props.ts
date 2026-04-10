import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";

/** Step status */
export type StepStatus = "completed" | "current" | "upcoming";

/** Steps orientation */
export type StepsOrientation = "horizontal" | "vertical";

/**
 * Structural props for the Steps primitive.
 *
 * A steps indicator shows progress through a multi-step process.
 * Steps can be clickable (for navigation) or static (display only).
 * For task completion without steps, use Progress instead.
 *
 * @example
 * ```svelte
 * <nav {...stepsAnatomy.attrs.root} aria-label="Checkout progress">
 *   <ol {...stepsAnatomy.attrs.list}>
 *     <li {...stepsAnatomy.attrs.item} data-status="completed">
 *       <button {...stepsAnatomy.attrs.trigger}>Cart</button>
 *       <div {...stepsAnatomy.attrs.separator} aria-hidden="true" />
 *     </li>
 *     <li {...stepsAnatomy.attrs.item} data-status="current">
 *       <button {...stepsAnatomy.attrs.trigger} aria-current="step">Payment</button>
 *     </li>
 *   </ol>
 * </nav>
 * ```
 */
export interface StepsPrimitiveProps extends Omit<HTMLAttributes<HTMLElement>, "children"> {
	/** Snippet content rendered inside the steps */
	children?: Snippet;
	/** Additional CSS classes */
	class?: string;
	/** Current active step index (0-based) */
	currentStep?: number;
	/** Callback when a step is clicked */
	onStepChange?: (step: number) => void;
	/** Steps orientation. Default: "horizontal" */
	orientation?: StepsOrientation;
	/** Whether completed steps are clickable for navigation. Default: true */
	navigable?: boolean;
}
