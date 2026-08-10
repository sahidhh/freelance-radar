import type { Lead } from "@/db/schema"

function line(label: string, value: string): string {
  return `${label}: ${value.trim() || "(unknown)"}`
}

/**
 * Builds a structured plain-text prompt from lead fields for the user to paste
 * into an external AI tool (Claude/ChatGPT), then paste the response back into
 * the lead's research fields. No AI API call happens here.
 */
export function buildResearchPrompt(lead: Lead): string {
  return `You are helping me research a potential freelance client. Here is what I know so far:

${line("Business name", lead.businessName)}
${line("Website", lead.website)}
${line("Industry", lead.industry)}
${line("Location", lead.location)}
${line("Contact name", lead.contactName)}
${line("Source", lead.source)}
${line("Source URL", lead.sourceUrl)}

Based on this information (and anything you can infer about a business like this), please provide:

1. Opportunity: A one-sentence summary of the business opportunity here.
2. Problem: The specific problem or pain point this business likely has that I could help solve.
3. Suggested Solution: A concrete solution I could pitch them.
4. Score: A lead quality score from 0-100 based on likely budget, need, and fit.
5. Score Reason: A short explanation for that score.
6. Estimated Value: A rough project value range in USD.
7. Estimated Effort: small, medium, or large.

Please format your answer under those exact 7 headings so I can paste each part back into the right field.`
}
