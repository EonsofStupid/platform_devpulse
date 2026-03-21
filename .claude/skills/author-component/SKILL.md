# Author Component

Use this skill when the user pastes a React Spectrum / Ark UI / Zag component API reference and wants it properly authored as a ColdLight component.

## When to use
- User pastes a component API table from Spectrum, Ark UI, or Zag docs
- User says "author this component" or "create this component"
- User provides a component name and API reference

## What to do

1. **Read the agent instructions** at `.claude/agents/coldlight-component-author.md` — this is your complete guide
2. **Analyze the API** — identify all props, slots, ARIA patterns, behavioral requirements
3. **Check existing state** — does a primitive exist? Does a component folder exist? Is there a centralized recipe?
4. **Plan** — categorize as structural or behavioral, list all files to create/modify
5. **Execute** — create types, context, root, sub-components, contract, recipe, barrel
6. **Verify** — run `svelte-check` and confirm zero errors for the component

## Verification

After authoring, check:
- [ ] All files follow the patterns in the agent instructions
- [ ] Recipe uses token-backed spacing (SD5 scale, N = pixel value)
- [ ] Controlled/uncontrolled pattern implemented
- [ ] Auto-generated IDs via createIds()
- [ ] Contract satisfies ComponentContract
- [ ] Recipe registered in barrel
- [ ] Named exports (Root, Item, Trigger, etc.)
- [ ] Compiles clean

## Key reference files
- `.claude/agents/coldlight-component-author.md` — full agent instructions
- `design/components/_base/types.ts` — PreparedComponentProps
- `design/_internal/utils/uid.ts` — createIds
- `design/recipes/index.ts` — getRecipe, registerRecipe
- `design/components/_schema/contract.ts` — ComponentContract type
