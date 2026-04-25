# Rust struct/enum/trait pasted as the spec

> The public surface is the contract. Honor it verbatim.

**Verified triggers (corpus document-frequency):** ` ```rust ` (44 hits), `pub struct` (39), `pub fn` (25), `pub enum` (14).
**Promote to:** skill — `honor-the-shape`.

## When this mode is active

User has pasted a Rust code fence containing `pub struct`, `pub enum`, `pub trait`, or `pub fn` definitions. Field / variant doc-comments using `///` describe intended semantics. Often paired with an enclosing heading naming the subsystem.

## What it means

The user has chosen the public surface. They want that surface kept verbatim — same names, same casing, same generics — and the body filled in to honor the doc-comments.

## Automatic actions

- Use the exact identifiers from the paste — including casing and ordering of fields/variants.
- Preserve every `///` doc-comment as written into the final file.
- If a field's type is ambiguous, pick the minimal-dependency stdlib choice and call out the choice in the report.
- Place the type in the module the surrounding heading implies (no relocation).
- Add only what the doc-comments demand; do not invent extra public methods.

## Anti-patterns

- Renaming a variant for "consistency".
- Reordering fields to match an alphabetic or "natural" order.
- Switching `String` to `&str`, `Vec<T>` to `SmallVec<T>`, etc., without being asked.
- Wrapping the struct in `Arc<RwLock<…>>` "for thread safety" when the spec didn't.
- Adding `#[derive(...)]` lines the user didn't include unless required to compile.
