import { describe, expect, it } from "vitest"
import { buildMailto } from "./mailto"

describe("buildMailto", () => {
  it("builds a basic mailto link with encoded subject and body", () => {
    const url = buildMailto("jane@example.com", "Hello there", "Line one\nLine two")
    expect(url.startsWith("mailto:jane@example.com?")).toBe(true)
    expect(url).toContain("subject=Hello+there")
    expect(url).toContain("body=Line+one%0ALine+two")
  })

  it("omits the query string entirely when subject and body are empty", () => {
    expect(buildMailto("jane@example.com", "", "")).toBe("mailto:jane@example.com")
  })

  it("keeps the @ in the address unencoded", () => {
    const url = buildMailto("jane@example.com", "Subject", "Body")
    expect(url.startsWith("mailto:jane@example.com")).toBe(true)
    expect(url).not.toContain("%40")
  })
})
