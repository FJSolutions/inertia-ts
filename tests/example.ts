import { createEnv, fields, makeField } from "../src"

// ---------------------------------------------------------------------------
// 1. Define a schema
// ---------------------------------------------------------------------------

const schema = {
   DATABASE_URL: fields.url("Postgres connection string"),
   PORT: fields.port().optional().default(3000),
   NODE_ENV: fields.enum(["development", "staging", "production"] as const),
   ENABLE_CACHE: fields.boolean().optional().default(false),
   ALLOWED_HOSTS: fields.list(",", "Comma-separated list of allowed hostnames").optional(),
   API_KEY: fields.string("Secret API key"),

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
