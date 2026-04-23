import { describe, it, expect } from "vitest"
import { makeProp, prop, createEnv } from "../src/"
import { Secret } from "../src/parsers"

// ---------------------------------------------------------------------------
// makeField — state chain
// ---------------------------------------------------------------------------

describe("makeField", () => {
   const parse = (raw: string) => raw.toUpperCase()

   it("returns a RequiredField with _tag 'required'", () => {
      expect(makeProp(parse)._tag).toBe("required")
   })

   it("stores the supplied parse function", () => {
      const f = makeProp(parse)
      expect(f.parse("hello")).toBe("HELLO")
   })

   it("stores an optional description", () => {
      const f = makeProp(parse, "my description")
      expect(f.description).toBe("my description")
   })

   it("description is undefined when omitted", () => {
      expect(makeProp(parse).description).toBeUndefined()
   })

   describe(".optional()", () => {
      it("returns a field with _tag 'optional'", () => {
         expect(makeProp(parse).optional()._tag).toBe("optional")
      })

      it("carries the same parse function", () => {
         const opt = makeProp(parse).optional()
         expect(opt.parse("hi")).toBe("HI")
      })

      it("carries the description", () => {
         const opt = makeProp(parse, "desc").optional()
         expect(opt.description).toBe("desc")
      })
   })

   describe(".optional().default()", () => {
      it("returns a field with _tag 'defaulted'", () => {
         expect(makeProp(parse).optional().default("FALLBACK")._tag).toBe("defaulted")
      })

      it("stores the fallback value", () => {
         const def = makeProp(parse).optional().default("FALLBACK")
         expect(def.fallback).toBe("FALLBACK")
      })

      it("carries the same parse function", () => {
         const def = makeProp(parse).optional().default("FALLBACK")
         expect(def.parse("hi")).toBe("HI")
      })

      it("carries the description", () => {
         const def = makeProp(parse, "desc").optional().default("FALLBACK")
         expect(def.description).toBe("desc")
      })

      it("accepts a fallback that is a complex type", () => {
         const listField = makeProp((raw) => raw.split(","))
         const def = listField.optional().default(["a", "b"])
         expect(def.fallback).toEqual(["a", "b"])
      })
   })
})

// ---------------------------------------------------------------------------
// prop.string
// ---------------------------------------------------------------------------

describe("prop.string", () => {
   it("is a RequiredField", () => {
      expect(prop.string()._tag).toBe("required")
   })

   it("parse accepts a non-empty string", () => {
      expect(prop.string().parse("hello")).toBe("hello")
   })

   it("parse throws on empty input", () => {
      expect(() => prop.string().parse("")).toThrow()
   })

   it("accepts an optional description", () => {
      expect(prop.string("my key").description).toBe("my key")
   })
})

// ---------------------------------------------------------------------------
// prop.number
// ---------------------------------------------------------------------------

describe("prop.number", () => {
   it("is a RequiredField", () => {
      expect(prop.number()._tag).toBe("required")
   })

   it("parse returns a number", () => {
      expect(prop.number().parse("3.14")).toBe(3.14)
   })

   it("parse throws on non-numeric input", () => {
      expect(() => prop.number().parse("abc")).toThrow()
   })
})

// ---------------------------------------------------------------------------
// prop.integer
// ---------------------------------------------------------------------------

describe("prop.integer", () => {
   it("is a RequiredField", () => {
      expect(prop.integer()._tag).toBe("required")
   })

   it("parse returns a whole number", () => {
      expect(prop.integer().parse("10")).toBe(10)
   })

   it("parse throws on a decimal", () => {
      expect(() => prop.integer().parse("1.5")).toThrow()
   })
})

// ---------------------------------------------------------------------------
// prop.boolean
// ---------------------------------------------------------------------------

describe("prop.boolean", () => {
   it("is a RequiredField", () => {
      expect(prop.boolean()._tag).toBe("required")
   })

   it("parse returns true for 'true'", () => {
      expect(prop.boolean().parse("true")).toBe(true)
   })

   it("parse returns false for 'false'", () => {
      expect(prop.boolean().parse("false")).toBe(false)
   })

   it("parse throws on unrecognised value", () => {
      expect(() => prop.boolean().parse("maybe")).toThrow()
   })
})

// ---------------------------------------------------------------------------
// prop.url
// ---------------------------------------------------------------------------

describe("prop.url", () => {
   it("is a RequiredField", () => {
      expect(prop.url()._tag).toBe("required")
   })

   it("parse returns a valid URL string", () => {
      expect(prop.url().parse("https://example.com")).toBe("https://example.com")
   })

   it("parse throws on a bare hostname", () => {
      expect(() => prop.url().parse("example.com")).toThrow()
   })
})

// ---------------------------------------------------------------------------
// prop.port
// ---------------------------------------------------------------------------

describe("prop.port", () => {
   it("is a RequiredField", () => {
      expect(prop.port()._tag).toBe("required")
   })

   it("parse returns a number in range", () => {
      expect(prop.port().parse("8080")).toBe(8080)
   })

   it("parse throws on out-of-range values", () => {
      expect(() => prop.port().parse("0")).toThrow()
      expect(() => prop.port().parse("65536")).toThrow()
   })
})

// ---------------------------------------------------------------------------
// prop.enum
// ---------------------------------------------------------------------------

describe("prop.enum", () => {
   const values = ["a", "b", "c"] as const

   it("is a RequiredField", () => {
      expect(prop.enum(values)._tag).toBe("required")
   })

   it("parse accepts a value in the set", () => {
      expect(prop.enum(values).parse("b")).toBe("b")
   })

   it("parse throws on a value outside the set", () => {
      expect(() => prop.enum(values).parse("d")).toThrow()
   })
})

// ---------------------------------------------------------------------------
// prop.list
// ---------------------------------------------------------------------------

describe("prop.list", () => {
   it("is a RequiredField", () => {
      expect(prop.list()._tag).toBe("required")
   })

   it("parse splits on comma by default", () => {
      expect(prop.list().parse("a,b,c")).toEqual(["a", "b", "c"])
   })

   it("parse uses a custom separator when provided", () => {
      expect(prop.list(";").parse("a;b;c")).toEqual(["a", "b", "c"])
   })

   it("parse throws on an empty string", () => {
      expect(() => prop.list().parse("")).toThrow()
   })
})

// ---------------------------------------------------------------------------
// prop.secret
// ---------------------------------------------------------------------------

describe("prop.secret", () => {
   it("is a RequiredField", () => {
      expect(prop.secret()._tag).toBe("required")
   })

   it("parse returns the raw string for a non-empty value", () => {
      expect(prop.secret().parse("s3cr3t!").expose()).toBe("s3cr3t!")
   })

   it("parse throws on an empty string", () => {
      expect(() => prop.secret().parse("")).toThrow()
   })

   it("accepts an optional description", () => {
      expect(prop.secret("API key").description).toBe("API key")
   })

   it("supports .optional()", () => {
      expect(prop.secret().optional()._tag).toBe("optional")
   })

   it("supports .optional().default()", () => {
      const f = prop.secret().optional().default("fallback")
      expect(f._tag).toBe("defaulted")
      expect(f.fallback.expose()).toBe("fallback")
   })

   describe("integration with createEnv", () => {
      it("accepts a present secret value", () => {
         const r = createEnv({API_KEY: prop.secret("API key")}, {API_KEY: "abc123"})
         expect(r.success).toBe(true)
         if (!r.success) return
         expect(r.data.API_KEY.expose()).toBe("abc123")
      })

      it("rejects a missing secret", () => {
         const r = createEnv({API_KEY: prop.secret()}, {})
         expect(r.success).toBe(false)
         if (r.success === false)
            expect(r.errors[0].key).toBe("API_KEY")
      })

      it("rejects an empty-string secret", () => {
         const r = createEnv({API_KEY: prop.secret()}, {API_KEY: ""})
         expect(r.success).toBe(false)
      })

      it("uses the fallback when the secret is absent", () => {
         const r = createEnv({TOKEN: prop.secret().optional().default("default-token")}, {})
         expect(r.success).toBe(true)
         if (!r.success) return
         expect(r.data.TOKEN?.expose()).toBe("default-token")
      })
   })
})

// ---------------------------------------------------------------------------
// Secret class
// ---------------------------------------------------------------------------

describe("Secret", () => {
   it("expose() returns the original value", () => {
      const r = createEnv({API_KEY: prop.secret()}, {API_KEY: "my-password"})
      expect(r.success).toBe(true)
      if (!r.success) return
      expect(r.data.API_KEY.expose()).toBe("my-password")
   })

   it("expose() works for non-string generics", () => {
      const s = new Secret(42)
      expect(s.expose()).toBe(42)
   })

   it("toString() returns '[Secret]', not the value", () => {
      const s = new Secret("my-password")
      expect(s.toString()).toBe("[Secret]")
      expect(String(s)).toBe("[Secret]")
   })

   it("template literal coercion does not leak the value", () => {
      const s = new Secret("my-password")
      expect(`token=${s}`).toBe("token=[Secret]")
   })

   it("toJSON() returns '[Secret]' so JSON.stringify does not leak", () => {
      const s = new Secret("my-password")
      expect(JSON.stringify({key: s})).toBe('{"key":"[Secret]"}')
   })

   it("Node.js inspect custom symbol returns '[Secret]'", () => {
      const s = new Secret("my-password")
      const inspectFn = (s as unknown as Record<symbol, () => string>)[
         Symbol.for("nodejs.util.inspect.custom")
         ]
      expect(inspectFn.call(s)).toBe("[Secret]")
   })

   it("the value is not accessible as a plain property", () => {
      const s = new Secret("my-password")
      expect((s as Record<string, any>)["_value"]).toBeUndefined()
      expect(s.expose()).toBe("my-password")
   })
})