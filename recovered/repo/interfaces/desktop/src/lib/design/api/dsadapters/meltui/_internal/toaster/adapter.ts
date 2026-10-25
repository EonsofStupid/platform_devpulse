/**
 * @file api/adapters/meltui/_internal/toaster/adapter.ts
 * @package @devpulse/coldlight
 *
 * MeltUI Toaster adapter — wraps the MeltUI Toaster builder into AdapterResult.
 *
 * Toaster manages toast instances internally. The root slot is static.
 * Individual toast slots (content, title, description, close) live on Toast
 * instances returned by addToast(). We expose toast management via context.
 */

import type { AdapterResult } from "../../../_schema/engine.js";
import { createMeltToaster, type MeltToasterConfig } from "./factory.js";

export function createAdapter(props?: Record<string, unknown>): AdapterResult {
	const builder = createMeltToaster(props as MeltToasterConfig);

	return {
		states: {
			active: {
				get current() {
					return builder.toasts.length > 0;
				},
				set current(_v: boolean) {
					// active is derived from toast count, not directly settable
				},
			},
		},
		attrs: {
			root: {
				get "data-melt-toaster-root"() {
					return builder.root["data-melt-toaster-root"];
				},
				get id() {
					return builder.root.id;
				},
				get popover() {
					return builder.root.popover;
				},
			},
		},
		handlers: {
			root: {},
		},
		context: {
			/**
			 * Adds a toast and returns an object with per-slot attrs/handlers.
			 * The toast object has content, title, description, and close getters.
			 */
			addToast(toastProps: { id?: string; closeDelay?: number; type?: "assertive" | "polite"; data: unknown }) {
				const toast = builder.addToast(toastProps);

				return {
					/** The toast id */
					id: toast.id,
					/** The toast data */
					data: toast.data,
					/** Per-slot attributes */
					attrs: {
						content: {
							get "data-melt-toaster-toast-content"() {
								return toast.content["data-melt-toaster-toast-content"];
							},
							get id() {
								return toast.content.id;
							},
							get role() {
								return toast.content.role;
							},
							get "aria-labelledby"() {
								return toast.content["aria-labelledby"];
							},
							get "aria-describedby"() {
								return toast.content["aria-describedby"];
							},
							get "aria-live"() {
								return toast.content["aria-live"];
							},
							get tabindex() {
								return String(toast.content.tabindex);
							},
						},
						title: {
							get id() {
								return toast.title.id;
							},
						},
						description: {
							get id() {
								return toast.description.id;
							},
						},
						close: {
							get "data-melt-toaster-toast-close"() {
								return toast.close["data-melt-toaster-toast-close"];
							},
						},
					},
					/** Per-slot handlers */
					handlers: {
						content: {
							get onpointerenter() {
								return toast.content.onpointerenter;
							},
							get onpointerleave() {
								return toast.content.onpointerleave;
							},
						},
						close: {
							get onclick() {
								return toast.close.onclick;
							},
						},
					},
					/** Toast lifecycle methods */
					removeSelf: toast.removeSelf,
					pause: toast.pause,
					resume: toast.resume,
					reset: toast.reset,
					/** Timer state */
					get percentage() {
						return toast.percentage;
					},
					get timeElapsed() {
						return toast.timeElapsed;
					},
				};
			},

			/** Remove a toast by id */
			removeToast: (id: string) => builder.removeToast(id),
			/** Update a toast by id */
			updateToast: (args: { id: string; closeDelay?: number; type?: "assertive" | "polite"; data: unknown }) =>
				builder.updateToast(args),
			/** Pause all toasts */
			pauseAll: () => builder.pauseAll(),
			/** Resume all toasts */
			resumeAll: () => builder.resumeAll(),

			/** The list of active toasts */
			get toasts() {
				return builder.toasts;
			},
		},
	};
}
