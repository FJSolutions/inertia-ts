import { describe, it, expect } from "vitest"
import { createEnv, prop, formatEnvError } from "../src"

// Helpers for building a known failed result without going through createEnv
const failed = (errors: { key: string; message: string }[]) =>
   ({ success: false as const, errors })

const ANSI_RE = /\x1b\[[0-9;]*m/g

const strip = (s: string) => s.replace(ANSI_RE, "")

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------

describe("formatEnvError — header", () => {
   const result = failed([{ key: "API_KEY", message: "is required but was not set" }])

   it("includes the app title", () => {
      expect(strip(formatEnvError("MyApp", result))).toContain("MyApp")
   })

   it("includes a fixed error label", () => {
      expect(strip(formatEnvError("MyApp", result))).toContain("Environment Configuration Error")
   })

   it("includes a separator line", () => {
      const output = strip(formatEnvError("MyApp", result))
      expect(output).toMatch(/─+/)
   })

   it("the separator is at least as wide as the heading", () => {
      const output = strip(formatEnvError("MyApp", result))
      const lines = output.split("\n")
      const barLine = lines.find(l => /^─+$/.test(l.trim()))
      const headingLine = lines.find(l => l.includes("MyApp") && l.includes("Environment"))
      expect(barLine).toBeDefined()
      expect(headingLine).toBeDefined()
      expect(barLine!.trim().length).toBeGreaterThanOrEqual(headingLine!.trim().length)
   })
})

// ---------------------------------------------------------------------------
// Optional description
// ---------------------------------------------------------------------------

describe("formatEnvError — description option", () => {
   const result = failed([{ key: "DB_URL", message: "is required but was not set" }])

   it("includes the description when provided", () => {
      const output = strip(formatEnvError("MyApp", result, { description: "Check your .env file." }))
      expect(output).toContain("Check your .env file.")
   })

   it("omits the description when not provided", () => {
      const output = strip(formatEnvError("MyApp", result))
      expect(output).not.toContain("Check your .env file.")
   })
})

// ---------------------------------------------------------------------------
// Error listing
// ---------------------------------------------------------------------------

describe("formatEnvError — error listing", () => {
   it("lists every error key", () => {
      const result = failed([
         { key: "DATABASE_URL", message: "is required but was not set" },
         { key: "API_KEY",      message: "is required but was not set" },
         { key: "PORT",         message: "must be a valid port (1–65535)" },
      ])
      const output = strip(formatEnvError("MyApp", result))
      expect(output).toContain("DATABASE_URL")
      expect(output).toContain("API_KEY")
      expect(output).toContain("PORT")
   })

   it("lists every error message", () => {
      const result = failed([
         { key: "PORT", message: "must be a valid port (1–65535)" },
         { key: "URL",  message: "must be a valid URL" },
      ])
      const output = strip(formatEnvError("MyApp", result))
      expect(output).toContain("must be a valid port (1–65535)")
      expect(output).toContain("must be a valid URL")
   })

   it("key and message appear on the same line", () => {
      const result = failed([{ key: "API_KEY", message: "is required but was not set" }])
      const output = strip(formatEnvError("MyApp", result))
      const line = output.split("\n").find(l => l.includes("API_KEY"))
      expect(line).toBeDefined()
      expect(line).toContain("is required but was not set")
   })

   it("keys are left-aligned and padded to the longest key width", () => {
      const result = failed([
         { key: "A",            message: "missing" },
         { key: "LONG_KEY_NAME", message: "missing" },
      ])
      const output = strip(formatEnvError("MyApp", result))
      const lines = output.split("\n")
      const lineA    = lines.find(l => /^\s+A\s/.test(l))
      const lineLong = lines.find(l => l.includes("LONG_KEY_NAME"))
      expect(lineA).toBeDefined()
      expect(lineLong).toBeDefined()
      // Both key columns should start at the same indent position
      const colA    = lineA!.indexOf("A")
      const colLong = lineLong!.indexOf("LONG_KEY_NAME")
      expect(colA).toBe(colLong)
   })
})

// ---------------------------------------------------------------------------
// Per-error description
// ---------------------------------------------------------------------------

describe("formatEnvError — per-error description", () => {
   it("shows the description below the error line when present", () => {
      const result = failed([{ key: "API_KEY", message: "is required but was not set", description: "Your API key from the dashboard" }])
      const output = strip(formatEnvError("MyApp", result))
      expect(output).toContain("Your API key from the dashboard")
   })

   it("places description on the line immediately after its error", () => {
      const result = failed([{ key: "API_KEY", message: "is required but was not set", description: "Your API key" }])
      const output = strip(formatEnvError("MyApp", result))
      const lines = output.split("\n")
      const errorIdx = lines.findIndex(l => l.includes("API_KEY"))
      expect(lines[errorIdx + 1]).toContain("Your API key")
   })

   it("omits the description line when not present", () => {
      const result = failed([{ key: "API_KEY", message: "is required but was not set" }])
      const output = strip(formatEnvError("MyApp", result))
      const lines = output.split("\n")
      const errorIdx = lines.findIndex(l => l.includes("API_KEY"))
      expect(lines[errorIdx + 1]).not.toMatch(/\S.*\S/)
   })

   it("propagates description from prop through createEnv", () => {
      const result = createEnv(
         { API_KEY: prop.string("Your API key from the dashboard") },
         {}
      )
      expect(result.success).toBe(false)
      if (result.success === true) return

      expect(result.errors[0].description).toBe("Your API key from the dashboard")
      const output = strip(formatEnvError("MyApp", result))
      expect(output).toContain("Your API key from the dashboard")
   })
})

// ---------------------------------------------------------------------------
// ANSI color
// ---------------------------------------------------------------------------

describe("formatEnvError — color", () => {
   const result = failed([{ key: "API_KEY", message: "is required but was not set" }])

   it("includes ANSI codes by default", () => {
      expect(formatEnvError("MyApp", result)).toMatch(ANSI_RE)
   })

   it("includes ANSI codes when color: true", () => {
      expect(formatEnvError("MyApp", result, { color: true })).toMatch(ANSI_RE)
   })

   it("strips all ANSI codes when color: false", () => {
      const output = formatEnvError("MyApp", result, { color: false })
      expect(output).not.toMatch(ANSI_RE)
   })

   it("plain-text output still contains the key and message", () => {
      const output = formatEnvError("MyApp", result, { color: false })
      expect(output).toContain("API_KEY")
      expect(output).toContain("is required but was not set")
   })
})

// ---------------------------------------------------------------------------
// Integration: result from createEnv
// ---------------------------------------------------------------------------

describe("formatEnvError — integration with createEnv", () => {
   it("formats a real failed createEnv result", () => {
      const result = createEnv(
         { DATABASE_URL: prop.url(), PORT: prop.port() },
         {}
      )
      expect(result.success).toBe(false)
      if (result.success === true) return

      const output = strip(formatEnvError("TestApp", result))
      expect(output).toContain("TestApp")
      expect(output).toContain("DATABASE_URL")
      expect(output).toContain("PORT")
   })

   it("formats a parse-failure result from createEnv", () => {
      const result = createEnv(
         { PORT: prop.port() },
         { PORT: "99999" }
      )
      expect(result.success).toBe(false)
      if (result.success === true) return

      const output = strip(formatEnvError("TestApp", result))
      expect(output).toContain("PORT")
   })
})