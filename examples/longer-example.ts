import { createEnv, group, makeProp, prop, Infer } from "../src"
import { parseString } from "../src/parsers"

// ---------------------------------------------------------------------------
// 1. Define a schema
//    - prop.*       built-in parsers
//    - makeProp()   custom parser escape hatch
//    - group()      nest related props into a sub-object
//    - .optional()  value may be absent → T | undefined
//    - .default()   absent value uses fallback → always T
// ---------------------------------------------------------------------------

const schema = {
   // Built-in string types
   APP_NAME:      prop.string("Human-readable application name"),
   APP_URL:       prop.url("Publicly accessible base URL"),
   NODE_ENV:      prop.enum(["development", "staging", "production"] as const),
   ALLOWED_HOSTS: prop.list(",", "Comma-separated list of allowed hostnames").optional(),

   // Numeric types
   PORT:          prop.port().optional().default(3000),
   TIMEOUT_MS:    prop.integer("Request timeout in milliseconds").optional().default(5000),
   SAMPLE_RATE:   prop.number("Metrics sample rate (0–1)").optional().default(1),

   // Flags
   ENABLE_CACHE:  prop.boolean().optional().default(false),
   DEBUG:         prop.boolean().optional().default(false),

   // Secrets — value is wrapped in Secret<T>, only accessible via .expose()
   API_KEY:       prop.secret("Third-party API key"),
   DB_PASSWORD:   prop.secret("Database password"),
   ADMIN_PORT:    prop.secret("Admin port stored as a secret number", parseInt),

   // Custom parser via makeProp
   RETRY_DELAY_MS: makeProp((raw) => {
      const n = Number(raw)
      if (Number.isNaN(n) || n < 0) throw new Error("must be a non-negative number")
      return n
   }, "Delay in ms between retries"),

   // Groups — env var names stay flat, output is nested
   db: group({
      DB_HOST:    prop.string("Database hostname"),
      DB_PORT:    prop.port().optional().default(5432),
      DB_NAME:    prop.string("Database name"),
      DB_SSL:     prop.boolean("Require SSL").optional().default(true),
   }),

   redis: group({
      REDIS_HOST: prop.string("Redis hostname"),
      REDIS_PORT: prop.port().optional().default(6379),
   }),
}

// Infer the fully-typed config shape from the schema
type Config = Infer<typeof schema>

// ---------------------------------------------------------------------------
// 2. Validate against an env source
// ---------------------------------------------------------------------------

const result = createEnv(schema, {
   APP_NAME:       "My App",
   APP_URL:        "https://app.example.com",
   NODE_ENV:       "production",
   ALLOWED_HOSTS:  "app.example.com,api.example.com",
   PORT:           "8080",
   ENABLE_CACHE:   "true",
   API_KEY:        "sk-abc-123",
   DB_PASSWORD:    "hunter2",
   ADMIN_PORT:     "9000",
   RETRY_DELAY_MS: "500",
   DB_HOST:        "db.example.com",
   DB_NAME:        "myapp_prod",
   REDIS_HOST:     "redis.example.com",
   // DB_PORT, DB_SSL, REDIS_PORT, TIMEOUT_MS, SAMPLE_RATE, DEBUG → use defaults
   // ALLOWED_HOSTS is optional — present here but would be undefined if omitted
})

// ---------------------------------------------------------------------------
// 3. The caller decides what to do on failure
// ---------------------------------------------------------------------------

if (!result.success) {
   console.error("Environment validation failed:")
   for (const error of result.errors) {
      console.error(`  ${error.key}: ${error.message}`)
   }
   process.exit(1)
}

// ---------------------------------------------------------------------------
// 4. Use the fully-typed config
// ---------------------------------------------------------------------------

const config: Config = result.data

// Primitive props
config.APP_NAME        // string
config.APP_URL         // string
config.NODE_ENV        // "development" | "staging" | "production"
config.ALLOWED_HOSTS   // string[] | undefined
config.PORT            // number  (never undefined — has a default)
config.TIMEOUT_MS      // number
config.SAMPLE_RATE     // number
config.ENABLE_CACHE    // boolean
config.DEBUG           // boolean
config.RETRY_DELAY_MS  // number

// Secrets — must call .expose() to access the value
config.API_KEY.expose()     // string
config.DB_PASSWORD.expose() // string
config.ADMIN_PORT.expose()  // number  (inner parser was parseInt)

// Secrets never leak via logging
console.log(config.API_KEY)              // [Secret]
console.log(`key=${config.API_KEY}`)     // key=[Secret]
JSON.stringify({ key: config.API_KEY })  // {"key":"[Secret]"}

// Grouped props — accessed via sub-object
config.db.DB_HOST   // string
config.db.DB_PORT   // number  (default: 5432)
config.db.DB_NAME   // string
config.db.DB_SSL    // boolean (default: true)

config.redis.REDIS_HOST  // string
config.redis.REDIS_PORT  // number  (default: 6379)
