import { describe, it, expect } from "vitest"
import { makeField, prop } from "../src/"

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