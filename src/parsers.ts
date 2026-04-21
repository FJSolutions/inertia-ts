// ---------------------------------------------------------------------------
// Parser primitives
//
// Each function takes a raw string and returns a typed value, or throws a
// descriptive Error. These are the building blocks for field definitions —
// they have no knowledge of optionality, defaults, or schemas.
// ---------------------------------------------------------------------------

export function parseString(raw: string): string {
  if (raw.trim() === "") throw new Error("must not be empty")
  return raw
}

export function parseNumber(raw: string): number {
  const n = Number(raw.trim())
  if (Number.isNaN(n)) throw new Error(`"${raw}" is not a valid number`)
  return n
}

export function parseInteger(raw: string): number {
  const n = parseNumber(raw)
  if (!Number.isInteger(n)) throw new Error(`"${raw}" is not a valid integer`)
  return n
}

export function parseBoolean(raw: string): boolean {
  switch (raw.trim().toLowerCase()) {
    case "true":
    case "1":
    case "yes":
      return true
    case "false":
    case "0":
    case "no":
      return false
    default:
      throw new Error(`"${raw}" is not a valid boolean (expected true/false, 1/0, yes/no)`)
  }
}

export function parseUrl(raw: string): string {
  try {
    new URL(raw.trim())
    return raw.trim()
  } catch {
    throw new Error(`"${raw}" is not a valid URL`)
  }
}

export function parsePort(raw: string): number {
  const n = parseInteger(raw)
  if (n < 1 || n > 65535) throw new Error(`"${raw}" is not a valid port (expected 1–65535)`)
  return n
}

export function parseEnum<T extends string>(values: readonly T[]) {
  return (raw: string): T => {
    const trimmed = raw.trim() as T
    if (!values.includes(trimmed)) {
      throw new Error(`"${raw}" is not one of: ${values.join(", ")}`)
    }
    return trimmed
  }
}

export function parseList(separator = ","): (raw: string) => string[] {
  return (raw: string) => {
    const items = raw.split(separator).map(s => s.trim()).filter(Boolean)
    if (items.length === 0) throw new Error("must not be an empty list")
    return items
  }
}
