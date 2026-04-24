import type { ValidationResult } from "./types"

const RESET = "\x1b[0m"
const BOLD = "\x1b[1m"
const DIM = "\x1b[2m"
const RED = "\x1b[31m"
const YELLOW = "\x1b[33m"

/**
 * Formats a failed `createEnv` result into a human-readable error block.
 * @param title      Application name shown in the header.
 * @param result     The failed result returned by `createEnv`.
 * @param options    Optional description and whether to apply ANSI colour (default: true).
 */
export function formatEnvError<T>(
   title: string,
   result: Extract<ValidationResult<T>, { success: false }>,
   options: { description?: string; color?: boolean } = {}
): string {
   const { description, color = true } = options
   const c = (...codes: string[]) => (color ? codes.join("") : "")

   const heading = `${title} — Environment Configuration Error`
   const bar = "─".repeat(heading.length)

   const lines: string[] = [
      c(BOLD, RED) + bar + c(RESET),
      c(BOLD, RED) + heading + c(RESET),
      c(RED) + bar + c(RESET),
   ]

   if (description) {
      lines.push("", description)
   }

   lines.push("", "The following environment variables are missing or invalid:", "")

   const keyWidth = Math.max(0, ...result.errors.map(e => e.key.length))

   for (const error of result.errors) {
      lines.push(`  ${c(BOLD, YELLOW)}${error.key.padEnd(keyWidth)}${c(RESET)}  ${error.message}`)
      if (error.description) {
         lines.push(`  ${" ".repeat(keyWidth)}  ${c(DIM)}${error.description}${c(RESET)}`)
      }
   }

   lines.push("", c(RED) + bar + c(RESET), "")

   return lines.join("\n")
}
