// ─── EVOKE CMO — Configuration ───────────────────────────────────────────────
//
// TO SWITCH n8n ACCOUNT:
//  1. Create new n8n free trial at https://n8n.io
//  2. Import the workflow JSON from /workflows/ folder
//  3. Copy your new webhook URLs and paste them below (or set VITE_ env vars)
//  4. Toggle the workflow ACTIVE in n8n
//
// You can override any URL via .env:
//   VITE_N8N_WEBHOOK=https://your-new-account.app.n8n.cloud/webhook/evoke-cmo
//   VITE_N8N_DAY_WEBHOOK=https://your-new-account.app.n8n.cloud/webhook/evoke-cmo-day
//   VITE_N8N_AGENT_WEBHOOK=https://your-new-account.app.n8n.cloud/webhook/evoke-agents
// ─────────────────────────────────────────────────────────────────────────────

const N8N_BASE = import.meta.env.VITE_N8N_BASE || ''

// Main campaign webhook
export const WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK
  || (import.meta.env.DEV ? '/n8n-webhook/evoke-cmo' : `${N8N_BASE}/webhook/evoke-cmo`)

// Day campaign webhook — posts a single day's content
export const DAY_WEBHOOK_URL = import.meta.env.VITE_N8N_DAY_WEBHOOK
  || (import.meta.env.DEV ? '/n8n-webhook/evoke-cmo-day' : `${N8N_BASE}/webhook/evoke-cmo-day`)

// Agent webhook — AI agent types (Reddit, SEO, Writer, X, LinkedIn etc.)
export const AGENT_WEBHOOK_URL = import.meta.env.VITE_N8N_AGENT_WEBHOOK
  || (import.meta.env.DEV ? '/n8n-webhook/evoke-agents' : `${N8N_BASE}/webhook/evoke-agents`)

// Approval email recipient
export const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || ''

// Meta / Evoke Marketing API base URL (FastAPI backend)
export const META_API_BASE = import.meta.env.VITE_META_API_BASE || ''

// Google Ads n8n webhooks
export const GOOGLE_ADS_OAUTH_WEBHOOK   = import.meta.env.VITE_GOOGLE_ADS_OAUTH   || `${N8N_BASE}/webhook/google-ads-oauth`
export const GOOGLE_ADS_CREATE_WEBHOOK  = import.meta.env.VITE_GOOGLE_ADS_CREATE  || `${N8N_BASE}/webhook/google-ads-create-campaign`
export const GOOGLE_ADS_METRICS_WEBHOOK = import.meta.env.VITE_GOOGLE_ADS_METRICS || `${N8N_BASE}/webhook/google-ads-metrics`
