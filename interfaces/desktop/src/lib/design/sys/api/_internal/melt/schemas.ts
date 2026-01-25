/**
 * @file sys/api/_internal/melt/schemas.ts
 * @layer internal
 *
 * Zod validation schemas for props.
 */

import { z } from 'zod';

// ============================================
// STATE PROPS
// ============================================

export const OpenStatePropsSchema = z.object({
  open: z.boolean().optional(),
  defaultOpen: z.boolean().optional(),
  onOpenChange: z.function().optional(),
});
export type OpenStateProps = z.infer<typeof OpenStatePropsSchema>;

export const CheckedStatePropsSchema = z.object({
  checked: z.union([z.boolean(), z.literal('indeterminate')]).optional(),
  defaultChecked: z.union([z.boolean(), z.literal('indeterminate')]).optional(),
  onCheckedChange: z.function().optional(),
});
export type CheckedStateProps = z.infer<typeof CheckedStatePropsSchema>;

// ============================================
// POSITIONING
// ============================================

export const SideSchema = z.enum(['top', 'right', 'bottom', 'left']);
export const AlignSchema = z.enum(['start', 'center', 'end']);

export const PlacementSchema = z.enum([
  'top', 'top-start', 'top-end',
  'right', 'right-start', 'right-end',
  'bottom', 'bottom-start', 'bottom-end',
  'left', 'left-start', 'left-end',
]);

export const FloatingPropsSchema = z.object({
  placement: PlacementSchema.optional(),
  strategy: z.enum(['absolute', 'fixed']).optional(),
  gutter: z.number().optional(),
  flip: z.boolean().optional(),
  sameWidth: z.boolean().optional(),
});
export type FloatingProps = z.infer<typeof FloatingPropsSchema>;

// ============================================
// BEHAVIOR
// ============================================

export const EscapeBehaviorSchema = z.enum([
  'close',
  'ignore',
  'defer-otherwise-close',
  'defer-otherwise-ignore',
]);
export type EscapeBehavior = z.infer<typeof EscapeBehaviorSchema>;

export const ModalBehaviorPropsSchema = z.object({
  escapeBehavior: EscapeBehaviorSchema.optional(),
  closeOnOutsideClick: z.boolean().optional(),
  preventScroll: z.boolean().optional(),
});
export type ModalBehaviorProps = z.infer<typeof ModalBehaviorPropsSchema>;

// ============================================
// FORM
// ============================================

export const FormFieldPropsSchema = z.object({
  name: z.string().optional(),
  required: z.boolean().optional(),
  disabled: z.boolean().optional(),
});
export type FormFieldProps = z.infer<typeof FormFieldPropsSchema>;

// ============================================
// VALIDATION
// ============================================

export function validateProps<T>(
  schema: z.ZodSchema<T>,
  props: unknown,
  context?: string
): T {
  const result = schema.safeParse(props);
  if (!result.success) {
    const issues = result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ');
    throw new Error(`[ColdLight] Invalid props${context ? ` in ${context}` : ''}: ${issues}`);
  }
  return result.data;
}
