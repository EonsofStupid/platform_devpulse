/**
 * @file behaviors/index.ts
 * @package @devpulse/coldlight
 * @layer behavior
 *
 * Master barrel for all ColdLight WAI-ARIA APG behaviors.
 * 5 families: display, inputs, interaction, navigation, overlays — plus the
 * shared dismiss layers (Escape, press outside) that overlays are built on.
 * Explicit named exports only — no `export *`.
 */

// ── Display — visual, non-interactive elements ────────────────────────────

export type * from "./display/index.js";
export {
	avatarAnatomy,
	badgeAnatomy,
	cardAnatomy,
	contentAnatomy,
	headingAnatomy,
	labelAnatomy,
	logAnatomy,
	logLevelTone,
	meterAnatomy,
	progressAnatomy,
	progressCircleAnatomy,
	separatorAnatomy,
	tagGroupAnatomy,
	textAnatomy,
	useAlert,
	useAvatar,
	useBadge,
	useBanner,
	useCard,
	useContent,
	useDescriptionList,
	useHeading,
	useInlineMessage,
	useLabel,
	useList,
	useLoadingOverlay,
	useLog,
	useMeter,
	useProgress,
	useProgressCircle,
	useSeparator,
	useSkeleton,
	useSpinner,
	useSteps,
	useTagGroup,
	useText,
} from "./display/index.js";

// ── Inputs — interactive form controls ───────────────────────────────────

export type * from "./inputs/index.js";
export {
	buttonAnatomy,
	checkboxAnatomy,
	colorFieldAnatomy,
	colorSliderAnatomy,
	comboboxAnatomy,
	fieldAnatomy,
	fileTriggerAnatomy,
	listboxAnatomy,
	numberFieldAnatomy,
	radioGroupAnatomy,
	searchFieldAnatomy,
	selectAnatomy,
	sliderAnatomy,
	switchAnatomy,
	textFieldAnatomy,
	toggleAnatomy,
	useButton,
	useCheckbox,
	useColorField,
	useColorSlider,
	useComboBox,
	useField,
	useFileTrigger,
	useForm,
	useFormField,
	useInputGroup,
	useListBox,
	useNumberField,
	useRadioGroup,
	useSearchField,
	useSelect,
	useSlider,
	useSwitch,
	useTextarea,
	useTextField,
	useToggle,
	useToggleGroup,
} from "./inputs/index.js";

// ── Interaction — focus, hover, press, drag ───────────────────────────────

export type * from "./interaction/index.js";
export {
	dragAndDropAnatomy,
	dropZoneAnatomy,
	useDragAndDrop,
	useDropZone,
	useFocus,
	useFocusRing,
	useFocusWithin,
	useHover,
	useKeyboard,
	useLongPress,
	useMove,
	usePress,
	useScrollArea,
	useVirtualizer,
	virtualizerAnatomy,
} from "./interaction/index.js";

// ── Navigation — menus, tabs, trees, tables ──────────────────────────────

export type * from "./navigation/index.js";
export {
	accordionAnatomy,
	breadcrumbsAnatomy,
	gridListAnatomy,
	linkAnatomy,
	menuAnatomy,
	tableAnatomy,
	tabsAnatomy,
	toolbarAnatomy,
	treeAnatomy,
	useAccordion,
	useBreadcrumbs,
	useDataTable,
	useGridList,
	useLink,
	useLinkPreview,
	useMenu,
	usePagination,
	useSidebar,
	useTable,
	useTableOfContents,
	useTabs,
	useToolbar,
	useTree,
} from "./navigation/index.js";

// ── Overlays — dialogs, popovers, tooltips, sheets ───────────────────────

export type * from "./overlays/index.js";
export {
	alertDialogAnatomy,
	dialogAnatomy,
	disclosureAnatomy,
	popoverAnatomy,
	sheetAnatomy,
	tooltipAnatomy,
	useAlertDialog,
	useDialog,
	useDisclosure,
	useNotificationCenter,
	usePopover,
	useSheet,
	useToaster,
	useTooltip,
} from "./overlays/index.js";

// ── Layers — the dismiss rules overlays share, for app-owned layers too ──

export type { DismissLayerConfig, EscapeLayerConfig } from "./_shared/index.js";
export { useDismissLayer, useEscapeLayer } from "./_shared/index.js";
