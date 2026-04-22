import type {
   AnyProp,
   Infer,
   Schema,
   ValidationError,
   ValidationResult,
} from "./types"

// ---------------------------------------------------------------------------
// createEnv
//
// Validates `source` against `schema`, collecting all errors before returning.
// `source` defaults to process.env, but any string record can be passed —
// making this portable across runtimes and trivially testable.
// ---------------------------------------------------------------------------

/**
 * Create an environment object from the supplied schema
 * @param schema The schema of the environment to parse and validate.
 * @param source The source object containing the environment (defaults to `process.env` if it exists)
 */
export function createEnv<S extends Schema>(
   schema: S,
   source: Record<string, string | undefined> = getDefaultSource()
): ValidationResult<Infer<S>> {
   const data: Record<string, unknown> = {}
   const errors: ValidationError[] = []

   for (const key of Object.keys(schema) as (keyof S & string)[]) {
      const prop: AnyProp = schema[key]
      const raw = source[key]

      // -- Missing value -------------------------------------------------------

      if (raw === undefined || raw === "") {
         if (prop._tag === "required") {
            errors.push({ key, message: "is required but was not set" })
            continue
         }

         if (prop._tag === "defaulted") {
            data[key] = prop.fallback
            continue
         }

         // optional with no default
         data[key] = undefined

         continue
      }

      // -- Value present: attempt parse ----------------------------------------

      try {
         data[key] = prop.parse(raw)
      } catch (err) {
         const message = err instanceof Error ? err.message : String(err)
         errors.push({ key, message })
      }
   }

   if (errors.length > 0) {
      return { success: false, errors }
   }

   return { success: true, data: data as Infer<S> }
}

// ---------------------------------------------------------------------------
// Runtime portability
//
// process.env is not available in all runtimes (e.g. Cloudflare Workers).
// We fall back to an empty object so the import doesn't throw.
// ---------------------------------------------------------------------------

function getDefaultSource(): Record<string, string | undefined> {
   if (typeof process !== "undefined" && process.env) {
      return process.env
   }

   return {}
}
