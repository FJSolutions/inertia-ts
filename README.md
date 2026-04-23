# Inertia-TS

A library to validate and parse the environment into a state object. The
name inertia came from the idea of creating a type-safe validated snapshot of
the state of the environment at the start-up of and application. Validating both
the presence and shape (type) of supplied environment variables.

The `intertia-ts` package validates the presence and content of environment
variables. It does not set the environment but does read it for the values
defined in a schema object.

- [Quick start](#quick-start)
   - [Secrets](#secret-props)
   - [Grouping](#groups)
- [Best practices](#best-practices)
- [Full example](#a-longer-example)

## Quick start

Create a `env.ts` file in the TypeScript root of your project and then call it
from your `main.ts` file after you have loaded variables into `provess.env`
using `dotenv` or another mechanism.

```ts

// Create the schema
const schema = {
   DB_URL: prop.url("postgres connection string"),
   DB_PORT: prop.port().optional().default(3330),
   API_URL: prop.url("URL of the API").optional(),
}

// Parse `process.env` (by default)
const result = createEnv(schema)

// Check if there are any errors and throw them
if (result.success === false) {
   throw result.errors
}

// Create a strongly-typed const to export
const env: Infer<typeof schema> = result.data
```

There are schema `prop`s for:

- string
- number
- integer
- boolean
- url
- port
- enum
- list

### Secret props

Sometimes you have values that you don't want to accidentally leak onto the
console or into logs; this is when the secret `prop` comes in handy.

There is a `secret` method on `prop` which works slightly differently to the
other property functions.

```ts
const source = {NAME: "Name", AGE: "42", PIN: "12345"}
const schema = {
   NAME: prop.string(),
   AGE: prop.integer(),
   PIN: prop.secret(),
}
const result = createEnv(schema, source)

if (result.success) {
   // Now we get type inference for a successful validation result
   // result.data.NAME === "Name"
   // result.data.AGE === 42
   // result.data.PIN === "[Secret]"
   // result.data.PIN.expose() === "12345"
}
```

If you want the secret to be a different type, then you supply the parser as a
parameter to the `secret` function:

```ts
const source = {NAME: "Name", AGE: "42", PIN: "12345"}
const schema = {
   NAME: prop.string(),
   AGE: prop.integer(),
   PIN: prop.secret("API", parseInteger),
}
const result = createEnv(schema, source)

if (result.success) {
   /* Now we get type inference for a successful validation result */
   // result.data.NAME === "Name"
   // result.data.AGE === 42
   // result.data.PIN === "[Secret]"
   // result.data.PIN.expose() === 12345
}
```

As it is the second optional parameter of the function, you have to supply a
description first (this is a best practice anyway). Now the `Secret` holds a
`number`.

### Groups

If you have a lot of environment properties it can be helpful to organise them
into groups. A group looks like a sub-object within the schema, and that is how
it is output in the `result.data` after calling `createEnv`.

```ts
const validationResult = createEnv(
   {
      db: group({
         DB_HOST: prop.string(),
         DB_PASSWORD: prop.secret(),
         DB_PORT: prop.port().optional().default(5432)
      })
   },
   {DB_HOST: "localhost", DB_PASSWORD: "password"}
)

// validationResult.success === true
// validationResult.data.db.DB_HOST === "localhost"
// validationResult.data.db.DB_PASSWORD === "[Secret]"
// validationResult.data.db.DB_PASSWORD.expose() === "password"
// validationResult.data.db.DB_PORT === 5432
```

Notice the group names in the output

## Best practices

- Give all your properties descriptions &ndash; it will help when you're trying
  to find which one hasn't been set!

## A longer example

For more example code look in the `examples` directory.
