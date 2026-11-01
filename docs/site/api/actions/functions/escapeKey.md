# Function: escapeKey()

> **escapeKey**(`node`, `callback`): `object`

Defined in: [actions/useEscapeKey.ts:7](https://github.com/EonsofStupid/platform_devpulse/blob/67216c2b467cf993e9f2044f8cbec2e66dc2fcf0/interfaces/desktop/src/lib/design/actions/useEscapeKey.ts#L7)

## Parameters

### node

`HTMLElement`

### callback

() => `void`

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

() => `void`

#### Returns

`void`

## File

actions/useEscapeKey.ts

## Package

@devpulse/coldlight

Fires callback on Escape keypress. Use: `use:escapeKey={callback}`.
