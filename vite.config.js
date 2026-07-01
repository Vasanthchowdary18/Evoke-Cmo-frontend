import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // Load all env vars (including non-VITE_ ones like GEMINI_API_KEY)
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      react(),

      // ── Dev-only API handlers (replaces Vercel Edge Functions locally) ──────
      {
        name: 'local-api-handlers',
        configureServer(server) {

          // ── /api/generate → Groq ────────────────────────────────────────────
          server.middlewares.use('/api/generate', (req, res) => {
            if (req.method === 'OPTIONS') {
              res.setHeader('Access-Control-Allow-Origin', '*')
              res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
              res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
              res.writeHead(204); res.end(); return
            }
            if (req.method !== 'POST') {
              res.writeHead(405); res.end('Method not allowed'); return
            }

            const apiKey = env.VITE_GROQ_API_KEY
            if (!apiKey) {
              res.setHeader('Content-Type', 'application/json')
              res.writeHead(500)
              res.end(JSON.stringify({ error: { message: 'VITE_GROQ_API_KEY not set in .env' } }))
              return
            }

            let body = ''
            req.on('data', chunk => { body += chunk })
            req.on('end', async () => {
              try {
                const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                  },
                  body,
                })
                const text = await groqRes.text()
                res.setHeader('Content-Type', 'application/json')
                res.setHeader('Access-Control-Allow-Origin', '*')
                res.writeHead(groqRes.status)
                res.end(text)
              } catch (err) {
                res.setHeader('Content-Type', 'application/json')
                res.writeHead(500)
                res.end(JSON.stringify({ error: { message: err.message } }))
              }
            })
          })

          // ── /api/run-agent → Google Gemini (text agents) ────────────────────
          server.middlewares.use('/api/run-agent', (req, res) => {
            if (req.method === 'OPTIONS') {
              res.setHeader('Access-Control-Allow-Origin', '*')
              res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
              res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
              res.writeHead(204); res.end(); return
            }
            if (req.method !== 'POST') { res.writeHead(405); res.end(); return }

            let body = ''
            req.on('data', chunk => { body += chunk })
            req.on('end', async () => {
              try {
                const payload = JSON.parse(body)
                const { agentType, ...fields } = payload

                const PROMPTS = {
                  reddit: `You are a Reddit marketing expert. Inputs:\n- Subreddit(s): ${fields.subreddit||''}\n- Topic: ${fields.topic||''}\n- Brand Context: ${fields.brandContext||''}\n\nGenerate 3 authentic Reddit reply drafts that add genuine value and naturally reference the brand without being promotional.\n\nRespond ONLY with valid JSON:\n{"title":"Reddit Reply Drafts","sections":[{"heading":"Draft Reply 1","content":"..."},{"heading":"Draft Reply 2","content":"..."},{"heading":"Draft Reply 3","content":"..."},{"heading":"Best Subreddits to Target","content":"..."},{"heading":"Reddit Engagement Strategy","content":"..."}]}`,
                  seo: `You are a senior SEO strategist. Inputs:\n- Website: ${fields.websiteUrl||''}\n- Target Keyword: ${fields.targetKeyword||''}\n- Industry: ${fields.industry||'General'}\n\nGenerate a full SEO content package.\n\nRespond ONLY with valid JSON:\n{"title":"SEO Content Package","sections":[{"heading":"Keyword Opportunities (15 keywords)","content":"..."},{"heading":"Full SEO Blog Post (800+ words)","content":"..."},{"heading":"Meta Tags & On-Page SEO","content":"..."},{"heading":"Featured Snippet Content","content":"..."},{"heading":"Internal Linking Strategy","content":"..."}]}`,
                  writer: `You are a professional brand content writer. Inputs:\n- Topic: ${fields.topic||''}\n- Brand: ${fields.brandName||''}\n- Audience: ${fields.audience||''}\n- Tone: ${fields.tone||'Professional'}\n\nWrite a comprehensive long-form article.\n\nRespond ONLY with valid JSON:\n{"title":"Long-Form Article","sections":[{"heading":"Full Article (1200+ words)","content":"..."},{"heading":"Social Media Snippets (5 quotes)","content":"..."},{"heading":"Email Newsletter Version (300 words)","content":"..."},{"heading":"Key Takeaways","content":"..."}]}`,
                  twitter: `You are an X (Twitter) growth strategist. Inputs:\n- Topic: ${fields.topic||''}\n- Brand: ${fields.brandName||''}\n- Tone: ${fields.tone||'Bold and engaging'}\n\nGenerate high-engagement Twitter/X content.\n\nRespond ONLY with valid JSON:\n{"title":"X (Twitter) Content Drafts","sections":[{"heading":"Standalone Tweets (5)","content":"..."},{"heading":"Thread Draft (7 tweets)","content":"..."},{"heading":"Engagement Hook Tweets (3)","content":"..."},{"heading":"Hashtag Strategy","content":"..."}]}`,
                  linkedin_agent: `You are a LinkedIn content strategist. Inputs:\n- Topic: ${fields.topic||''}\n- Brand/Person: ${fields.brandName||''}\n- Audience: ${fields.audience||'B2B professionals'}\n\nGenerate LinkedIn content.\n\nRespond ONLY with valid JSON:\n{"title":"LinkedIn Post Drafts","sections":[{"heading":"Post Draft 1 — Story Format","content":"..."},{"heading":"Post Draft 2 — Insight Format","content":"..."},{"heading":"Post Draft 3 — Engagement Format","content":"..."},{"heading":"Best Posting Schedule & Hashtags","content":"..."}]}`,
                  hackernews: `You are a Hacker News community expert. Inputs:\n- Topic: ${fields.topic||''}\n- Brand/Product: ${fields.brandName||''}\n- Value Proposition: ${fields.value||''}\n\nGenerate an HN engagement strategy.\n\nRespond ONLY with valid JSON:\n{"title":"Hacker News Engagement Strategy","sections":[{"heading":"Show HN Post Draft","content":"..."},{"heading":"Comment Draft 1","content":"..."},{"heading":"Comment Draft 2","content":"..."},{"heading":"Comment Draft 3","content":"..."},{"heading":"Thread Targeting Strategy","content":"..."}]}`,
                  geo: `You are a GEO expert. Inputs:\n- Brand: ${fields.brandName||''}\n- Keywords: ${fields.keywords||''}\n- Description: ${fields.description||''}\n\nGenerate a complete GEO optimization package.\n\nRespond ONLY with valid JSON:\n{"title":"GEO Optimization Package","sections":[{"heading":"AI Citation-Ready Content Blocks","content":"..."},{"heading":"Entity & Authority Building Strategy","content":"..."},{"heading":"FAQ Content for AI Overviews (10 Q&As)","content":"..."},{"heading":"Schema Markup Recommendations","content":"..."},{"heading":"Content Distribution Plan for AI Citations","content":"..."}]}`,
                  coding: `You are a technical SEO engineer. Inputs:\n- Website: ${fields.websiteUrl||''}\n- Issue/Goal: ${fields.issue||''}\n- Tech Stack: ${fields.techStack||'Unknown'}\n\nGenerate technical SEO fixes with code.\n\nRespond ONLY with valid JSON:\n{"title":"Technical SEO Fix Plan","sections":[{"heading":"Diagnosis & Priority Issues","content":"..."},{"heading":"Code Fix 1 (Primary)","content":"..."},{"heading":"Code Fix 2 (Secondary)","content":"..."},{"heading":"Performance Optimizations","content":"..."},{"heading":"Testing & Verification Checklist","content":"..."}]}`,
                  ugc_videos: `You are a UGC video content strategist. Inputs:\n- Product/Service: ${fields.product||''}\n- Style: ${fields.style||''}\n- Audience: ${fields.audience||'General consumers'}\n- Platforms: ${fields.platforms||'Instagram, TikTok'}\n\nGenerate UGC video briefs and scripts.\n\nRespond ONLY with valid JSON:\n{"title":"UGC Video Brief & Scripts","sections":[{"heading":"Video Brief & Creative Direction","content":"..."},{"heading":"Full Script — Version 1 (60 seconds)","content":"..."},{"heading":"Short Script — Version 2 (30 seconds)","content":"..."},{"heading":"Hook Options (5 variations)","content":"..."},{"heading":"Platform Adaptations & Hashtags","content":"..."}]}`
                }

                const prompt = PROMPTS[agentType] || PROMPTS.seo
                const groqKey = env.VITE_GROQ_API_KEY
                if (!groqKey) {
                  res.setHeader('Content-Type', 'application/json')
                  res.writeHead(500)
                  res.end(JSON.stringify({ success: false, error: 'VITE_GROQ_API_KEY not set in .env' }))
                  return
                }

                const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${groqKey}` },
                  body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages: [{ role: 'user', content: prompt }], temperature: 0.7, max_tokens: 4096 }),
                })

                const groqData = await groqRes.json()
                if (!groqRes.ok) {
                  res.setHeader('Content-Type', 'application/json')
                  res.writeHead(500)
                  res.end(JSON.stringify({ success: false, error: groqData?.error?.message || 'Groq error' }))
                  return
                }

                const rawText = groqData.choices?.[0]?.message?.content || ''
                let agentResult
                try {
                  let clean = rawText.trim().replace(/^```json\s*/i,'').replace(/```\s*$/i,'').trim()
                  agentResult = JSON.parse(clean)
                } catch {
                  agentResult = { title: agentType + ' Results', sections: [{ heading: 'Generated Content', content: rawText }] }
                }

                res.setHeader('Content-Type', 'application/json')
                res.setHeader('Access-Control-Allow-Origin', '*')
                res.writeHead(200)
                res.end(JSON.stringify({ success: true, agentType, agentResult }))
              } catch (err) {
                res.setHeader('Content-Type', 'application/json')
                res.writeHead(500)
                res.end(JSON.stringify({ success: false, error: err.message }))
              }
            })
          })

          // ── /api/generate-banner → DALL-E 3 or Gemini ──────────────────────
          server.middlewares.use('/api/generate-banner', (req, res) => {
            if (req.method === 'OPTIONS') {
              res.setHeader('Access-Control-Allow-Origin', '*')
              res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
              res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
              res.writeHead(204); res.end(); return
            }
            if (req.method !== 'POST') {
              res.writeHead(405); res.end('Method not allowed'); return
            }

            let body = ''
            req.on('data', chunk => { body += chunk })
            req.on('end', async () => {
              try {
                const { prompt, provider = 'dalle', size = '1024x1024' } = JSON.parse(body)
                if (!prompt) {
                  res.writeHead(400)
                  res.end(JSON.stringify({ error: 'Prompt is required' }))
                  return
                }

                const openaiKey = env.OPENAI_API_KEY
                if (!openaiKey) {
                  res.setHeader('Content-Type', 'application/json')
                  res.writeHead(500)
                  res.end(JSON.stringify({ error: 'OPENAI_API_KEY not configured in .env' }))
                  return
                }

                const validSizes = ['1024x1024', '1536x1024', '1024x1536']
                const safeSize = validSizes.includes(size) ? size : '1024x1024'

                const gptRes = await fetch('https://api.openai.com/v1/images/generations', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${openaiKey}`,
                  },
                  body: JSON.stringify({
                    model: 'gpt-image-1',
                    prompt: prompt,
                    n: 1,
                    size: safeSize,
                    quality: 'high',
                  }),
                })

                if (!gptRes.ok) {
                  const err = await gptRes.json().catch(() => ({}))
                  res.setHeader('Content-Type', 'application/json')
                  res.writeHead(gptRes.status)
                  res.end(JSON.stringify({ error: err?.error?.message || `OpenAI error ${gptRes.status}` }))
                  return
                }

                const data = await gptRes.json()
                const base64Image = data.data?.[0]?.b64_json
                if (!base64Image) {
                  res.writeHead(500)
                  res.end(JSON.stringify({ error: 'gpt-image-1 returned no image data' }))
                  return
                }

                let imageData = { base64Image, mimeType: 'image/png', provider: 'gpt-image-1' }

                res.setHeader('Content-Type', 'application/json')
                res.setHeader('Access-Control-Allow-Origin', '*')
                res.writeHead(200)
                res.end(JSON.stringify(imageData))
              } catch (err) {
                res.setHeader('Content-Type', 'application/json')
                res.writeHead(500)
                res.end(JSON.stringify({ error: err.message }))
              }
            })
          })

          // ── /auth/facebook/callback → Facebook OAuth ────────────────────────
          server.middlewares.use('/auth/facebook/callback', (req, res) => {
            if (req.method !== 'GET') {
              res.writeHead(405); res.end('Method not allowed'); return
            }

            const url = new URL(req.url, `http://${req.headers.host}`)
            const code = url.searchParams.get('code')
            const state = url.searchParams.get('state')
            const error = url.searchParams.get('error')
            const errorDescription = url.searchParams.get('error_description')

            // Handle OAuth errors
            if (error) {
              const errorMsg = `${error}: ${errorDescription || 'Unknown error'}`
              return res.end(`
                <html>
                  <body style="font-family: sans-serif; text-align: center; margin-top: 50px;">
                    <h1>❌ Facebook Login Failed</h1>
                    <p>${errorMsg}</p>
                    <a href="/connected-accounts">← Back to Connected Accounts</a>
                  </body>
                </html>
              `)
            }

            if (!code) {
              return res.end(`
                <html>
                  <body style="font-family: sans-serif; text-align: center; margin-top: 50px;">
                    <h1>❌ Invalid OAuth Response</h1>
                    <p>No authorization code received from Facebook</p>
                    <a href="/connected-accounts">← Back to Connected Accounts</a>
                  </body>
                </html>
              `)
            }

            // Success — redirect to connected accounts with code in hash
            res.setHeader('Location', `/connected-accounts#facebook_code=${code}&state=${state || ''}`)
            res.writeHead(302)
            res.end()
          })

        }
      }
    ],

    server: {
      port: 5173,
      open: false,
      proxy: {
        // n8n webhook proxy (avoids CORS in dev)
        '/n8n-webhook': {
          target: 'https://vasanthchowdary373.app.n8n.cloud',
          changeOrigin: true,
          rewrite: path => path.replace(/^\/n8n-webhook/, '/webhook'),
          secure: true,
        },
        // Legacy groq-api proxy (kept for backwards compat)
        '/groq-api': {
          target: 'https://api.groq.com',
          changeOrigin: true,
          rewrite: path => path.replace(/^\/groq-api/, ''),
          secure: true,
        },
        // Evoke API proxy — avoids CORS from localhost in dev
        '/evoke-api': {
          target: 'https://apieksv1.evokemarketplace.com',
          changeOrigin: true,
          rewrite: path => path.replace(/^\/evoke-api/, '/api'),
          secure: true,
        },
        // Pollinations image proxy — avoids CORS on localhost
        '/pollinations': {
          target: 'https://image.pollinations.ai',
          changeOrigin: true,
          rewrite: path => path.replace(/^\/pollinations/, ''),
          secure: true,
        },
      },
    },
  }
})
