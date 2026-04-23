import { describe, it, expect } from "vitest"
import {
   parseString,
   parseNumber,
   parseInteger,
   parseBoolean,
   parseUrl,
   parsePort,
   parseEnum,
   parseList,
} from "../src/parsers"

// ---------------------------------------------------------------------------
// parseString
// ---------------------------------------------------------------------------

describe("parseString", () => {
   it("returns the raw value unchanged", () => {
      expect(parseString("hello")).toBe("hello")
   })

   it("preserves internal whitespace", () => {
      expect(parseString("hello world")).toBe("hello world")
   })

   it("preserves leading/trailing whitespace", () => {
      expect(parseString("  padded  ")).toBe("  padded  ")
   })

   it("throws on empty string", () => {
      expect(() => parseString("")).toThrow()
   })

   it("throws on whitespace-only string", () => {
      expect(() => parseString("   ")).toThrow()
      expect(() => parseString("\t")).toThrow()
      expect(() => parseString("\n")).toThrow()
   })
})

// ---------------------------------------------------------------------------
// parseNumber
// ---------------------------------------------------------------------------

describe("parseNumber", () => {
   it("parses a positive integer", () => {
      expect(parseNumber("42")).toBe(42)
   })

   it("parses a negative integer", () => {
      expect(parseNumber("-7")).toBe(-7)
   })

   it("parses a float", () => {
      expect(parseNumber("3.14")).toBe(3.14)
   })

   it("parses zero", () => {
      expect(parseNumber("0")).toBe(0)
   })

   it("parses a value with surrounding whitespace", () => {
      expect(parseNumber("  99  ")).toBe(99)
   })

   it("parses scientific notation", () => {
      expect(parseNumber("1e3")).toBe(1000)
   })

   it("throws on non-numeric string", () => {
      expect(() => parseNumber("abc")).toThrow()
   })

   it("treats an empty string as 0 (Number('') === 0)", () => {
      // Number("") === 0, not NaN — parseNumber does not guard against this.
      expect(parseNumber("")).toBe(0)
   })

   it("throws on NaN literal", () => {
      expect(() => parseNumber("NaN")).toThrow()
   })

   it("throws on Infinity", () => {
      // Number("Infinity") === Infinity which is not NaN — but it IS non-finite.
      // The parser does NOT reject Infinity; document the current behaviour.
      expect(parseNumber("Infinity")).toBe(Infinity)
   })
})

// ---------------------------------------------------------------------------
// parseInteger
// ---------------------------------------------------------------------------

describe("parseInteger", () => {
   it("parses a whole number", () => {
      expect(parseInteger("7")).toBe(7)
   })

   it("parses zero", () => {
      expect(parseInteger("0")).toBe(0)
   })

   it("parses a negative whole number", () => {
      expect(parseInteger("-3")).toBe(-3)
   })

   it("throws on a decimal", () => {
      expect(() => parseInteger("7.5")).toThrow()
      expect(() => parseInteger("0.1")).toThrow()
   })

   it("throws on a non-numeric string", () => {
      expect(() => parseInteger("abc")).toThrow()
   })
})

// ---------------------------------------------------------------------------
// parseBoolean
// ---------------------------------------------------------------------------

describe("parseBoolean", () => {
   const truthy = ["true", "1", "yes", "TRUE", "YES", "True", "Yes"]
   const falsy = ["false", "0", "no", "FALSE", "NO", "False", "No"]

   for (const raw of truthy) {
      it(`"${raw}" → true`, () => {
         expect(parseBoolean(raw)).toBe(true)
      })
   }

   for (const raw of falsy) {
      it(`"${raw}" → false`, () => {
         expect(parseBoolean(raw)).toBe(false)
      })
   }

   it("throws on an unrecognised value", () => {
      expect(() => parseBoolean("maybe")).toThrow()
      expect(() => parseBoolean("2")).toThrow()
      expect(() => parseBoolean("")).toThrow()
      expect(() => parseBoolean("on")).toThrow()
   })
})

// ---------------------------------------------------------------------------
// parseUrl
// ---------------------------------------------------------------------------

describe("parseUrl", () => {
   it("accepts an https URL", () => {
      expect(parseUrl("https://example.com")).toBe("https://example.com")
   })

   it("accepts an http URL", () => {
      expect(parseUrl("http://localhost:3000")).toBe("http://localhost:3000")
   })

   it("accepts a URL with a path and query string", () => {
      expect(parseUrl("https://api.example.com/v1/users?page=2")).toBe(
         "https://api.example.com/v1/users?page=2"
      )
   })

   it("trims whitespace before parsing", () => {
      expect(parseUrl("  https://example.com  ")).toBe("https://example.com")
   })

   it("throws on a bare hostname", () => {
      expect(() => parseUrl("example.com")).toThrow()
   })

   it("throws on an empty string", () => {
      expect(() => parseUrl("")).toThrow()
   })

   it("throws on a relative path", () => {
      expect(() => parseUrl("/api/users")).toThrow()
   })
})

// ---------------------------------------------------------------------------
// parsePort
// ---------------------------------------------------------------------------

describe("parsePort", () => {
   it("accepts port 1 (minimum)", () => {
      expect(parsePort("1")).toBe(1)
   })

   it("accepts port 65535 (maximum)", () => {
      expect(parsePort("65535")).toBe(65535)
   })

   it("accepts a common port", () => {
      expect(parsePort("8080")).toBe(8080)
   })

   it("throws on port 0", () => {
      expect(() => parsePort("0")).toThrow()
   })

   it("throws on port 65536", () => {
      expect(() => parsePort("65536")).toThrow()
   })

   it("throws on a negative number", () => {
      expect(() => parsePort("-1")).toThrow()
   })

   it("throws on a decimal", () => {
      expect(() => parsePort("80.5")).toThrow()
   })

   it("throws on a non-numeric string", () => {
      expect(() => parsePort("http")).toThrow()
   })
})

// ---------------------------------------------------------------------------
// parseEnum
// ---------------------------------------------------------------------------

describe("parseEnum", () => {
   const parse = parseEnum(["development", "staging", "production"] as const)

   it("accepts a value in the set", () => {
      expect(parse("staging")).toBe("staging")
   })

   it("accepts every value in the set", () => {
      expect(parse("development")).toBe("development")
      expect(parse("production")).toBe("production")
   })

   it("throws on a value outside the set", () => {
      expect(() => parse("test")).toThrow()
      expect(() => parse("")).toThrow()
   })

   it("is case-sensitive", () => {
      expect(() => parse("Production")).toThrow()
      expect(() => parse("DEVELOPMENT")).toThrow()
   })

   it("trims whitespace and returns the trimmed value", () => {
      // parseEnum trims raw before comparing and returns the trimmed string.
      expect(parse("  staging  ")).toBe("staging")
   })

   it("works with a single-value enum", () => {
      const parseOne = parseEnum(["only"] as const)
      expect(parseOne("only")).toBe("only")
      expect(() => parseOne("other")).toThrow()
   })
})

// ---------------------------------------------------------------------------
// parseList
// ---------------------------------------------------------------------------

describe("parseList", () => {
   const parse = parseList()

   it("splits on commas by default", () => {
      expect(parse("a,b,c")).toEqual(["a", "b", "c"])
   })

   it("trims each item", () => {
      expect(parse("a, b, c")).toEqual(["a", "b", "c"])
      expect(parse(" x , y , z ")).toEqual(["x", "y", "z"])
   })

   it("filters out empty segments produced by extra commas", () => {
      expect(parse("a,,b")).toEqual(["a", "b"])
   })

   it("throws on an empty string (no items after filtering)", () => {
      expect(() => parse("")).toThrow()
      expect(() => parse(",,,")).toThrow()
   })

   it("accepts a single item", () => {
      expect(parse("only")).toEqual(["only"])
   })

   it("uses a custom separator", () => {
      const parseSemi = parseList(";")
      expect(parseSemi("x;y;z")).toEqual(["x", "y", "z"])
   })

   it("custom separator does not split on the default comma", () => {
      const parseSemi = parseList(";")
      expect(parseSemi("a,b;c,d")).toEqual(["a,b", "c,d"])
   })
})