/**
 * A field that must be present in the environment.
 * The parse function throws with a descriptive message if the value is invalid.
 */
type RequiredProp<T> = {
    readonly _tag: "required";
    readonly parse: (raw: string) => T;
    readonly description?: string;
    readonly optional: () => OptionalProp<T>;
};
/**
 * A field that may be absent. Produces T | undefined when missing.
 */
type OptionalProp<T> = {
    readonly _tag: "optional";
    readonly parse: (raw: string) => T;
    readonly description?: string;
    readonly default: (value: T) => DefaultedProp<T>;
};
/**
 * An optional field with a fallback value. Always produces T — never undefined.
 */
type DefaultedProp<T> = {
    readonly _tag: "defaulted";
    readonly parse: (raw: string) => T;
    readonly description?: string;
    readonly fallback: T;
};
/**
 * A union type representing all `field` types
 */
type AnyProp = RequiredProp<any> | OptionalProp<any> | DefaultedProp<any>;
/**
 * Defines an `env` validation schema type definition
 */
type Schema = Record<string, AnyProp>;
type Simplify<T> = {
    [K in keyof T]: T[K];
} & {};
/**
 * Infers a types from the `env` validation schema
 */
type Infer<S extends Schema> = Simplify<{
    readonly [K in keyof S]: S[K] extends DefaultedProp<infer T> ? T : S[K] extends OptionalProp<infer T> ? T | undefined : S[K] extends RequiredProp<infer T> ? T : never;
}>;
/**
 * The definition of an `env` validation error
 */
type ValidationError = {
    readonly key: string;
    readonly message: string;
};
/**
 * Represents the result of validating the current `env`
 */
type ValidationResult<T> = {
    readonly success: true;
    readonly data: T;
} | {
    readonly success: false;
    readonly errors: readonly ValidationError[];
};

declare function makeProp<T>(parse: (raw: string) => T, description?: string): RequiredProp<T>;
declare const prop: {
    /**
     * A non-empty string.
     */
    string(description?: string): RequiredProp<string>;
    /**
     * Any finite number.
     */
    number(description?: string): RequiredProp<number>;
    /**
     * A whole number (no decimals).
     */
    integer(description?: string): RequiredProp<number>;
    /**
     * true/false, 1/0, yes/no (case-insensitive).
     */
    boolean(description?: string): RequiredProp<boolean>;
    /**
     * A fully-qualified URL (parsed with the WHATWG URL constructor).
     */
    url(description?: string): RequiredProp<string>;
    /**
     * An integer in the range 1–65535.
     */
    port(description?: string): RequiredProp<number>;
    /**
     * One of a fixed set of string literals.
     * Pass `as const` to get a narrowed return type:
     *   prop.enum(["a", "b"] as const) → RequiredField<"a" | "b">
     */
    enum<T extends string>(values: readonly T[], description?: string): RequiredProp<T>;
    /**
     * A comma-separated list of non-empty strings.
     * Pass a custom separator if needed: prop.list(";")
     */
    list(separator?: string, description?: string): RequiredProp<string[]>;
    /**
     * A string that holds sensitive information and should be treated as secret.
     * @param description
     */
    secret(description?: string): RequiredProp<string>;
};

/**
 * Create an environment object from the supplied schema
 * @param schema The schema of the environment to parse and validate.
 * @param source The source object containing the environment (defaults to `process.env` if it exists)
 */
declare function createEnv<S extends Schema>(schema: S, source?: Record<string, string | undefined>): ValidationResult<Infer<S>>;

export { type AnyProp, type DefaultedProp, type Infer, type OptionalProp, type RequiredProp, type Schema, type ValidationError, type ValidationResult, createEnv, makeProp, prop };
