import React from 'react'
import {
  BookOpen, Package, Image, Users, Mail, Globe, FileText,
  Sparkles, TrendingUp, Calendar, Megaphone, Target, BarChart2,
  Video, Rocket, Box,
} from 'lucide-react'

const GOLD = '#c8973e'

/**
 * Personalised agent/campaign suggestions based on the user's Brand
 * Knowledge Base — shared by the Dashboard (Overview tab) and the
 * Brand KB completion screen so recommendations are identical everywhere.
 */
export function getRecommendedActions(connectedCount, campaigns, tokenBalance, kb, limit = Infinity) {
  const industry   = (kb?.industry || '').toLowerCase()
  const audience   = (kb?.audienceType || '').toLowerCase()
  const objectives = Array.isArray(kb?.primaryObjective) ? kb.primaryObjective : (kb?.primaryObjective ? [kb.primaryObjective] : [])
  const hasBrandKb = !!(kb && Object.keys(kb).length > 1)
  const indLabel   = (kb?.industry || '').replace(/_/g,' ')

  const pool = []

  // ── Always: Brand KB setup if not done ──
  if (!hasBrandKb) {
    pool.push({ score: 100, icon: <BookOpen size={18}/>, title: 'Set Up Brand Profile', desc: 'Your AI CMO needs your brand details before it can personalise campaigns, health scores and growth plans.', color: GOLD, cta: 'Set Up Now', path: '/brand-kb', highlight: true, planRequired: 'free' })
  }

  // ── Always: Marketing Strategy — the first thing every brand does after Brand KB ──
  pool.push({ score: 1000, icon: <TrendingUp size={18}/>, title: 'Start Here — Marketing Strategy', desc: `Step 2 of your journey: build your Annual, Quarterly & Monthly marketing plan tailored to ${kb?.companyName || indLabel || 'your brand'}.`, color: '#f97316', cta: 'Build Your Strategy →', path: '/strategy', highlight: true, planRequired: 'free' })

  // ── Product/E-commerce focused ──
  const isEcom = ['ecommerce','retail','fashion','beauty','d2c','jewellery','watches','food_beverage'].some(t => industry.includes(t))
  if (isEcom) {
    pool.push({ score: 88, icon: <Package size={18}/>, title: 'Launch a Product Campaign', desc: `Generate a full go-to-market campaign for your ${indLabel || 'products'} — social posts, ads and email sequences.`, color: '#10b981', cta: 'Generate Campaign', path: '/campaign/product', highlight: true, planRequired: 'free' })
    pool.push({ score: 75, icon: <Image size={18}/>, title: 'Generate Product Visuals', desc: `Turn one product image into lifestyle photos, 360° videos and ad creatives for your ${indLabel} brand.`, color: '#ec4899', cta: 'Open Creative Studio', path: '/products', planRequired: 'package-a' })
    pool.push({ score: 70, icon: <Users size={18}/>, title: 'Influencer & PR Campaign', desc: `Influencer campaigns drive strong results in ${indLabel}. Get a ready-to-send brief and media pitch.`, color: '#ec4899', cta: 'Create Brief', path: '/campaign/influencer', planRequired: 'package-b' })
  }

  // ── B2B / Tech / Agency focused ──
  const isB2B = audience === 'b2b' || ['tech_saas','agency','b2b_services','finance_fintech','education'].some(t => industry.includes(t))
  if (isB2B) {
    pool.push({ score: 85, icon: <Mail size={18}/>, title: 'Email Drip Sequence', desc: 'Nurture B2B leads with a 5-email automated sequence — subject lines, preheaders and CTAs ready to go.', color: '#8b5cf6', cta: 'Build Sequence', path: '/campaign/email_drip', highlight: true, planRequired: 'free' })
    pool.push({ score: 72, icon: <Globe size={18}/>, title: 'LinkedIn Content Strategy', desc: 'Build your LinkedIn presence with a 30-day content calendar tailored to your B2B audience.', color: '#0a66c2', cta: 'Start Strategy', path: '/campaign/content_calendar', planRequired: 'free' })
    pool.push({ score: 65, icon: <FileText size={18}/>, title: 'Long-Form Content & SEO', desc: 'AI-powered blog articles, landing pages and newsletters — ranking-ready in seconds.', color: '#6366f1', cta: 'Open Content Gen', path: '/content-gen', planRequired: 'free' })
  }

  // ── Goal: Brand Awareness ──
  if (objectives.some(o => o.includes('brand'))) {
    pool.push({ score: 80, icon: <Sparkles size={18}/>, title: 'Brand Awareness Campaign', desc: `Build recognition for your ${indLabel || 'brand'} with identity-led social posts, tone of voice and audience messaging.`, color: '#a855f7', cta: 'Build Campaign', path: '/campaign/brand', planRequired: 'free' })
  }

  // ── Goal: Social media growth ──
  if (objectives.some(o => o.includes('social'))) {
    pool.push({ score: 78, icon: <Calendar size={18}/>, title: 'Content Calendar', desc: '30-day multi-platform content plan with daily post ideas, captions, and hashtags — auto-personalised to your brand.', color: '#3b82f6', cta: 'Build Calendar', path: '/campaign/content_calendar', planRequired: 'package-b' })
  }

  // ── Events / Hospitality ──
  const isEvents = ['hospitality','education','ngo_nonprofit','agency'].some(t => industry.includes(t))
  if (isEvents) {
    pool.push({ score: 74, icon: <Megaphone size={18}/>, title: 'Event Promotion Campaign', desc: `Drive registrations and buzz for webinars, conferences or live events relevant to your ${indLabel} audience.`, color: '#c8973e', cta: 'Promote Event', path: '/campaign/event', planRequired: 'free' })
  }

  // ── Fallbacks always available ──
  pool.push({ score: 68, icon: <Image size={18}/>, title: 'Generate Product & Ad Visuals', desc: `Multi-angle shots, lifestyle scenes and ad-ready banners generated from a single ${indLabel || 'product'} photo.`, color: '#ec4899', cta: 'Open Creative Studio', path: '/products', planRequired: 'package-a' })
  pool.push({ score: 62, icon: <Calendar size={18}/>, title: 'Content Calendar', desc: '30-day multi-platform content plan with daily post ideas, captions, and hashtags — auto-personalised to your brand.', color: '#3b82f6', cta: 'Build Calendar', path: '/campaign/content_calendar', planRequired: 'package-b' })
  pool.push({ score: 61, icon: <Video size={18}/>, title: 'Video & 360° Product Showcase', desc: 'Generate lifestyle videos and 360° product showcases — ready for social, ads and e-commerce listings.', color: '#a855f7', cta: 'Generate Video', path: '/video-gen', planRequired: 'package-b' })
  pool.push({ score: 60, icon: <Target size={18}/>, title: 'Competitive Analysis', desc: 'Understand your market position with SWOT analysis, competitor ads and pricing intelligence.', color: '#a855f7', cta: 'Analyse Now', path: '/campaign/competitive_intel', planRequired: 'free' })
  pool.push({ score: 55, icon: <TrendingUp size={18}/>, title: 'Trend Analysis', desc: 'Get trending hashtags, content ideas and competitor intelligence for your industry right now.', color: '#ec4899', cta: 'View Trends', path: '/trends', planRequired: 'free' })
  pool.push({ score: 50, icon: <BarChart2 size={18}/>, title: 'Executive Report', desc: 'Generate a board-ready executive marketing report with ROI, ROAS and strategic recommendations.', color: GOLD, cta: 'Generate Report', path: '/executive-report', planRequired: 'free' })
  pool.push({ score: 40, icon: <Box size={18}/>, title: '3D Product Renders', desc: 'Photorealistic 3D renders of your product — ready for premium ads, catalogues and e-commerce.', color: '#6366f1', cta: 'Create 3D Render', path: '/products', planRequired: 'package-c' })
  pool.push({ score: 38, icon: <Rocket size={18}/>, title: 'Meta & Google Ads Deploy', desc: 'Launch precision-targeted paid campaigns on Meta and Google — full deploy with audience targeting and budget management.', color: '#f59e0b', cta: 'Deploy Ads', path: '/products', planRequired: 'package-c' })
  if (campaigns.length > 0) {
    pool.push({ score: 85, icon: <BarChart2 size={18}/>, title: 'Review Campaign Analytics', desc: 'Your last campaign is ready for analysis — generate a performance report with KPIs and recommendations.', color: '#f59e0b', cta: 'View Analytics', path: '/campaign/analytics_report', planRequired: 'free' })
  }

  // Deduplicate by path, sort by score descending (Growth Strategy always leads).
  // Pass a limit to cap the list — omit it to return every matching recommendation.
  const seen = new Set()
  const ranked = pool
    .sort((a, b) => b.score - a.score)
    .filter(a => { if (seen.has(a.path)) return false; seen.add(a.path); return true })
  return Number.isFinite(limit) ? ranked.slice(0, limit) : ranked
}
