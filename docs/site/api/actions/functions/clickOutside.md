# Function: clickOutside()

> **clickOutside**(`node`, `callback`): `object`

Defined in: [actions/useClickOutside.ts:7](https://github.com/EonsofStupid/platform_devpulse/blob/67216c2b467cf993e9f2044f8cbec2e66dc2fcf0/interfaces/desktop/src/lib/design/actions/useClickOutside.ts#L7)

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

actions/useClickOutside.ts

## Package

@devpulse/coldlight

Detects clicks outside an element. Use: `use:clickOutside={callback}`.
