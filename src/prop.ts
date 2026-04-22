import type { RequiredProp, OptionalProp, DefaultedProp } from "./types"
import {
   parseString,
   parseNumber,
   parseInteger,
   parseBoolean,
   parseUrl,
   parsePort,
   parseEnum,
   parseList, Secret, parseSecret,
} from "./parsers"

// ---------------------------------------------------------------------------
// Factory
//
// makeField is the only place that constructs the three POJO states.
// All built-in helpers call this, and callers can call it directly to define
// custom prop with any parse function.
// ---------------------------------------------------------------------------

export function makeProp<T>(
   parse: (raw: string) => T,
   description?: string
): RequiredProp<T> {
   return {
      _tag: "required",
      parse,
      description,
      optional(): OptionalProp<T> {
         return {
            _tag: "optional",
            parse,
            description,
            default(value: T): DefaultedProp<T> {
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

export const prop = {
   /**
    * A non-empty string.
    */
   string(description?: string): RequiredProp<string> {
      return makeProp(parseString, description)
   },

   /**
    * Any finite number.
    */
   number(description?: string): RequiredProp<number> {
      return makeProp(parseNumber, description)
   },

   /**
    * A whole number (no decimals).
    */
   integer(description?: string): RequiredProp<number> {
      return makeProp(parseInteger, description)
   },

   /**
    * true/false, 1/0, yes/no (case-insensitive).
    */
   boolean(description?: string): RequiredProp<boolean> {
      return makeProp(parseBoolean, description)
   },

   /**
    * A fully-qualified URL (parsed with the WHATWG URL constructor).
    */
   url(description?: string): RequiredProp<string> {
      return makeProp(parseUrl, description)
   },

   /**
    * An integer in the range 1–65535.
    */
   port(description?: string): RequiredProp<number> {
      return makeProp(parsePort, description)
   },

   /**
    * One of a fixed set of string literals.
    * Pass `as const` to get a narrowed return type:
    *   prop.enum(["a", "b"] as const) → RequiredField<"a" | "b">
    */
   enum<T extends string>(values: readonly T[], description?: string): RequiredProp<T> {
      return makeProp(parseEnum(values), description)
   },

   /**
    * A comma-separated list of non-empty strings.
    * Pass a custom separator if needed: prop.list(";")
    */
   list(separator = ",", description?: string): RequiredProp<string[]> {
      return makeProp(parseList(separator), description)
   },

   /**
    * A string that holds sensitive information and should be treated as secret.
    * @param description
    */
   secret(description?: string): RequiredProp<Secret<string>> {
      return makeProp(parseSecret, description)
   }
}
