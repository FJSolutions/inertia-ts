/**
 * A field that must be present in the environment.
 * The parse function throws with a descriptive message if the value is invalid.
 */
export type RequiredField<T> = {
   readonly _tag: "required"
   readonly parse: (raw: string) => T
   readonly description?: string
   readonly optional: () => OptionalField<T>
}

/**
 * A field that may be absent. Produces T | undefined when missing.
 */
export type OptionalField<T> = {
   readonly _tag: "optional"
   readonly parse: (raw: string) => T
   readonly description?: string
   readonly default: (value: T) => DefaultedField<T>
}

/**
 * An optional field with a fallback value. Always produces T — never undefined.
 */
export type DefaultedField<T> = {
   readonly _tag: "defaulted"
   readonly parse: (raw: string) => T
   readonly description?: string
   readonly fallback: T
}

/**
 * A union type representing all `field` types
 */
export type AnyField = RequiredField<unknown> | OptionalField<unknown> | DefaultedField<unknown>

/**
 * Defines an `env` validation schema type definition
 */
export type Schema = Record<string, AnyField>

type Simplify<T> = { [K in keyof T]: T[K] } & {}

/**
 * Infers a types from the `env` validation schema
 */
export type Infer<S extends Schema> = Simplify<{
   readonly [K in keyof S]:
   S[K] extends DefaultedField<infer T> ? T :
      S[K] extends OptionalField<infer T> ? T | undefined :
         S[K] extends RequiredField<infer T> ? T :
            never
}>

/**
 * The definition of an `env` validation error
 */
export type ValidationError = {
   readonly key: string
   readonly message: string
}

/**
 * Represents the result of validating the current `env`
 */
export type ValidationResult<T> =
   | { readonly success: true; readonly data: T }
   | { readonly success: false; readonly errors: readonly ValidationError[] }
