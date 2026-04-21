import type { RequiredField, OptionalField, DefaultedField } from "./types"
import {
  parseString,
  parseNumber,
  parseInteger,
  parseBoolean,
  parseUrl,
  parsePort,
  parseEnum,
  parseList,
} from "./parsers"

// ---------------------------------------------------------------------------
// Factory
//
// makeField is the only place that constructs the three POJO states.
// All built-in helpers call this, and callers can call it directly to define
// custom fields with any parse function.
// ---------------------------------------------------------------------------

export function makeField<T>(
  parse: (raw: string) => T,
  description?: string
): RequiredField<T> {
  return {
    _tag: "required",
    parse,
    description,
    optional(): OptionalField<T> {
      return {
        _tag: "optional",
        parse,
        description,
        default(value: T): DefaultedField<T> {
          return {
            _tag: "defaulted",
            parse,
            description,
            fallback: value,
          }
        },
      }
    },
  }
}

// ---------------------------------------------------------------------------
// Built-in field helpers
// ---------------------------------------------------------------------------

export const fields = {
  /**
   * A non-empty string.
   */
  string(description?: string): RequiredField<string> {
    return makeField(parseString, description)
  },

  /**
   * Any finite number.
   */
  number(description?: string): RequiredField<number> {
    return makeField(parseNumber, description)
  },

  /**
   * A whole number (no decimals).
   */
  integer(description?: string): RequiredField<number> {
    return makeField(parseInteger, description)
  },

  /**
   * true/false, 1/0, yes/no (case-insensitive).
   */
  boolean(description?: string): RequiredField<boolean> {
    return makeField(parseBoolean, description)
  },

  /**
   * A fully-qualified URL (parsed with the WHATWG URL constructor).
   */
  url(description?: string): RequiredField<string> {
    return makeField(parseUrl, description)
  },

  /**
   * An integer in the range 1–65535.
   */
  port(description?: string): RequiredField<number> {
    return makeField(parsePort, description)
  },

  /**
   * One of a fixed set of string literals.
   * Pass `as const` to get a narrowed return type:
   *   fields.enum(["a", "b"] as const) → RequiredField<"a" | "b">
   */
  enum<T extends string>(values: readonly T[], description?: string): RequiredField<T> {
    return makeField(parseEnum(values), description)
  },

  /**
   * A comma-separated list of non-empty strings.
   * Pass a custom separator if needed: fields.list(";")
   */
  list(separator = ",", description?: string): RequiredField<string[]> {
    return makeField(parseList(separator), description)
  },
}
