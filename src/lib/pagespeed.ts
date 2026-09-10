// PageSpeed Insights v5 enrichment. Docs call the API key optional, but an
// unkeyed request returns 429 (unkeyed traffic shares a per-IP pool) — see
// docs/freelance-radar/instagram-outreach-requirements.md, phase 2. CORS is
// allowed (the endpoint echoes the caller's Origin), so this runs straight
// from the browser with no proxy.
const PSI_ENDPOINT = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed"
const PSI_API_KEY_STORAGE_KEY = "freelance-radar:psi-api-key"

export class PsiError extends Error {}

export function getPsiApiKey(): string {
  return localStorage.getItem(PSI_API_KEY_STORAGE_KEY) ?? ""
}

export function setPsiApiKey(key: string): void {
  if (key) localStorage.setItem(PSI_API_KEY_STORAGE_KEY, key)
  else localStorage.removeItem(PSI_API_KEY_STORAGE_KEY)
}

export interface PsiCheckResult {
  score: number
  failingMetric: string
}

// The common Lighthouse diagnostic/opportunity audits worth surfacing as the
// pitch's one measured problem, mapped to a short label matching the doc's
// example format ("LCP 8.4s on 4G").
const METRIC_LABELS: Record<string, string> = {
  "largest-contentful-paint": "LCP",
  "total-blocking-time": "TBT",
  "cumulative-layout-shift": "CLS",
  "first-contentful-paint": "FCP",
  "speed-index": "SI",
}

interface PsiAudit {
  score?: number | null
  displayValue?: string
}

// "8.4 s" -> "8.4s", "620 ms" -> "620ms". Unitless values (CLS) pass through.
function compactDisplayValue(displayValue: string): string {
  return displayValue.replace(/(\d)\s+([a-zA-Z%])/, "$1$2")
}

function worstFailingMetric(audits: Record<string, PsiAudit> | undefined): string {
  if (!audits) return ""

  let worstKey: string | null = null
  let worstScore = Infinity

  for (const key of Object.keys(METRIC_LABELS)) {
    const audit = audits[key]
    if (!audit || typeof audit.score !== "number" || !audit.displayValue) continue
    if (audit.score < worstScore) {
      worstScore = audit.score
      worstKey = key
    }
  }

  if (!worstKey) return ""
  const audit = audits[worstKey]
  return `${METRIC_LABELS[worstKey]} ${compactDisplayValue(audit.displayValue!)} on 4G`
}

/**
 * Parses/scores a raw PageSpeed Insights v5 JSON body. Exported separately
 * from the network call so it can be unit-tested against a committed fixture
 * without mocking fetch.
 */
export function parsePsiResponse(data: unknown): PsiCheckResult {
  const lighthouseResult = (data as Record<string, unknown> | null)?.lighthouseResult as
    | Record<string, unknown>
    | undefined
  const categories = lighthouseResult?.categories as Record<string, unknown> | undefined
  const performance = categories?.performance as Record<string, unknown> | undefined
  const rawScore = performance?.score

  const score = typeof rawScore === "number" ? Math.round(rawScore * 100) : 0
  const failingMetric = worstFailingMetric(
    lighthouseResult?.audits as Record<string, PsiAudit> | undefined
  )

  return { score, failingMetric }
}

export async function runPagespeedCheck(url: string, apiKey: string): Promise<PsiCheckResult> {
  if (!apiKey) {
    throw new PsiError("No PageSpeed Insights API key set. Add one in Settings.")
  }

  const qs = new URLSearchParams({ url, strategy: "mobile", key: apiKey })

  let res: Response
  try {
    res = await fetch(`${PSI_ENDPOINT}?${qs.toString()}`)
  } catch (err) {
    throw new PsiError("Network request to PageSpeed Insights failed.", { cause: err })
  }

  let data: unknown
  try {
    data = await res.json()
  } catch (err) {
    throw new PsiError(`PageSpeed Insights request failed (HTTP ${res.status}).`, { cause: err })
  }

  // Google returns 200 with an error-shaped body for some failures (e.g. an
  // unreachable site), and non-200 with the same shape for others.
  const errorMessage = (data as { error?: { message?: string } } | null)?.error?.message
  if (errorMessage) {
    throw new PsiError(`PageSpeed Insights error: ${errorMessage}`)
  }
  if (!res.ok) {
    throw new PsiError(`PageSpeed Insights request failed (HTTP ${res.status}).`)
  }

  return parsePsiResponse(data)
}
