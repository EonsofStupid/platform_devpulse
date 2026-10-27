# Function: resizeObserver()

> **resizeObserver**(`node`, `callback`): `object`

Defined in: [actions/useResizeObserver.ts:7](https://github.com/EonsofStupid/platform_devpulse/blob/67216c2b467cf993e9f2044f8cbec2e66dc2fcf0/interfaces/desktop/src/lib/design/actions/useResizeObserver.ts#L7)

## Parameters

### node

`HTMLElement`

### callback

(`entry`) => `void`

## Returns

`object`

### destroy()

> **destroy**(): `void`

#### Returns

`void`

### update()

> **update**(`newCallback`): `void`

#### Parameters

##### newCallback

(`entry`) => `void`

#### Returns

`void`

## File

actions/useResizeObserver.ts

## Package

@devpulse/coldlight

ResizeObserver action. Use: `use:resizeObserver={callback}`.
