import { describe, it, expect } from "vitest"
import { makeField, fields } from "../src/fields"

// ---------------------------------------------------------------------------
// makeField — state chain
// ---------------------------------------------------------------------------

describe("makeField", () => {
  const parse = (raw: string) => raw.toUpperCase()

  it("returns a RequiredField with _tag 'required'", () => {
    expect(makeField(parse)._tag).toBe("required")
  })

  it("stores the supplied parse function", () => {
    const f = makeField(parse)
    expect(f.parse("hello")).toBe("HELLO")
  })

  it("stores an optional description", () => {
    const f = makeField(parse, "my description")
    expect(f.description).toBe("my description")
  })

  it("description is undefined when omitted", () => {
    expect(makeField(parse).description).toBeUndefined()
  })

  describe(".optional()", () => {
    it("returns a field with _tag 'optional'", () => {
      expect(makeField(parse).optional()._tag).toBe("optional")
    })

    it("carries the same parse function", () => {
      const opt = makeField(parse).optional()
      expect(opt.parse("hi")).toBe("HI")
    })

    it("carries the description", () => {
      const opt = makeField(parse, "desc").optional()
      expect(opt.description).toBe("desc")
    })
  })

  describe(".optional().default()", () => {
    it("returns a field with _tag 'defaulted'", () => {
      expect(makeField(parse).optional().default("FALLBACK")._tag).toBe("defaulted")
    })

    it("stores the fallback value", () => {
      const def = makeField(parse).optional().default("FALLBACK")
      expect(def.fallback).toBe("FALLBACK")
    })

    it("carries the same parse function", () => {
      const def = makeField(parse).optional().default("FALLBACK")
      expect(def.parse("hi")).toBe("HI")
    })

    it("carries the description", () => {
      const def = makeField(parse, "desc").optional().default("FALLBACK")
      expect(def.description).toBe("desc")
    })

    it("accepts a fallback that is a complex type", () => {
      const listField = makeField((raw) => raw.split(","))
      const def = listField.optional().default(["a", "b"])
      expect(def.fallback).toEqual(["a", "b"])
    })
  })
})

// ---------------------------------------------------------------------------
// fields.string
// ---------------------------------------------------------------------------

describe("fields.string", () => {
  it("is a RequiredField", () => {
    expect(fields.string()._tag).toBe("required")
  })

  it("parse accepts a non-empty string", () => {
    expect(fields.string().parse("hello")).toBe("hello")
  })

  it("parse throws on empty input", () => {
    expect(() => fields.string().parse("")).toThrow()
  })

  it("accepts an optional description", () => {
    expect(fields.string("my key").description).toBe("my key")
  })
})

// ---------------------------------------------------------------------------
// fields.number
// ---------------------------------------------------------------------------

describe("fields.number", () => {
  it("is a RequiredField", () => {
    expect(fields.number()._tag).toBe("required")
  })

  it("parse returns a number", () => {
    expect(fields.number().parse("3.14")).toBe(3.14)
  })

  it("parse throws on non-numeric input", () => {
    expect(() => fields.number().parse("abc")).toThrow()
  })
})

// ---------------------------------------------------------------------------
// fields.integer
// ---------------------------------------------------------------------------

describe("fields.integer", () => {
  it("is a RequiredField", () => {
    expect(fields.integer()._tag).toBe("required")
  })

  it("parse returns a whole number", () => {
    expect(fields.integer().parse("10")).toBe(10)
  })

  it("parse throws on a decimal", () => {
    expect(() => fields.integer().parse("1.5")).toThrow()
  })
})

// ---------------------------------------------------------------------------
// fields.boolean
// ---------------------------------------------------------------------------

describe("fields.boolean", () => {
  it("is a RequiredField", () => {
    expect(fields.boolean()._tag).toBe("required")
  })

  it("parse returns true for 'true'", () => {
    expect(fields.boolean().parse("true")).toBe(true)
  })

  it("parse returns false for 'false'", () => {
    expect(fields.boolean().parse("false")).toBe(false)
  })

  it("parse throws on unrecognised value", () => {
    expect(() => fields.boolean().parse("maybe")).toThrow()
  })
})

// ---------------------------------------------------------------------------
// fields.url
// ---------------------------------------------------------------------------

describe("fields.url", () => {
  it("is a RequiredField", () => {
    expect(fields.url()._tag).toBe("required")
  })

  it("parse returns a valid URL string", () => {
    expect(fields.url().parse("https://example.com")).toBe("https://example.com")
  })

  it("parse throws on a bare hostname", () => {
    expect(() => fields.url().parse("example.com")).toThrow()
  })
})

// ---------------------------------------------------------------------------
// fields.port
// ---------------------------------------------------------------------------

describe("fields.port", () => {
  it("is a RequiredField", () => {
    expect(fields.port()._tag).toBe("required")
  })

  it("parse returns a number in range", () => {
    expect(fields.port().parse("8080")).toBe(8080)
  })

  it("parse throws on out-of-range values", () => {
    expect(() => fields.port().parse("0")).toThrow()
    expect(() => fields.port().parse("65536")).toThrow()
  })
})

// ---------------------------------------------------------------------------
// fields.enum
// ---------------------------------------------------------------------------

describe("fields.enum", () => {
  const values = ["a", "b", "c"] as const

  it("is a RequiredField", () => {
    expect(fields.enum(values)._tag).toBe("required")
  })

  it("parse accepts a value in the set", () => {
    expect(fields.enum(values).parse("b")).toBe("b")
  })

  it("parse throws on a value outside the set", () => {
    expect(() => fields.enum(values).parse("d")).toThrow()
  })
})

// ---------------------------------------------------------------------------
// fields.list
// ---------------------------------------------------------------------------

describe("fields.list", () => {
  it("is a RequiredField", () => {
    expect(fields.list()._tag).toBe("required")
  })

  it("parse splits on comma by default", () => {
    expect(fields.list().parse("a,b,c")).toEqual(["a", "b", "c"])
  })

  it("parse uses a custom separator when provided", () => {
    expect(fields.list(";").parse("a;b;c")).toEqual(["a", "b", "c"])
  })

  it("parse throws on an empty string", () => {
    expect(() => fields.list().parse("")).toThrow()
  })
})