// Instagram publishes no official DM limit. This is a personal pacing cap the
// account owner sets and tunes, not a platform-enforced ceiling — see
// docs/freelance-radar/instagram-outreach-requirements.md (open question 4).
const DM_BUDGET_STORAGE_KEY = "freelance-radar:dm-daily-budget"

export const DEFAULT_DM_DAILY_BUDGET = 10

export function getDmDailyBudget(): number {
  const stored = localStorage.getItem(DM_BUDGET_STORAGE_KEY)
  if (stored === null) return DEFAULT_DM_DAILY_BUDGET
  const n = Number(stored)
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_DM_DAILY_BUDGET
}

export function setDmDailyBudget(value: number): void {
  if (Number.isFinite(value) && value > 0) {
    localStorage.setItem(DM_BUDGET_STORAGE_KEY, String(value))
  } else {
    localStorage.removeItem(DM_BUDGET_STORAGE_KEY)
  }
}
