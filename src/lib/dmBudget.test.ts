import { beforeEach, describe, expect, it } from "vitest"

// vitest.config.ts runs this suite under `environment: "node"`, which has no
// `localStorage` global. dmBudget.ts (like jobDataLake.ts) is written for the
// browser, so stub the minimal Storage interface it needs.
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

const { DEFAULT_DM_DAILY_BUDGET, getDmDailyBudget, setDmDailyBudget } = await import("./dmBudget")

beforeEach(() => {
  localStorage.clear()
})

describe("getDmDailyBudget / setDmDailyBudget", () => {
  it("returns the default when nothing is stored", () => {
    expect(getDmDailyBudget()).toBe(DEFAULT_DM_DAILY_BUDGET)
    expect(DEFAULT_DM_DAILY_BUDGET).toBe(10)
  })

  it("round-trips a saved value through localStorage", () => {
    setDmDailyBudget(25)
    expect(getDmDailyBudget()).toBe(25)
    expect(localStorage.getItem("freelance-radar:dm-daily-budget")).toBe("25")
  })

  it("falls back to the default when an invalid value is set", () => {
    setDmDailyBudget(0)
    expect(getDmDailyBudget()).toBe(DEFAULT_DM_DAILY_BUDGET)

    setDmDailyBudget(-5)
    expect(getDmDailyBudget()).toBe(DEFAULT_DM_DAILY_BUDGET)

    setDmDailyBudget(Number.NaN)
    expect(getDmDailyBudget()).toBe(DEFAULT_DM_DAILY_BUDGET)
  })
})
