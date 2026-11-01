# Function: intersection()

> **intersection**(`node`, `params`): `object`

Defined in: [actions/useIntersection.ts:7](https://github.com/EonsofStupid/platform_devpulse/blob/67216c2b467cf993e9f2044f8cbec2e66dc2fcf0/interfaces/desktop/src/lib/design/actions/useIntersection.ts#L7)

## Parameters

### node

`HTMLElement`

### params

#### onChange

(`entry`) => `void`

#### options?

`IntersectionObserverInit`

## Returns

`object`

### destroy()

> **destroy**(): `void`

#### Returns

`void`

## File

actions/useIntersection.ts

## Package

@devpulse/coldlight

IntersectionObserver action. Use: `use:intersection={{ onChange, options }}`.
