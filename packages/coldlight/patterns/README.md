# Patterns

> **Documentation guidance only. NOT code. NOT imports.**

---

## Critical Distinction

**Patterns are NOT code. You cannot import a pattern.**

| Term | Is Code? | Can Import? | Purpose |
|------|----------|-------------|---------|
| Recipe | Yes (CSS) | Via class | Appearance rules |
| Blueprint | Yes (TS) | Yes | Prebuilt assemblies |
| **Pattern** | No (Docs) | No | Guidance only |
| Block | Yes (JSON) | No | VPB runtime |

---

## Definition

Patterns are **repeatable ideas explained in documentation**:

- How to assemble X correctly
- Best practices for common UI patterns
- Diagrams showing composition
- Examples and guardrails

**Patterns teach. Blueprints build.**

---

## What Patterns Contain

- ✅ Diagrams
- ✅ Best practices
- ✅ Example code (for reference)
- ✅ Accessibility guidance
- ✅ Do/Don't comparisons
- ❌ Actual component files
- ❌ Importable modules

---

## Example: Form Pattern

```markdown
<!-- patterns/forms/LoginForm.md -->

# Login Form Pattern

## Composition

```
┌─────────────────────────────────────┐
│  [Label: Email]                     │
│  [TextInput: email field]           │
│  [Error message if invalid]         │
│                                     │
│  [Label: Password]                  │
│  [TextInput: password field]        │
│  [Error message if invalid]         │
│                                     │
│  [MainButton: Submit]               │
│  [Link: Forgot password?]           │
└─────────────────────────────────────┘
```

## Semantics Used

- `TextInput` from `semantics/inputs/`
- `MainButton` from `semantics/buttons/`
- `FormLabel` from `semantics/inputs/`

## Accessibility

- Labels must be associated with inputs
- Error messages use `aria-describedby`
- Submit button must be type="submit"
- Enter key submits form

## Validation

- Validate on blur
- Show error immediately
- Disable submit until valid

## Example Implementation

```svelte
<form>
  <FormLabel for="email">Email</FormLabel>
  <TextInput id="email" type="email" required />

  <FormLabel for="password">Password</FormLabel>
  <TextInput id="password" type="password" required />

  <MainButton type="submit">Sign In</MainButton>
</form>
```
```

---

## Categories

| Category | Description | Contents |
|----------|-------------|----------|
| [forms/](./forms/) | Form patterns | Login, Signup, Contact |
| [search/](./search/) | Search patterns | SearchBar, Filters |
| [data/](./data/) | Data display patterns | DataGrid, Table |

---

## File Structure

```
patterns/
├── README.md           # This file
├── index.ts            # NOT for imports - just re-exports READMEs
├── forms/
│   ├── README.md       # Category overview
│   ├── LoginForm.md    # Pattern documentation
│   ├── SignupForm.md   # Pattern documentation
│   └── ContactForm.md  # Pattern documentation
├── search/
│   ├── README.md       # Category overview
│   ├── SearchBar.md    # Pattern documentation
│   └── Filters.md      # Pattern documentation
└── data/
    ├── README.md       # Category overview
    ├── DataGrid.md     # Pattern documentation
    └── Table.md        # Pattern documentation
```

---

## Pattern vs Blueprint

| Aspect | Pattern | Blueprint |
|--------|---------|-----------|
| **Format** | Markdown docs | TypeScript definition |
| **Purpose** | Teach assembly | Define assembly |
| **Importable** | No | Yes |
| **Runtime** | Never | Build time |
| **Enforced** | By humans | By code |

**If you need code, use a Blueprint. If you need guidance, use a Pattern.**

---

## Checklist

### Before Adding a Pattern

- [ ] Verify all referenced semantics exist
- [ ] Pattern doesn't duplicate existing one
- [ ] Determine correct category folder

### Pattern Requirements

- [ ] Written in Markdown (`.md`)
- [ ] Includes composition diagram
- [ ] Lists all semantics used
- [ ] Includes accessibility guidance
- [ ] Includes example code
- [ ] NO `.svelte` files
- [ ] NO actual component code

### Auto-Documentation

When pattern is committed:
1. Docusaurus picks up `.md` files
2. Generates pattern reference pages
3. Links to referenced semantics

---

## Forbidden Patterns (the irony)

| Pattern | Why Forbidden |
|---------|---------------|
| `.svelte` files in patterns/ | Patterns are docs only |
| Importing from patterns/ | Nothing to import |
| Treating patterns as components | Use blueprints |

---

**Patterns teach. They don't build. Use blueprints for code.**
