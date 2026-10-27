# Function: slotMerge()

> **slotMerge**(`kind`, `slot`, `className`, `rest`): `Record`\<`string`, `unknown`\>

Defined in: [utils/slotMerge.ts:8](https://github.com/EonsofStupid/platform_devpulse/blob/67216c2b467cf993e9f2044f8cbec2e66dc2fcf0/interfaces/desktop/src/lib/design/utils/slotMerge.ts#L8)

## Parameters

### kind

`string`

### slot

`string`

### className

`string` | `undefined`

### rest

`Record`\<`string`, `unknown`\>

## Returns

`Record`\<`string`, `unknown`\>

## File

utils/slotMerge.ts

## Package

@devpulse/coldlight

Merge slot attributes: data-kind, data-slot, class, and rest props.
Used by primitives to build the final attribute spread.
