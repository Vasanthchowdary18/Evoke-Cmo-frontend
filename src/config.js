// ─── EVOKE CMO — Configuration ───────────────────────────────────────────────
//
// SETUP CHECKLIST:
//
// 1. WEBHOOK_URL  → copy the webhook URL from your n8n workflow
//                   (Form Webhook - AI CMO node → Production URL)
//                   Example: https://your-n8n.app.n8n.cloud/webhook/evoke-cmo
//
// 2. ADMIN_EMAIL  → the email address that receives the approval email
//                   before posts go live on LinkedIn / Instagram / Facebook
//
// 3. Make sure your n8n workflow is toggled ACTIVE in n8n.
//
// 4. If posts still don't appear, open browser DevTools → Console and look
//    for "[n8n] Webhook returned …" or "[n8n] Webhook network error" logs.
//    Those messages will tell you exactly what's wrong.
//
// ─────────────────────────────────────────────────────────────────────────────

// In dev the Vite proxy forwards /n8n-webhook/* → n8n cloud (avoids CORS).
// In production the full URL is used directly (n8n cloud accepts cross-origin POST).
export const WEBHOOK_URL = import.meta.env.DEV
  ? '/n8n-webhook/evoke-cmo'
  : 'https://vasanthchowadry18.app.n8n.cloud/webhook/evoke-cmo';

// Day campaign webhook — posts a single day's content (Day 2, 3, … N)
export const DAY_WEBHOOK_URL = import.meta.env.DEV
  ? '/n8n-webhook/evoke-cmo-day'
  : 'https://vasanthchowadry18.app.n8n.cloud/webhook/evoke-cmo-day';

export const ADMIN_EMAIL = "vasanthchowadrythumati@gmail.com"

// Agent webhook — processes all 9 AI agent types (Reddit, SEO, Writer, X, LinkedIn, HN, GEO, Coding, UGC)
export const AGENT_WEBHOOK_URL = import.meta.env.DEV
  ? '/n8n-webhook/evoke-agents'
  : 'https://vasanthchowadry18.app.n8n.cloud/webhook/evoke-agents';

// Meta / Evoke Marketing API base URL  (FastAPI backend — handler_api.py)
export const META_API_BASE = import.meta.env.VITE_META_API_BASE || '';

// ─── EGT Token — Smart Contract (fill in once deployed) ───────────────────────
export const EGT_CONTRACT = {
  address:  '',   // TODO: paste EGT token contract address here
  chainId:  null, // TODO: set chain ID (e.g. 1 = Ethereum, 56 = BSC, 137 = Polygon)
  decimals: 18,
  symbol:   'EGT',
}

// ─── EGT Tier Definitions ─────────────────────────────────────────────────────
// agents: campaign type keys that are accessible in this tier
// egtCost: EGT tokens deducted per CMO session entry
export const EGT_TIERS = {
  basic: {
    id:          'basic',
    name:        'Basic',
    egtCost:     10,
    color:       '#6366f1',
    gradient:    'linear-gradient(135deg,#6366f1,#4f46e5)',
    borderColor: 'rgba(99,102,241,0.45)',
    description: 'Core campaign tools — perfect for getting started',
    agents:      ['event', 'brand'],
    agentLabels: ['Events', 'Brands'],
  },
  pro: {
    id:          'pro',
    name:        'Pro EGT',
    egtCost:     50,
    color:       '#a855f7',
    gradient:    'linear-gradient(135deg,#a855f7,#7c3aed)',
    borderColor: 'rgba(168,85,247,0.45)',
    description: 'Full campaign suite for growing brands',
    agents:      ['event', 'brand', 'product', 'growth_strategy', 'content_calendar', 'email_drip'],
    agentLabels: ['Events', 'Brands', 'Products', 'Growth Strategy', 'Content Calendar', 'Email Drip'],
  },
  max: {
    id:          'max',
    name:        'Max',
    egtCost:     100,
    color:       '#f5c542',
    gradient:    'linear-gradient(135deg,#f5c542,#e6a817)',
    borderColor: 'rgba(245,197,66,0.55)',
    description: 'All agents + advanced analytics, SEO & influencer tools',
    agents:      [
      'event', 'brand', 'product', 'growth_strategy', 'content_calendar',
      'email_drip', 'seo_blog', 'influencer', 'analytics_report',
      'competitive_intel', 'sales_enablement', 'event_full', 'marketplace',
    ],
    agentLabels: ['All Campaign Types', 'SEO & Blog', 'Influencer & PR', 'Analytics', 'Sales Enablement', '+ All Others'],
  },
}
