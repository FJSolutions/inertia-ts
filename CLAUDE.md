# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm test          # run tests with vitest (watch mode)
pnpm test --run    # run tests once
pnpm build         # compile with tsup → dist/
```

There is no lint script. Type-checking is implicit via tsup/vitest.

## Architecture

`intertia-ts` is a zero-dependency TypeScript library for validating and parsing environment variables into a strongly typed object. The public API is three exports from `src/index.ts`:

- **`createEnv(schema, source?)`** — validates `source` (defaults to `process.env`) against a schema and returns a discriminated union `{ success: true, data }` | `{ success: false, errors }`. All errors are collected before returning, so callers see every problem at once.
- **`fields`** — object of built-in field factories: `string`, `number`, `integer`, `boolean`, `url`, `port`, `enum`, `list`.
- **`makeField(parse, description?)`** — escape hatch for custom parsers; returns a `RequiredField<T>`.

### Field state chain

Every field starts as `RequiredField<T>`. Calling `.optional()` produces `OptionalField<T>`, which adds a `.default(value)` method that produces `DefaultedField<T>`. The `_tag` discriminant (`"required"` | `"optional"` | `"defaulted"`) is what `createEnv` switches on.

```
makeField(parse)           → RequiredField<T>
  .optional()              → OptionalField<T>
    .default(value)        → DefaultedField<T>
```

### Type inference

`Infer<S>` maps a schema to its output type. `DefaultedField` is tested before `OptionalField` in the conditional type because both share a `parse` property — order matters.

### Portability

`createEnv` accepts any `Record<string, string | undefined>` as its second argument, making it runtime-agnostic and trivially testable. `process.env` is accessed lazily through `getDefaultSource()` so the import doesn't throw in environments without `process` (e.g. Cloudflare Workers).

### Test files

- `src/tests.ts` — self-contained test suite with a minimal hand-rolled harness (no vitest). Run with `tsx src/tests.ts` if needed for quick iteration.
- `tests/example.ts` — usage example showing the full API.
- Vitest picks up test files via its default config.

### Build

`tsup.config.ts` compiles `src/index.ts` to `dist/`, with `dts: true` for type declarations. Output is minified and tree-shaken, targeting a neutral (non-Node) platform.