import type { HTMLAttributes } from "svelte/elements";

export interface MoveEvent {
	deltaX: number;
	deltaY: number;
	pointerType: "mouse" | "touch" | "pen" | "keyboard";
}

export interface UseMoveProps {
	onMoveStart?: () => void;
	onMove?: (e: MoveEvent) => void;
	onMoveEnd?: () => void;
}

export type MovePropsAttrs = Pick<HTMLAttributes<HTMLElement>, "onpointerdown" | "onkeydown" | "tabindex">;

export interface UseMoveReturn {
	readonly moveProps: MovePropsAttrs;
}
