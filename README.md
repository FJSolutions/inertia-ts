# Inertia-TS

A library to validate and parse the environment into a state object. The
name inertia came from the idea of creating a type-safe validated snapshot of
the state of the environment at the start-up of and application. Validating both
the presence and shape (type) of supplied environment variables.

The `intertia-ts` package validates the presence and content of environment
variables. It does not set the environment but does read it for the values
defined in a schema object.

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

## A longer example

The following is a more detailed example:

```ts
import { createEnv, prop, makeField } from "../src"

// ---------------------------------------------------------------------------
// 1. Define the schema
// ---------------------------------------------------------------------------

const schema = {
   DATABASE_URL: prop.url("Postgres connection string"),
   PORT: prop.port().optional().default(3000),
   NODE_ENV: prop.enum(["development", "staging", "production"] as const),
   ENABLE_CACHE: prop.boolean().optional().default(false),
   ALLOWED_HOSTS: prop.list(",", "Comma-separated list of allowed hostnames").optional(),
   API_KEY: prop.string("Secret API key"),

   // Custom field — any parse function works
   RETRY_DELAY_MS: makeField((raw) => {
      const n = Number(raw)
      if (Number.isNaN(n) || n < 0) throw new Error("must be a non-negative number")
      return n
   }, "Delay in ms between retries"),
}

// ---------------------------------------------------------------------------
// 2. Validate against an env source
// ---------------------------------------------------------------------------

const result = createEnv(schema, {
   DATABASE_URL: "https://db.example.com/mydb",
   NODE_ENV: "production",
   API_KEY: "secret-abc-123",
   RETRY_DELAY_MS: "500",
   // PORT, ENABLE_CACHE → use defaults
   // ALLOWED_HOSTS → optional, will be undefined
})

// ---------------------------------------------------------------------------
// 3. The caller decides what to do on failure
// ---------------------------------------------------------------------------

if (!result.success) {
   // @ts-ignore
   for (const error of result.errors) {
      console.error(`  ${error.key}: ${error.message}`)
   }
   process.exit(1)
}

// result.data is fully typed — hover over these in your editor:
const config = result.data

config.DATABASE_URL   // string
config.PORT           // number  (never undefined — has a default)
config.NODE_ENV       // "development" | "staging" | "production"
config.ENABLE_CACHE   // boolean (never undefined — has a default)
config.ALLOWED_HOSTS  // string[] | undefined
config.API_KEY        // string
config.RETRY_DELAY_MS // number

```

For more example code look in the `examples` directory.
