import { describe, it, expect } from "vitest"
import { createEnv, fields, Infer, makeField, Schema } from "../src"

// ---------------------------------------------------------------------------
// Manual testing: type inference
// ---------------------------------------------------------------------------

describe("manual createEnv", () => {
   it("should create a failing env validation", () => {
      const schema = {NOT_THERE: fields.string()}
      const result = createEnv(schema)
      expect(result.success).toBe(false)
      if (result.success === false) {
         expect(result.errors.length).toBeGreaterThan(0)
      }
   })

   it("should create a successful env validation", () => {
      // Must NOT type this object in order for the type inference to work
      const schema = {NAME: fields.string(), AGE: fields.integer()}
      // This type is the object that is created from validator
      type Person = Infer<typeof schema>
      // Create the env object
      const result = createEnv(schema, {NAME: "Francis", AGE: "60"})
      expect(result.success).toBe(true)
      // For TS to correctly infer the type narrowing of the result this must be an explicit check to a boolean
      if (result.success === true) {
         const p: Person = result.data
         expect(p.NAME).toBe("Francis")
         expect(p.AGE).toBe(60)
      }
   })
})

// ---------------------------------------------------------------------------
// Invariant: result shape
// ---------------------------------------------------------------------------

describe("createEnv result shape", () => {
   it("returns { success: true, data } on a valid source", () => {
      const result = createEnv({KEY: fields.string()}, {KEY: "hello"})
      expect(result.success).toBe(true)
      if (result.success === true)
         expect(result.data.KEY).toBe("hello")
   })

   it("returns { success: false, errors } on an invalid source", () => {
      const result = createEnv({KEY: fields.string()}, {})
      expect(result.success).toBe(false)
      if (result.success === false)
         expect(result.errors.length).toBeGreaterThan(0)
   })

   it("error shape has key and message", () => {
      const result = createEnv({MY_KEY: fields.string()}, {})
      expect(result.success).toBe(false)
      if (result.success === false)
         expect(result.errors[0]).toMatchObject({key: "MY_KEY", message: expect.any(String)})
   })
})

// ---------------------------------------------------------------------------
// Required fields
// ---------------------------------------------------------------------------

describe("required fields", () => {
   it("accepts a present value", () => {
      const r = createEnv({KEY: fields.string()}, {KEY: "value"})
      expect(r.success).toBe(true)
   })

   it("rejects a missing key", () => {
      const r = createEnv({KEY: fields.string()}, {})
      expect(r.success).toBe(false)
      if (r.success === false)
         expect(r.errors[0].key).toBe("KEY")
   })

   it("treats an empty-string value as missing", () => {
      const r = createEnv({KEY: fields.string()}, {KEY: ""})
      expect(r.success).toBe(false)
      if (r.success === false)
         expect(r.errors[0].key).toBe("KEY")
   })
})

// ---------------------------------------------------------------------------
// Optional fields
// ---------------------------------------------------------------------------

describe("optional fields", () => {
   it("produces undefined for a missing key", () => {
      const r = createEnv({KEY: fields.string().optional()}, {})
      expect(r.success).toBe(true)
      if (!r.success) return
      expect(r.data.KEY).toBeUndefined()
   })

   it("produces undefined for an empty-string value", () => {
      const r = createEnv({KEY: fields.string().optional()}, {KEY: ""})
      expect(r.success).toBe(true)
      if (!r.success) return
      expect(r.data.KEY).toBeUndefined()
   })

   it("parses the value when it is present", () => {
      const r = createEnv({PORT: fields.number().optional()}, {PORT: "42"})
      expect(r.success).toBe(true)
      if (!r.success) return
      expect(r.data.PORT).toBe(42)
   })

   it("still validates the value when present", () => {
      const r = createEnv({PORT: fields.number().optional()}, {PORT: "not-a-number"})
      expect(r.success).toBe(false)
   })
})

// ---------------------------------------------------------------------------
// Defaulted fields
// ---------------------------------------------------------------------------

describe("defaulted fields", () => {
   it("uses the fallback when the key is missing", () => {
      const r = createEnv({PORT: fields.port().optional().default(3000)}, {})
      expect(r.success).toBe(true)
      if (!r.success) return
      expect(r.data.PORT).toBe(3000)
   })

   it("uses the fallback when the value is an empty string", () => {
      const r = createEnv({PORT: fields.port().optional().default(3000)}, {PORT: ""})
      expect(r.success).toBe(true)
      if (!r.success) return
      expect(r.data.PORT).toBe(3000)
   })

   it("parses the live value instead of using the fallback when present", () => {
      const r = createEnv({PORT: fields.port().optional().default(3000)}, {PORT: "8080"})
      expect(r.success).toBe(true)
      if (!r.success) return
      expect(r.data.PORT).toBe(8080)
   })

   it("still validates the live value even though a fallback exists", () => {
      const r = createEnv({PORT: fields.port().optional().default(3000)}, {PORT: "99999"})
      expect(r.success).toBe(false)
   })

   it("supports a falsy fallback (false)", () => {
      const r = createEnv({FLAG: fields.boolean().optional().default(false)}, {})
      expect(r.success).toBe(true)
      if (!r.success) return
      expect(r.data.FLAG).toBe(false)
   })

   it("supports a falsy fallback (0)", () => {
      const r = createEnv({N: fields.number().optional().default(0)}, {})
      expect(r.success).toBe(true)
      if (!r.success) return
      expect(r.data.N).toBe(0)
   })
})

// ---------------------------------------------------------------------------
// Error accumulation — all errors collected before returning
// ---------------------------------------------------------------------------

describe("error accumulation", () => {
   it("collects errors from every failing field", () => {
      const r = createEnv(
         {A: fields.string(), B: fields.number(), C: fields.boolean()},
         {}
      )
      expect(r.success).toBe(false)
      if (r.success === false) {
         expect(r.errors).toHaveLength(3)
         expect(r.errors.map(e => e.key)).toEqual(expect.arrayContaining(["A", "B", "C"]))
      }
   })

   it("does not short-circuit on the first error", () => {
      const r = createEnv(
         {PORT: fields.port(), URL: fields.url()},
         {PORT: "bad", URL: "bad"}
      )
      expect(r.success).toBe(false)
      if (r.success === false)
         expect(r.errors).toHaveLength(2)
   })

   it("reports only the failing fields, not the passing ones", () => {
      const r = createEnv(
         {GOOD: fields.string(), BAD: fields.number()},
         {GOOD: "ok", BAD: "nope"}
      )
      expect(r.success).toBe(false)
      if (r.success === false) {
         expect(r.errors).toHaveLength(1)
         expect(r.errors[0].key).toBe("BAD")
      }
   })
})

// ---------------------------------------------------------------------------
// Mixed schema
// ---------------------------------------------------------------------------

describe("mixed schema", () => {
   const schema = {
      HOST: fields.url(),
      PORT: fields.port().optional().default(3000),
      DEBUG: fields.boolean().optional(),
      ENV: fields.enum(["dev", "prod"] as const),
      TAGS: fields.list().optional(),
   }

   it("succeeds with all required fields supplied", () => {
      const r = createEnv(schema, {
         HOST: "https://example.com",
         ENV: "prod",
      })
      expect(r.success).toBe(true)
      if (!r.success) return
      expect(r.data.HOST).toBe("https://example.com")
      expect(r.data.PORT).toBe(3000)
      expect(r.data.DEBUG).toBeUndefined()
      expect(r.data.ENV).toBe("prod")
      expect(r.data.TAGS).toBeUndefined()
   })

   it("succeeds with all fields supplied", () => {
      const r = createEnv(schema, {
         HOST: "https://api.example.com",
         PORT: "8080",
         DEBUG: "true",
         ENV: "dev",
         TAGS: "a,b,c",
      })
      expect(r.success).toBe(true)
      if (!r.success) return
      expect(r.data.PORT).toBe(8080)
      expect(r.data.DEBUG).toBe(true)
      expect(r.data.TAGS).toEqual(["a", "b", "c"])
   })

   it("fails when a required field is absent", () => {
      const r = createEnv(schema, {PORT: "4000"})
      expect(r.success).toBe(false)
      if (r.success === false) {
         const keys = r.errors.map(e => e.key)
         expect(keys).toContain("HOST")
         expect(keys).toContain("ENV")
      }
   })
})

// ---------------------------------------------------------------------------
// Custom fields via makeField
// ---------------------------------------------------------------------------

describe("custom fields via makeField", () => {
   const nonNegative = makeField((raw) => {
      const n = Number(raw)
      if (Number.isNaN(n) || n < 0) throw new Error("must be a non-negative number")
      return n
   })

   it("accepts valid input", () => {
      const r = createEnv({DELAY: nonNegative}, {DELAY: "100"})
      expect(r.success).toBe(true)
      if (!r.success) return
      expect(r.data.DELAY).toBe(100)
   })

   it("rejects invalid input and surfaces the parse error message", () => {
      const r = createEnv({DELAY: nonNegative}, {DELAY: "-5"})
      expect(r.success).toBe(false)
      if (r.success === false) {
         expect(r.errors[0].key).toBe("DELAY")
         expect(r.errors[0].message).toMatch(/non-negative/)
      }
   })

   it("can be made optional with a default", () => {
      const r = createEnv({DELAY: nonNegative.optional().default(0)}, {})
      expect(r.success).toBe(true)
      if (!r.success) return
      expect(r.data.DELAY).toBe(0)
   })
})

// ---------------------------------------------------------------------------
// Portability: custom source
// ---------------------------------------------------------------------------

describe("custom source", () => {
   it("reads from the supplied object, not process.env", () => {
      const r = createEnv({KEY: fields.string()}, {KEY: "from-custom"})
      expect(r.success).toBe(true)
      if (!r.success) return
      expect(r.data.KEY).toBe("from-custom")
   })

   it("does not read extra keys from process.env when a custom source is given", () => {
      process.env["SHOULD_NOT_BE_READ"] = "injected"
      const r = createEnv({SHOULD_NOT_BE_READ: fields.string()}, {})
      delete process.env["SHOULD_NOT_BE_READ"]
      // custom source ({}) does not contain the key → should fail
      expect(r.success).toBe(false)
   })

   it("accepts an empty object as source (no env at all)", () => {
      const r = createEnv({}, {})
      expect(r.success).toBe(true)
      if (!r.success) return
      expect(r.data).toEqual({})
   })
})

// ---------------------------------------------------------------------------
// Schema key ordering
// ---------------------------------------------------------------------------

describe("schema key ordering", () => {
   it("preserves all keys in the result data", () => {
      const r = createEnv(
         {Z: fields.string(), A: fields.string(), M: fields.string()},
         {Z: "z", A: "a", M: "m"}
      )
      expect(r.success).toBe(true)
      if (!r.success) return
      expect(r.data.Z).toBe("z")
      expect(r.data.A).toBe("a")
      expect(r.data.M).toBe("m")
   })
})
