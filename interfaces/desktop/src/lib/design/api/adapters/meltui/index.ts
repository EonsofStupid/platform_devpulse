/**
 * @file design/api/adapters/meltui/index.ts
 * @layer internal
 *
 * Melt UI binding layer barrel.
 */

// Re-export melt action
export { melt } from '@melt-ui/svelte';

// Types
export type {
  DialogBuilder,
  PopoverBuilder,
  TooltipBuilder,
  SelectBuilder,
  ComboboxBuilder,
  CheckboxBuilder,
  SwitchBuilder,
  RadioGroupBuilder,
  ToggleBuilder,
  ToggleGroupBuilder,
  TabsBuilder,
  AccordionBuilder,
  DropdownMenuBuilder,
  ContextMenuBuilder,
  CollapsibleBuilder,
  SeparatorBuilder,
  ProgressBuilder,
  SliderBuilder,
  LabelBuilder,
  PaginationBuilder,
  ToasterBuilder,
  CalendarBuilder,
  DateFieldBuilder,
  DatePickerBuilder,
  AvatarBuilder,
  PinInputBuilder,
  TagsInputBuilder,
  LinkPreviewBuilder,
  MenubarBuilder,
  ScrollAreaBuilder,
  TreeViewBuilder,
  BuilderElements,
  BuilderStates,
  BuilderHelpers,
  BuilderOptions,
} from './types.js';

// State extraction
export {
  extractOpenState,
  extractCheckedState,
  extractActiveState,
  extractOnOffState,
  extractProgressState,
  extractPresence,
  extractSelected,
  extractHighlighted,
  extractDisabled,
  type OpenState,
  type CheckedState,
  type ActiveState,
  type OnOffState,
  type ProgressState,
} from './state.js';

// Assertions (runtime enforcement)
export {
  assertKindRegistered,
  assertSlotValid,
  assertBuilderExists,
  assertDataKind,
  assertDataSlot,
  assertDataState,
} from './assertions.js';

// Schemas
export {
  OpenStatePropsSchema,
  CheckedStatePropsSchema,
  SideSchema,
  AlignSchema,
  PlacementSchema,
  FloatingPropsSchema,
  EscapeBehaviorSchema,
  ModalBehaviorPropsSchema,
  FormFieldPropsSchema,
  validateProps,
  type OpenStateProps,
  type CheckedStateProps,
  type FloatingProps,
  type EscapeBehavior,
  type ModalBehaviorProps,
  type FormFieldProps,
} from './schemas.js';
