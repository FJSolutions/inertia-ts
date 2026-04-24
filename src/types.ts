import type { Secret } from "./parsers"

/**
 * A field that must be present in the environment.
 * The parse function throws with a descriptive message if the value is invalid.
 */
export type RequiredProp<T> = {
   readonly _tag: "required"
   readonly parse: (raw: string) => T
   readonly description?: string
   readonly optional: () => OptionalProp<T>
}

/**
 * A field that may be absent. Produces T | undefined when missing.
 */
export type OptionalProp<T> = {
   readonly _tag: "optional"
   readonly parse: (raw: string) => T
   readonly description?: string
   readonly default: (value: T) => DefaultedProp<T>
}

/**
 * An optional field with a fallback value. Always produces T — never undefined.
 */
export type DefaultedProp<T> = {
   readonly _tag: "defaulted"
   readonly parse: (raw: string) => T
   readonly description?: string
   readonly fallback: T
}

/**
 * Like OptionalProp<Secret<T>> but .default() accepts the unwrapped T,
 * so callers never need to construct a Secret manually.
 */
export type SecretOptionalProp<T> = {
   readonly _tag: "optional"
   readonly parse: (raw: string) => Secret<T>
   readonly description?: string
   readonly default: (value: T) => DefaultedProp<Secret<T>>
}

/**
 * Like RequiredProp<Secret<T>> but .optional() returns SecretOptionalProp<T>.
 */
export type SecretRequiredProp<T> = {
   readonly _tag: "required"
   readonly parse: (raw: string) => Secret<T>
   readonly description?: string
   readonly optional: () => SecretOptionalProp<T>
}

/**
 * A union type representing all `field` types
 */
export type AnyProp = RequiredProp<any> | OptionalProp<any> | DefaultedProp<any> | SecretRequiredProp<any> | SecretOptionalProp<any>

/**
 * A group of props that will be nested under a sub-object in the output.
 */
export type GroupProp<S extends Schema> = {
   readonly _tag: "group"
   readonly props: S
}

/**
 * Defines an `env` validation schema type definition
 */
export type Schema = Record<string, AnyProp | GroupProp<any>>

type Simplify<T> = { [K in keyof T]: T[K] } & {}

/**
 * Infers a types from the `env` validation schema
 */
export type Infer<S extends Schema> = Simplify<{
   readonly [K in keyof S]:
   S[K] extends GroupProp<infer G extends Schema> ? Infer<G> :
   S[K] extends DefaultedProp<infer T> ? T :
   S[K] extends SecretOptionalProp<infer T> ? Secret<T> | undefined :
   S[K] extends OptionalProp<infer T> ? T | undefined :
   S[K] extends SecretRequiredProp<infer T> ? Secret<T> :
   S[K] extends RequiredProp<infer T> ? T :
   never
}>

/**
 * The definition of an `env` validation error
 */
export type ValidationError = {
   readonly key: string
   readonly message: string
   readonly description?: string
}

/**
 * Represents the result of validating the current `env`
 */
export type ValidationResult<T> =
   | { readonly success: true; readonly data: T }
   | { readonly success: false; readonly errors: readonly ValidationError[] }
