import { createEnv, Infer, prop } from "../src"

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

export { env }

