# Function: portal()

> **portal**(`node`, `target?`): `object`

Defined in: [actions/usePortal.ts:7](https://github.com/EonsofStupid/platform_devpulse/blob/67216c2b467cf993e9f2044f8cbec2e66dc2fcf0/interfaces/desktop/src/lib/design/actions/usePortal.ts#L7)

## Parameters

### node

`HTMLElement`

### target?

`string` | `HTMLElement`

## Returns

`object`

### destroy()

> **destroy**(): `void`

#### Returns

`void`

### update()

> **update**(`newTarget`): `void`

#### Parameters

##### newTarget

`string` | `HTMLElement`

#### Returns

`void`

## File

actions/usePortal.ts

## Package

@devpulse/coldlight

Moves element to a target container (default: document.body). Use: `use:portal` or `use:portal={target}`.
