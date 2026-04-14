# Function: cn()

> **cn**(...`inputs`): `string`

Defined in: [behaviorstypes.ts:133](https://github.com/EonsofStupid/platform_devpulse/blob/67216c2b467cf993e9f2044f8cbec2e66dc2fcf0/interfaces/desktop/src/lib/design/behaviorstypes.ts#L133)

Merge class names with Tailwind-aware deduplication.
Uses clsx for conditional classes + tailwind-merge for specificity.

## Parameters

### inputs

...`ClassValue`[]

## Returns

`string`

## Example

```ts
cn("px-2 py-1", "px-4") // => "py-1 px-4" (px-4 wins)
cn("text-red-500", props.class, className) // => merged result
```
