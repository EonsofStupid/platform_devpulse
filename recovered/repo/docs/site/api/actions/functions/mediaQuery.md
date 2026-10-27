# Function: mediaQuery()

> **mediaQuery**(`_node`, `params`): `object`

Defined in: [actions/useMediaQuery.ts:7](https://github.com/EonsofStupid/platform_devpulse/blob/67216c2b467cf993e9f2044f8cbec2e66dc2fcf0/interfaces/desktop/src/lib/design/actions/useMediaQuery.ts#L7)

## Parameters

### \_node

`HTMLElement`

### params

#### onChange

(`matches`) => `void`

#### query

`string`

## Returns

`object`

### destroy()

> **destroy**(): `void`

#### Returns

`void`

### update()

> **update**(`p`): `void`

#### Parameters

##### p

###### onChange

(`matches`) => `void`

###### query

`string`

#### Returns

`void`

## File

actions/useMediaQuery.ts

## Package

@devpulse/coldlight

Tracks a CSS media query via callback. Use: `use:mediaQuery={{ query, onChange }}`.
