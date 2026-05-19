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
  : 'https://evoke2026.app.n8n.cloud/webhook/evoke-cmo';

export const ADMIN_EMAIL = "vasanthchowadrythumati@gmail.com";
