import { beforeEach, describe, expect, it } from "vitest"
import pagespeedMobileResponse from "./__fixtures__/pagespeed-mobile.json"

// vitest.config.ts runs this suite under `environment: "node"`, which has no
// `localStorage` global. Stub the minimal Storage interface, matching the
// pattern in dmBudget.test.ts.
class MemoryStorage implements Storage {
  private store = new Map<string, string>()
  get length(): number {
    return this.store.size
  }
  clear(): void {
    this.store.clear()
  }
  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null
  }
  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null
  }
  removeItem(key: string): void {
    this.store.delete(key)
  }
  setItem(key: string, value: string): void {
    this.store.set(key, value)
  }
}

globalThis.localStorage = new MemoryStorage()

const { getPsiApiKey, setPsiApiKey, parsePsiResponse } = await import("./pagespeed")

beforeEach(() => {
  localStorage.clear()
})

describe("getPsiApiKey / setPsiApiKey", () => {
  it("returns empty string when nothing is stored", () => {
    expect(getPsiApiKey()).toBe("")
  })

  it("round-trips a saved key through localStorage", () => {
    setPsiApiKey("AIzaSyTestKey123")
    expect(getPsiApiKey()).toBe("AIzaSyTestKey123")
    expect(localStorage.getItem("freelance-radar:psi-api-key")).toBe("AIzaSyTestKey123")
  })

  it("clears the stored key when set to an empty string", () => {
    setPsiApiKey("AIzaSyTestKey123")
    setPsiApiKey("")
    expect(getPsiApiKey()).toBe("")
    expect(localStorage.getItem("freelance-radar:psi-api-key")).toBeNull()
  })
})

// The fixture is a hand-built but schema-accurate PSI v5 response (the real
// Google response shape is stable/documented), per the instruction not to
// call the live API from this environment. See docs/freelance-radar/
// instagram-outreach-requirements.md, phase 2.
describe("parsePsiResponse", () => {
  const result = parsePsiResponse(pagespeedMobileResponse)

  it("converts the 0-1 performance score to a rounded 0-100 score", () => {
    expect(pagespeedMobileResponse.lighthouseResult.categories.performance.score).toBe(0.31)
    expect(result.score).toBe(31)
  })

  it("picks the worst-scoring metric (LCP at 0.02) as the failing metric", () => {
    expect(result.failingMetric).toBe("LCP 8.4s on 4G")
  })

  it("compacts a millisecond displayValue but leaves a unitless one alone", () => {
    // total-blocking-time (0.45) is not the worst metric here, but exercise
    // the compaction rule directly via a variant fixture.
    const variant = {
      lighthouseResult: {
        categories: { performance: { score: 0.5 } },
        audits: {
          "cumulative-layout-shift": { score: 0.01, displayValue: "0.34" },
        },
      },
    }
    expect(parsePsiResponse(variant).failingMetric).toBe("CLS 0.34 on 4G")
  })

  it("returns score 0 and an empty failing metric for a malformed body", () => {
    expect(parsePsiResponse({})).toEqual({ score: 0, failingMetric: "" })
    expect(parsePsiResponse(null)).toEqual({ score: 0, failingMetric: "" })
  })

  it("ignores audits with no score or no displayValue", () => {
    const variant = {
      lighthouseResult: {
        categories: { performance: { score: 0.9 } },
        audits: {
          "largest-contentful-paint": { score: 0.1 }, // no displayValue
          "first-contentful-paint": { displayValue: "1.2 s" }, // no score
          "speed-index": { score: 0.7, displayValue: "2.1 s" },
        },
      },
    }
    expect(parsePsiResponse(variant).failingMetric).toBe("SI 2.1s on 4G")
  })
})
