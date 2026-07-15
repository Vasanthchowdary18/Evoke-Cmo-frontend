import React, { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Package,
  Zap,
  ArrowRight,
  Upload,
  X,
  ChevronDown,
  ChevronLeft,
  Check,
  ImageIcon,
  Loader2,
  AlertCircle,
  ChevronUp,
  MapPin,
  Link,
  Clock,
  Mail,
  Film,
  Megaphone,
  Users,
  Target,
  TrendingUp,
  Code2,
  Brain,
  Shield,
  ExternalLink,
} from "lucide-react";
import Navbar from "../components/Navbar.jsx";
import EventBannerGenerator from "../components/EventBannerGenerator.jsx";
import { getEvokeUserProfile } from "../lib/session";
import { profileToUser } from "../lib/authUtils";
import { getUserData } from "../services/userService";
import { useAuth } from "../hooks/useAuth.js";
import { getKnowledgeBase } from "../services/knowledgeBaseService.js";
import { buildEventSlug, saveEventPage, downloadEventHtml } from "../services/eventService";

const CLOUDINARY_CLOUD = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "";
const CLOUDINARY_PRESET = "tiktok_videos"; // Unsigned preset in Cloudinary
const WS_KEY  = import.meta.env.VITE_WAVESPEED_API_KEY || "";
const GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY || "";

/* ── WaveSpeed image-to-video ── */
async function wsSubmit(model, prompt, imageUrl, duration = 5) {
  const res = await fetch(`https://api.wavespeed.ai/api/v3/${model}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${WS_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, image: imageUrl, duration, size: "720p" }),
  });
  if (!res.ok) throw new Error(`WaveSpeed ${res.status}`);
  const d = await res.json();
  return d?.data; // { id, urls: { get } }
}
async function wsPoll(getUrl) {
  const maxAttempts = 150; // ~10 min of actual "still processing" checks
  let attempts = 0;
  let errorStreak = 0;
  while (attempts < maxAttempts) {
    await new Promise((r) => setTimeout(r, 4000));
    let r;
    try {
      r = await fetch(getUrl, { headers: { Authorization: `Bearer ${WS_KEY}` } });
    } catch {
      errorStreak++;
      if (errorStreak > 10) throw new Error("Lost connection while waiting for video. Please try again.");
      continue; // network hiccup — don't burn an attempt
    }
    if (!r.ok) {
      errorStreak++;
      if (errorStreak > 10) throw new Error(`WaveSpeed status check failed (${r.status}). Please try again.`);
      continue; // transient API hiccup — don't burn an attempt
    }
    errorStreak = 0;
    const d = await r.json();
    if (d?.data?.status === "completed") return d.data.outputs?.[0] || null;
    if (d?.data?.status === "failed") throw new Error("WaveSpeed generation failed.");
    attempts++; // only counts while job is genuinely still processing
  }
  throw new Error("Video is taking longer than usual (10+ min). It may still finish on WaveSpeed's side — please try again shortly.");
}

/* ── Groq text ── */
async function gemText(prompt) {
  const res = await fetch(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_KEY}` },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 4096,
      }),
    }
  );
  if (!res.ok) throw new Error(`Groq ${res.status}`);
  const d = await res.json();
  return d?.choices?.[0]?.message?.content || "";
}

/* ── 6 converter configs ── */
const CONVERTERS = [
  {
    key: "angles", label: "Multi Angles", type: "video",
    color: "#10b981", icon: "⟳",
    model: "bytedance/seedance-2.0-fast/image-to-video",
    prompt: (n) => `Product photography showcase of ${n || "a product"}. Smooth camera rotation revealing front, back, side, top and lifestyle angles. Clean studio white background, professional lighting. High-resolution e-commerce product video. No people.`,
  },
  {
    key: "360", label: "360° Video", type: "video",
    color: "#a855f7", icon: "○",
    model: "bytedance/seedance-2.0-fast/image-to-video",
    prompt: (n) => `${n || "Product"} smooth 360 degree turntable rotation. White studio background, professional lighting, perfect loop, e-commerce showcase. No people, no text.`,
  },
  {
    key: "lifestyle", label: "Lifestyle Video", type: "video",
    color: "#ec4899", icon: "✦",
    model: "bytedance/seedance-2.0-fast/image-to-video",
    prompt: (n) => `Lifestyle product video showcasing ${n || "a product"} in a real-world aspirational setting. Natural light, cinematic camera movement, brand-feel. High quality, no text overlays.`,
  },
  {
    key: "adVideo", label: "Ad Video", type: "video",
    color: "#f97316", icon: "▶",
    model: "bytedance/seedance-2.0/image-to-video",
    prompt: (n) => `Story-driven social media ad video featuring ${n || "a product"}. Optimised for Instagram Reels and TikTok. Cinematic, vibrant, aspirational. No text, no voiceover.`,
  },
  {
    key: "description", label: "Product Copy", type: "text",
    color: "#06b6d4", icon: "✎",
    prompt: (n, desc, brand) => `Write a compelling e-commerce product description for "${n}"${brand ? ` by ${brand}` : ""}. Include: punchy title, 3-sentence description, 5 bullet points, and a CTA. Product info: ${desc || n}. Keep it conversion-focused and brand-voice consistent.`,
  },
  {
    key: "seo", label: "SEO Tags", type: "text",
    color: "#c8973e", icon: "#",
    prompt: (n, desc) => `Generate SEO meta tags for "${n}": meta title (60 chars), meta description (155 chars), 5 primary keywords, 5 long-tail keywords, and an image alt text. Product: ${desc || n}. Return as plain labelled text.`,
  },
];

// â"€â"€â"€ Gemini Imagen 3 - full poster generator (text + design) â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
async function generateEventPoster(form) {
  const name     = (form.name     || 'Event').trim();
  const desc     = (form.description || '').substring(0, 100).trim();
  const location = (Array.isArray(form.eventLocations) && form.eventLocations.length ? form.eventLocations.join(', ') : form.location || '').trim();
  const time     = (form.time     || '').trim();
  let dateStr = '';
  if (form.date) {
    try { dateStr = new Date(form.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }); }
    catch (_) { dateStr = form.date; }
  }

  return new Promise((resolve) => {
    const SIZE = 1080;
    const canvas = document.createElement('canvas');
    canvas.width  = SIZE;
    canvas.height = SIZE;
    const ctx = canvas.getContext('2d');

    // Background gradient
    const bg = ctx.createLinearGradient(0, 0, SIZE, SIZE);
    bg.addColorStop(0,   '#0d0b08');
    bg.addColorStop(0.5, '#1a1208');
    bg.addColorStop(1,   '#0d0b08');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, SIZE, SIZE);

    // Gold accent top bar
    const topBar = ctx.createLinearGradient(0, 0, SIZE, 0);
    topBar.addColorStop(0, 'rgba(200,151,62,0)');
    topBar.addColorStop(0.5, 'rgba(200,151,62,0.9)');
    topBar.addColorStop(1, 'rgba(200,151,62,0)');
    ctx.fillStyle = topBar;
    ctx.fillRect(0, 0, SIZE, 4);

    // Decorative circle glow top-right
    const glow = ctx.createRadialGradient(SIZE * 0.85, SIZE * 0.15, 0, SIZE * 0.85, SIZE * 0.15, 300);
    glow.addColorStop(0, 'rgba(200,151,62,0.12)');
    glow.addColorStop(1, 'rgba(200,151,62,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, SIZE, SIZE);

    // Bottom glow
    const glow2 = ctx.createRadialGradient(SIZE * 0.2, SIZE * 0.85, 0, SIZE * 0.2, SIZE * 0.85, 280);
    glow2.addColorStop(0, 'rgba(124,58,237,0.15)');
    glow2.addColorStop(1, 'rgba(124,58,237,0)');
    ctx.fillStyle = glow2;
    ctx.fillRect(0, 0, SIZE, SIZE);

    // Geometric lines
    ctx.strokeStyle = 'rgba(200,151,62,0.15)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(SIZE * 0.6 + i * 30, 0);
      ctx.lineTo(SIZE, SIZE * 0.4 - i * 30);
      ctx.stroke();
    }


    // Main title
    const titleY = 280;
    ctx.fillStyle = '#f0ebe0';
    ctx.textAlign = 'left';
    const maxTitleWidth = SIZE - 120;
    let titleSize = 86;
    ctx.font = 'bold ' + titleSize + 'px Arial, sans-serif';
    while (ctx.measureText(name).width > maxTitleWidth && titleSize > 36) {
      titleSize -= 4;
      ctx.font = 'bold ' + titleSize + 'px Arial, sans-serif';
    }
    // Word wrap title
    const words = name.split(' ');
    let line = '';
    let ty = titleY;
    for (const word of words) {
      const test = line ? line + ' ' + word : word;
      if (ctx.measureText(test).width > maxTitleWidth && line) {
        ctx.fillText(line, 60, ty);
        line = word;
        ty += titleSize * 1.15;
      } else { line = test; }
    }
    ctx.fillText(line, 60, ty);

    // Gold divider
    const divY = ty + 40;
    const divGrad = ctx.createLinearGradient(60, 0, 500, 0);
    divGrad.addColorStop(0, '#c8973e');
    divGrad.addColorStop(1, 'rgba(200,151,62,0)');
    ctx.fillStyle = divGrad;
    ctx.fillRect(60, divY, 440, 3);

    // Details
    let detailY = divY + 50;
    const detailItems = [
      dateStr  ? { icon: '📅', label: 'DATE',  val: dateStr  } : null,
      time     ? { icon: '🕐', label: 'TIME',  val: time     } : null,
      location ? { icon: '📍', label: 'VENUE', val: location } : null,
      desc     ? { icon: '✦',  label: 'ABOUT', val: desc     } : null,
    ].filter(Boolean);

    for (const item of detailItems) {
      // Label
      ctx.fillStyle = '#c8973e';
      ctx.font = 'bold 13px Arial, sans-serif';
      ctx.fillText(item.label, 60, detailY);
      // Value
      ctx.fillStyle = 'rgba(240,235,224,0.85)';
      ctx.font = '22px Arial, sans-serif';
      const valText = item.val.length > 55 ? item.val.slice(0, 52) + '...' : item.val;
      ctx.fillText(valText, 60, detailY + 28);
      detailY += 72;
      if (detailY > SIZE - 120) break;
    }

    // Bottom gold bar
    const botBar = ctx.createLinearGradient(0, 0, SIZE, 0);
    botBar.addColorStop(0, 'rgba(200,151,62,0)');
    botBar.addColorStop(0.5, 'rgba(200,151,62,0.9)');
    botBar.addColorStop(1, 'rgba(200,151,62,0)');
    ctx.fillStyle = botBar;
    ctx.fillRect(0, SIZE - 4, SIZE, 4);

    // Footer text
    ctx.fillStyle = 'rgba(240,235,224,0.25)';
    ctx.font = '14px Arial, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('Powered by EVOX AI', SIZE - 60, SIZE - 28);

    canvas.toBlob(blob => {
      const file    = new File([blob], 'evoke-cmo-poster.png', { type: 'image/png' });
      const preview = URL.createObjectURL(blob);
      resolve({ file, preview });
    }, 'image/png');
  });
}
async function convertToJpeg(file) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      canvas.getContext("2d").drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      canvas.toBlob(
        (blob) =>
          resolve(new File([blob], "image.jpg", { type: "image/jpeg" })),
        "image/jpeg",
        0.92,
      );
    };
    img.src = url;
  });
}

// â"€â"€â"€ Upload image to ImgBB (for Instagram / Facebook / LinkedIn) â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
async function uploadToImgBB(file) {
  const jpeg = await convertToJpeg(file);
  const base64 = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(jpeg);
  });
  const fd = new FormData();
  fd.append("key", import.meta.env.VITE_IMGBB_API_KEY || "");
  fd.append("image", base64);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 30000);
  try {
    const res = await fetch("https://api.imgbb.com/1/upload", { method: "POST", body: fd, signal: ctrl.signal });
    clearTimeout(timer);
    if (!res.ok) throw new Error("Image upload failed.");
    const data = await res.json();
    return data.data.url;
  } catch (e) { clearTimeout(timer); throw new Error(e.name === "AbortError" ? "Image upload timed out, continuing without image." : e.message); }
}

// â"€â"€â"€ Upload video to Cloudinary (TikTok only) â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
async function uploadVideoToCloudinary(file, onProgress) {
  return new Promise((resolve, reject) => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("upload_preset", CLOUDINARY_PRESET);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/video/upload`);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try { resolve(JSON.parse(xhr.responseText).secure_url); }
        catch { reject(new Error("Invalid Cloudinary response")); }
      } else {
        reject(new Error("Video upload failed: " + xhr.statusText));
      }
    };
    xhr.onerror = () => reject(new Error("Video upload network error"));
    xhr.send(fd);
  });
}

// â"€â"€â"€ Groq campaign content generator (free tier) â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
async function generateCampaignContent(form, campaignType, campaignDays) {
  if (!form.campaignDays) form = { ...form, campaignDays: campaignDays || 7 };
  const apiKey = import.meta.env.VITE_GROQ_API_KEY || "";

  const isEvent = campaignType === "event" || campaignType === "event_full";
  const isProduct = campaignType === "product";
  const isNewType = !["event", "product", "brand", "event_full"].includes(campaignType);

  // ── Jina AI website reader (growth_strategy only) ──────────────────────────
  // r.jina.ai converts any URL into clean readable text — no API key needed.
  let websiteContent = '';
  if ((campaignType === 'growth_strategy' || campaignType === 'growth_agent' || campaignType === 'content_calendar') && form.website) {
    try {
      const jinaUrl = form.website.startsWith('http') ? form.website : `https://${form.website}`;
      const jinaRes = await fetch(`https://r.jina.ai/${jinaUrl}`, {
        headers: { 'Accept': 'text/plain', 'X-Return-Format': 'text' },
      });
      if (jinaRes.ok) {
        const raw = await jinaRes.text();
        websiteContent = raw.slice(0, 1000); // cap at 1k chars to stay within Groq 6000 TPM
      }
    } catch (e) {
      console.warn('Jina AI website read failed, generating without site content:', e.message);
    }
  }
  // ────────────────────────────────────────────────────────────────────────────

  const baseContext = `
Campaign Type: ${campaignType}
Name/Title: ${form.name}
Description: ${form.description}
Goal: ${form.goal}
Target Audience: ${form.targetAudience.join(", ")}
Brand/Company: ${form.brandName || form.name}
Website: ${form.website || ""}
${form.date ? `Date: ${form.date}` : ""}
${form.location ? `Location: ${form.location}` : ""}
${form.competitorUrl ? `Competitor URL: ${form.competitorUrl}` : ""}
${form.industry ? `Industry: ${form.industry}` : ""}
${form.budget ? `Budget: ${form.budget}` : ""}
${form.keywords ? `Keywords: ${form.keywords}` : ""}
${form.toneOfVoice ? `Brand Tone of Voice: ${form.toneOfVoice}` : ""}
${form.socialPlatforms?.length ? `Connected Social Platforms to target: ${form.socialPlatforms.join(", ")}` : ""}
${form.contentTypes?.length ? `Formats Requested: ${form.contentTypes.join(", ")}` : ""}
${form.targetClientProfile ? `Ideal Client Profile: ${form.targetClientProfile}` : ""}
${form.avgDealSize ? `Average Deal / Contract Value: ${form.avgDealSize}` : ""}
${form.acquisitionChannel ? `Primary Acquisition Channel: ${form.acquisitionChannel}` : ""}
${websiteContent ? `\n--- LIVE WEBSITE CONTENT (use this to deeply understand the business, products, and tone) ---\n${websiteContent}\n---` : ""}
`.trim();

  const context = isEvent
    ? `Event Name: ${form.name}
Description: ${form.description}
Date: ${form.date || "TBD"}  Time: ${form.time || "TBD"}
Location: ${form.eventLocations?.length ? form.eventLocations.join(", ") : "TBD"}
Event URL: ${form.eventUrl || ""}
Goal: ${form.goal}
Target Audience: ${form.targetAudience.join(", ")}
Post Date: ${form.postDate || "ASAP"}`
    : isProduct
      ? `Product Name: ${form.name}
Brand: ${form.brandName}
Description: ${form.description}
Goal: ${form.goal}
Target Audience: ${form.targetAudience.join(", ")}
Website: ${form.website || ""}
Post Date: ${form.postDate || "ASAP"}`
      : baseContext;

  // Build type-specific prompt output schema
  const getOutputSchema = () => {
    const baseSchema = `{
  "campaignName": "${form.name}",
  "emailSubject": "email subject line",
  "emailBody": "1-paragraph email body",
  "linkedinPost": "60-word LinkedIn post with 3 hashtags",
  "instagramCaption": "40-word caption with emojis and 3 hashtags",
  "facebookPost": "50-word Facebook post with CTA",
  "whatsappMessage": "30-word WhatsApp message",
  "smsMessage": "SMS under 160 chars",
  "seoTitle": "SEO title (60 chars max)",
  "seoDescription": "meta description (160 chars max)",
  "adHeadline": "ad headline (30 chars max)",
  "adBody": "ad copy (90 chars max)",
  "tiktokCaption": "TikTok caption with hook and 3 hashtags",
  "campaignCalendar": "${form.campaignDays||7}-day action schedule",
  "positioningStatement": "1-sentence positioning statement"
}`;

    const schemas = {
      growth_strategy: `{
  "campaignName": "${form.name}",
  "executiveSummary": "2-sentence strategy overview: current position and core opportunity",
  "growthOpportunities": "3 revenue opportunities (numbered, one line each)",
  "gtmPlan": "3-phase GTM plan: Phase 1, 2, 3 with key tactic per phase",
  "revenueProjection": "Q1-Q4 revenue targets (one line each)",
  "partnershipIdeas": "3 partnership ideas with value exchange",
  "expansionRoadmap": "Q1-Q4 expansion goals (one line each)",
  "competitorGaps": "3 competitor weaknesses and counter-moves"
}`,
      growth_agent: `{
  "campaignName": "${form.name}",
  "executiveSummary": "2-sentence client acquisition overview: ideal client and key differentiator",
  "growthOpportunities": "3 acquisition channels (numbered, one line each with lead estimate)",
  "gtmPlan": "3-phase lead gen plan: Phase 1 quick wins, Phase 2 scale, Phase 3 retention",
  "revenueProjection": "Q1-Q4 new client targets with deal sizes",
  "partnershipIdeas": "3 referral/partnership ideas with expected leads per month",
  "expansionRoadmap": "Q1-Q4 client growth targets and key actions",
  "competitorGaps": "3 reasons clients choose you over competitors"
}`,
      competitive_intel: `{
  "campaignName": "${form.name}",
  "competitorAnalysis": "2-sentence competitor landscape overview",
  "swotAnalysis": "SWOT: 2 bullets per quadrant (Strengths, Weaknesses, Opportunities, Threats)",
  "marketPositioning": "1-sentence positioning vs competitors",
  "differentiators": "3 unique differentiators",
  "counterStrategies": "3 counter-strategies",
  "marketTrends": "3 trends to capitalize on",
  "pricingIntel": "1-sentence pricing recommendation",
  "emailSubject": "email subject line",
  "emailBody": "1-paragraph competitive briefing email",
  "linkedinPost": "50-word LinkedIn thought leadership post with hashtags",
  "positioningStatement": "1-sentence positioning statement",
  "campaignCalendar": "${form.campaignDays||7}-day action schedule"
}`,
      content_calendar: `{
  "campaignName": "${form.name}",
  "executiveSummary": "2-sentence content strategy: brand position and core message${form.toneOfVoice ? ` (${form.toneOfVoice} tone)` : ""}",
  "growthOpportunities": "3 content channels with estimated reach (one line each)",
  "gtmPlan": "4-week content plan: Week 1-4 key actions (one line per week)",
  "revenueProjection": "Q1-Q4 content ROI milestones",
  "partnershipIdeas": "3 content collaboration ideas",
  "expansionRoadmap": "Q1-Q4 content expansion goals",
  "competitorGaps": "3 content gaps competitors miss"
}`,
      seo_blog: `{
  "campaignName": "${form.name}",
  "blogTitle": "SEO blog post title",
  "blogOutline": "H2/H3 outline (4-5 sections)",
  "blogIntro": "60-word blog introduction",
  "blogContent": "200-word blog body",
  "blogConclusion": "40-word conclusion with CTA",
  "primaryKeyword": "main keyword",
  "secondaryKeywords": "3 secondary keywords comma-separated",
  "seoTitle": "SEO title (60 chars max)",
  "seoDescription": "meta description (160 chars max)",
  "internalLinks": "3 internal linking topics",
  "emailSubject": "email subject line",
  "emailBody": "1-paragraph blog promo email",
  "linkedinPost": "50-word LinkedIn post with hashtags",
  "tiktokCaption": "TikTok hook with hashtags",
  "campaignCalendar": "${form.campaignDays||7}-day action schedule",
  "positioningStatement": "1-sentence positioning"
}`,
      email_drip: `{
  "campaignName": "${form.name}",
  "email1Subject": "Email 1 subject",
  "email1Body": "Email 1 (50 words): opening hook + core value promise",
  "email2Subject": "Email 2 subject",
  "email2Body": "Email 2 (50 words): educate, build trust",
  "email3Subject": "Email 3 subject",
  "email3Body": "Email 3 (50 words): social proof or case study",
  "email4Subject": "Email 4 subject",
  "email4Body": "Email 4 (50 words): offer with urgency",
  "email5Subject": "Email 5 subject",
  "email5Body": "Email 5 (50 words): final CTA",
  "sendSchedule": "Best days/times to send each of the ${form.campaignDays||5} emails",
  "segmentStrategy": "1-sentence audience segmentation tip",
  "positioningStatement": "1-sentence value proposition"
}`,
      influencer: `{
  "campaignName": "${form.name}",
  "influencerBrief": "2-sentence campaign brief: objectives and tone",
  "contentGuidelines": "3 dos and 3 don'ts",
  "outreachTemplate": "50-word influencer outreach email",
  "hashtags": "8 campaign hashtags",
  "campaignGoals": "3 measurable KPIs",
  "pressRelease": "Press release: headline + 2-paragraph body + quote",
  "prPitch": "40-word media pitch",
  "influencerTiers": "Nano/Micro/Macro recommendation with 1-line rationale each",
  "emailSubject": "email subject line",
  "emailBody": "1-paragraph campaign launch email",
  "linkedinPost": "50-word LinkedIn post with hashtags",
  "instagramCaption": "40-word Instagram caption with hashtags",
  "campaignCalendar": "${form.campaignDays||7}-day action schedule",
  "positioningStatement": "1-sentence positioning statement"
}`,
      analytics_report: `{
  "campaignName": "${form.name}",
  "executiveSummary": "2-sentence performance summary",
  "kpiDashboard": "Key KPIs: ROAS, CAC, LTV, CTR, ROI (one line each)",
  "channelPerformance": "Top 3 channels with performance note",
  "topInsights": "3 key marketing insights",
  "growthOpportunities": "3 growth opportunities",
  "recommendations": "3 strategic recommendations",
  "nextSteps": "5 action items for next 30 days",
  "emailSubject": "email subject line",
  "emailBody": "1-paragraph stakeholder report email",
  "linkedinPost": "50-word LinkedIn insights post with hashtags",
  "campaignCalendar": "${form.campaignDays||7}-day action schedule",
  "positioningStatement": "1-sentence data-driven positioning"
}`,
      sales_enablement: `{
  "campaignName": "${form.name}",
  "elevatorPitch": "30-word elevator pitch",
  "salesDeckOutline": "5-slide deck outline (title + 1-line content each)",
  "coldCallScript": "Cold call: opener + 2 discovery questions + close",
  "emailSequence": "3-email outreach: subject + 30-word body each",
  "objectionGuide": "Top 3 objections with 1-sentence responses",
  "closingStrategies": "3 closing techniques",
  "valueProposition": "1-line value prop + 2 proof points",
  "emailSubject": "email subject line",
  "emailBody": "1-paragraph sales team email",
  "linkedinPost": "50-word LinkedIn outreach with hashtags",
  "campaignCalendar": "${form.campaignDays||7}-day action schedule",
  "positioningStatement": "1-sentence sales positioning"
}`,
      event_full: `{
  "campaignName": "${form.name}",
  "emailSubject": "email subject line",
  "emailBody": "1-paragraph event announcement email",
  "countdownEmail7": "7-day countdown email (40 words)",
  "countdownEmail3": "3-day urgency email (40 words)",
  "countdownEmail1": "Day-before reminder (30 words)",
  "speakerBio": "2-sentence speaker bio",
  "speakerLinkedin": "40-word speaker promo LinkedIn post",
  "attendeeWelcome": "40-word welcome email",
  "postEventRecap": "40-word post-event recap email",
  "linkedinPost": "50-word LinkedIn event announcement with hashtags",
  "instagramCaption": "40-word Instagram caption with emojis and hashtags",
  "facebookPost": "40-word Facebook post with CTA",
  "whatsappMessage": "25-word WhatsApp reminder",
  "tiktokCaption": "TikTok caption with hook and hashtags",
  "adHeadline": "ad headline (30 chars max)",
  "adBody": "ad copy (90 chars max)",
  "seoTitle": "SEO title (60 chars max)",
  "seoDescription": "meta description (160 chars max)",
  "campaignCalendar": "${form.campaignDays||7}-day action schedule",
  "positioningStatement": "1-sentence event positioning"
}`,
      marketplace: `{
  "campaignName": "${form.name}",
  "vendorOnboardingEmail": "1-paragraph vendor welcome email",
  "productListingCopy": "Listing title + 2-sentence description + 3 bullets",
  "seasonalCampaign": "2-sentence seasonal promotion plan",
  "buyerEmailSubject": "email subject line",
  "buyerEmailBody": "1-paragraph buyer retention email",
  "vendorGrowthPlan": "3-step vendor growth strategy",
  "marketplaceSEO": "3 SEO keywords + 2 listing tips",
  "linkedinPost": "50-word LinkedIn post with hashtags",
  "instagramCaption": "40-word Instagram caption with hashtags",
  "facebookPost": "40-word Facebook post with CTA",
  "adHeadline": "ad headline (30 chars max)",
  "adBody": "ad copy (90 chars max)",
  "campaignCalendar": "${form.campaignDays||7}-day action schedule",
  "positioningStatement": "1-sentence marketplace positioning"
}`,
      brand_strategy: `{
  "campaignName": "${form.name}",
  "brandIdentity": "Mission + vision + 3 core values (one line each)",
  "toneOfVoice": "Tone: 3 adjectives + 1 example sentence",
  "messagingFramework": "Core message + 3 pillars (one line each)",
  "storytellingStrategy": "2-sentence brand narrative arc",
  "brandGuidelines": "3 brand guidelines: visual, verbal, behavioral",
  "tagline": "2 tagline options with 1-word rationale each",
  "emailSubject": "email subject line",
  "emailBody": "1-paragraph brand launch email",
  "linkedinPost": "50-word LinkedIn brand announcement with hashtags",
  "instagramCaption": "40-word Instagram post with hashtags",
  "adHeadline": "ad headline (30 chars max)",
  "adBody": "ad copy (90 chars max)",
  "campaignCalendar": "${form.campaignDays||7}-day action schedule",
  "positioningStatement": "1-sentence brand positioning"
}`,
      funnel_cro: `{
  "campaignName": "${form.name}",
  "funnelAudit": "Top 2 funnel drop-off points with fix",
  "funnelStages": "Awareness→Interest→Desire→Action: 1-line tactic each",
  "abTestVariants": "2 A/B test ideas: control vs variant",
  "ctaOptimizations": "3 high-converting CTA copy variants",
  "landingPageCopy": "Headline + subheadline + 2 bullets + CTA",
  "conversionTips": "3 CRO quick wins",
  "heatmapInsights": "2 UX friction points and fix",
  "emailSubject": "email subject line",
  "emailBody": "1-paragraph CRO recommendations email",
  "linkedinPost": "50-word LinkedIn post with hashtags",
  "campaignCalendar": "Week 1: Audit | Week 2-3: Test | Week 4: Analyze | Month 2+: Scale",
  "positioningStatement": "1-sentence conversion-optimized value prop"
}`,
      pr_reputation: `{
  "campaignName": "${form.name}",
  "reputationAudit": "2-sentence reputation audit: sentiment and key gaps",
  "crisisPlaybook": "3-step crisis response plan with response script",
  "pressRelease": "Press release: headline + 2-paragraph body + quote",
  "mediaPitch": "40-word media pitch with story angle",
  "reviewResponseTemplates": "2 positive + 2 negative review response templates",
  "reputationBuildingPlan": "4-week plan: Week 1-4 key action each",
  "prCalendar": "Q1-Q4 PR themes and key media moments",
  "linkedinPost": "50-word thought leadership post with hashtags",
  "emailSubject": "email subject line",
  "emailBody": "1-paragraph stakeholder email",
  "campaignCalendar": "${form.campaignDays||7}-day action schedule",
  "positioningStatement": "1-sentence reputation positioning"
}`,
      crm_lifecycle: `{
  "campaignName": "${form.name}",
  "customerSegments": "3 segments: persona name + key behavior + message (one line each)",
  "leadScoringModel": "3 scoring criteria with point values and handoff threshold",
  "onboardingSequence": "3-email onboarding: subject + 30-word body each",
  "winBackCampaign": "2-email win-back: We Miss You + Final Chance (30-word body each)",
  "retentionPlan": "Month 1-3 retention tactics (one line each)",
  "lifetimeValueStrategy": "3 LTV tactics: upsell, cross-sell, loyalty",
  "churnPrevention": "2 churn signals + 1 intervention sequence",
  "emailSubject": "email subject line",
  "emailBody": "1-paragraph lifecycle briefing email",
  "linkedinPost": "50-word LinkedIn post with hashtags",
  "campaignCalendar": "${form.campaignDays||7}-day action schedule",
  "positioningStatement": "1-sentence customer-centric positioning"
}`,
      ads_creation: `{
  "campaignName": "${form.name}",
  "adStrategy": "1-sentence creative strategy and hook",
  "staticAdVariants": [
    { "headline": "headline (40 chars)", "primaryText": "primary text (125 chars)", "description": "description (25 chars)", "cta": "CTA button" },
    { "headline": "headline variant 2", "primaryText": "primary text variant 2", "description": "description 2", "cta": "CTA" },
    { "headline": "headline variant 3", "primaryText": "primary text variant 3", "description": "description 3", "cta": "CTA" }
  ],
  "carouselAdVariant": {
    "headline": "carousel headline",
    "slides": [
      { "title": "slide 1", "text": "slide 1 text" },
      { "title": "slide 2", "text": "slide 2 text" },
      { "title": "slide 3", "text": "slide 3 text" }
    ],
    "cta": "CTA"
  },
  "videoStillAdVariant": {
    "hook": "3-second hook line",
    "script": "15-second script (3 beats)",
    "caption": "social caption",
    "cta": "CTA"
  },
  "adHeadlineVariants": ["headline 1", "headline 2", "headline 3"],
  "landingPageTips": "2 conversion tips"
}`,
      paid_advertising: `{
  "campaignName": "${form.name}",
  "adStrategy": "1-sentence paid media strategy and budget split",
  "metaAdsCopy": "2 Meta ad variants: Primary Text + Headline + CTA each",
  "googleAdsCopy": "2 Google Search ads: 2 headlines + 1 description each",
  "tiktokAdsCopy": "1 TikTok 15-second script with caption",
  "linkedinAdsCopy": "1 LinkedIn Sponsored Content: intro + headline + CTA",
  "audienceTargeting": "Target audience per platform (1 line each): Meta, Google, TikTok, LinkedIn",
  "budgetAllocation": "Budget % by platform with expected ROAS",
  "abTestPlan": "2 A/B test ideas with control vs variant",
  "emailSubject": "email subject line",
  "emailBody": "1-paragraph campaign launch email",
  "campaignCalendar": "${form.campaignDays||7}-day action schedule",
  "positioningStatement": "1-sentence campaign hook"
}`,
      ai_cfo: `{
  "campaignName": "${form.name}",
  "financialForecast": "Q1-Q4 revenue targets with growth assumption",
  "budgetAllocation": "Top 3 channels with % budget and expected ROI",
  "unitEconomics": "CAC, LTV, LTV:CAC ratio, payback period",
  "cashFlowProjection": "Q1-Q4 cash flow milestones",
  "investmentPriorities": "Top 3 marketing investments with ROI rationale",
  "costReductionOpportunities": "3 cost optimization opportunities",
  "kpiDashboard": "Key KPIs: Revenue, CAC, LTV, ROAS, Gross Margin with targets",
  "emailSubject": "email subject line",
  "emailBody": "1-paragraph CFO summary email",
  "linkedinPost": "50-word LinkedIn post on marketing ROI with hashtags",
  "campaignCalendar": "${form.campaignDays||7}-day action schedule",
  "positioningStatement": "1-sentence financial positioning"
}`,
      ai_cto: `{
  "campaignName": "${form.name}",
  "techStackAudit": "Keep/Replace/Add: 2 tools each with reason",
  "aiIntegrationPlan": "30/60/90-day AI tool roadmap (one action each)",
  "automationBlueprint": "3 key automation workflows: trigger + action + outcome",
  "dataInfrastructure": "3 data sources to connect + segmentation approach",
  "performanceOptimization": "Top 3 technical optimizations with impact",
  "integrationMap": "CRM → Email → Ads → Analytics flow (1 tool each)",
  "securityCompliance": "3 security/compliance checkpoints",
  "emailSubject": "email subject line",
  "emailBody": "1-paragraph tech strategy email",
  "linkedinPost": "50-word LinkedIn post on AI marketing with hashtags",
  "campaignCalendar": "${form.campaignDays||7}-day action schedule",
  "positioningStatement": "1-sentence tech differentiation"
}`,
      ai_cro_exec: `{
  "campaignName": "${form.name}",
  "revenueStrategy": "Q1-Q4 revenue targets with primary growth lever each",
  "partnershipPlan": "3 partnership opportunities with revenue impact",
  "salesEnablementKit": "30-word pitch + top 3 objections + 1 closing technique",
  "monetizationModels": "2 monetization models with pricing and target customer",
  "revenueLevers": "Top 3 revenue levers: new sales, upsell, retention",
  "clientAcquisitionPlan": "Month 1-3 acquisition sprint (key action per month)",
  "upsellCrossSellStrategy": "3 upsell/cross-sell triggers with offer",
  "emailSubject": "email subject line",
  "emailBody": "1-paragraph revenue strategy email",
  "linkedinPost": "50-word LinkedIn post with hashtags",
  "campaignCalendar": "${form.campaignDays||7}-day action schedule",
  "positioningStatement": "1-sentence revenue positioning"
}`,
      ai_ceo: `{
  "campaignName": "${form.name}",
  "visionStatement": "3-year vision + mission in 2 sentences",
  "strategicPriorities": "Top 3 priorities: what, why, success metric each",
  "marketOpportunities": "2 market opportunities with TAM and entry approach",
  "competitiveAdvantage": "3 competitive moats to build in 12 months",
  "ecosystemStrategy": "2 ecosystems to join/build and why",
  "executiveSummary": "2-sentence board-ready summary: position and strategic ask",
  "pivotScenarios": "2 pivot triggers with fast-pivot action",
  "emailSubject": "email subject line",
  "emailBody": "1-paragraph leadership team email",
  "linkedinPost": "50-word CEO thought leadership post with hashtags",
  "campaignCalendar": "${form.campaignDays||7}-day action schedule",
  "positioningStatement": "1-sentence company positioning"
}`,
      ai_compliance: `{
  "campaignName": "${form.name}",
  "complianceAudit": "GDPR/CCPA/CAN-SPAM: pass/fail + top 2 remediation steps",
  "privacyPolicy": "3 privacy policy must-haves: consent, opt-out, retention",
  "advertisingCompliance": "Top 3 platform compliance rules (Meta, Google, LinkedIn)",
  "aiContentGuidance": "2 AI content disclosure requirements",
  "dataGovernance": "3 data governance rules: access, retention, breach",
  "riskMatrix": "Top 3 marketing risks with likelihood and mitigation",
  "complianceCalendar": "Q1-Q4 compliance checkpoints",
  "emailSubject": "email subject line",
  "emailBody": "1-paragraph compliance briefing email",
  "linkedinPost": "50-word LinkedIn post on compliance with hashtags",
  "campaignCalendar": "${form.campaignDays||7}-day action schedule",
  "positioningStatement": "1-sentence trust-driven positioning"
}`,
    };
    return schemas[campaignType] || baseSchema;
  };

  const eventUrlInstruction = (isEvent && form.eventUrl)
    ? `\nIMPORTANT: The event page URL is: ${form.eventUrl}\nYou MUST include this URL in every social media post, email body, and WhatsApp message so readers can register or learn more. Add it naturally at the end of each post (e.g. "Register here: ${form.eventUrl}" or "Learn more: ${form.eventUrl}").\n`
    : '';

  const prompt = `You are an expert AI CMO (Chief Marketing Officer) with 20+ years of experience. Generate a complete, professional ${campaignType.replace(/_/g, " ")} package.

${context}
${eventUrlInstruction}
Return ONLY valid JSON matching this exact schema, no markdown, no explanation:
${getOutputSchema()}`;

  // llama-3.1-8b-instant free tier: 6000 TPM = input + max_tokens.
  // Schema trimming cut input from ~4181 → ~1612 tokens.
  // 1612 input + 3500 max_tokens = 5112 — safely under 6000 TPM limit.
  const requestBody = JSON.stringify({
    model: "llama-3.1-8b-instant",
    messages: [
      { role: "system", content: "You are an expert AI CMO. Respond ONLY with valid JSON — no markdown, no explanation, no extra text." },
      { role: "user", content: prompt },
    ],
    temperature: 0.7,
    max_tokens: 3500,
  });

  const controller = new AbortController();
  const timeoutId  = setTimeout(() => controller.abort(), 45000);

  let res;
  try {
    if (apiKey && apiKey !== "your_groq_api_key_here") {
      res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
        body: requestBody,
        signal: controller.signal,
      });
    } else {
      res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: requestBody,
        signal: controller.signal,
      });
    }
  } catch (networkErr) {
    if (networkErr.name === "AbortError") throw new Error("AI generation timed out. Please try again.");
    throw new Error("Network error — check your connection and try again.");
  } finally {
    clearTimeout(timeoutId);
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = err?.error?.message || "";
    if (res.status === 401) throw new Error("AI service key is invalid. Please contact support.");
    if (res.status === 429) throw new Error("AI rate limit reached. Please wait 30 seconds and try again.");
    throw new Error(msg || `AI generation failed (${res.status}). Please try again.`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content || "";
  const finishReason = data.choices?.[0]?.finish_reason || "unknown";
  console.log(`[Groq] finish_reason=${finishReason} tokens=${data.usage?.total_tokens||"?"}`);
  console.log(`[Groq] response preview: ${text.substring(0, 300)}`);

  // 1 — markdown code block
  let raw = text.match(/```json\s*([\s\S]*?)```/)?.[1]
           ?? text.match(/```\s*([\s\S]*?)```/)?.[1];

  // 2 — bare JSON object anywhere in the text
  if (!raw) {
    const m = text.match(/\{[\s\S]*\}/);
    if (m) raw = m[0];
  }

  // 3 — salvage truncated JSON (finish_reason === "length" = hit max_tokens)
  if (!raw) {
    const start = text.indexOf("{");
    if (start !== -1) {
      raw = text.slice(start) + "}"; // close it and hope for the best
    }
  }

  if (!raw) throw new Error("AI returned no JSON. Please try again.");

  try { return JSON.parse(raw); } catch (_) {}
  // fix unescaped newlines inside string values
  const fixed = raw.replace(/"(?:[^"\\]|\\.)*"/g, (s) =>
    s.replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\t/g, "\\t"),
  );
  try { return JSON.parse(fixed); } catch (_) {}
  throw new Error("Could not parse AI response. Please try again.");
}

// â"€â"€â"€ Generate N-day daily schedule (unique content per day) â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
async function generateDailySchedule(form, campaignType, days, postsPerDay = 1) {
  if (days <= 1 && postsPerDay <= 1) return [];
  const apiKey = import.meta.env.VITE_GROQ_API_KEY || "";
  if (!apiKey) return [];

  const totalSlots = days * postsPerDay
  // For large calendars (>14 total slots) use compact per-slot schema to stay within token limits
  const compact = totalSlots > 14
  const slotSchema = compact
    ? `{ "linkedinPost": "60-word LinkedIn post + 3 hashtags", "instagramCaption": "50-word caption + emojis + 3 hashtags", "contentIdea": "one actionable content idea for any platform" }`
    : `{ "linkedinPost": "unique LinkedIn post (100-200 words with hashtags)", "instagramCaption": "unique Instagram caption (80-120 words with emojis and hashtags)", "facebookPost": "unique Facebook post (80-150 words)", "whatsappMessage": "unique WhatsApp message (40-60 words)" }`
  const daySchema = postsPerDay > 1
    ? `{ "day": 1, "theme": "one-sentence theme for this day", "focus": "Awareness | Education | Engagement | Conversion | Retention", "slots": [${Array.from({ length: postsPerDay }, () => slotSchema).join(', ')}], "emailSubject": "email subject line for this day (goes with slots[0] only)", "emailBody": "short email body, 2 paragraphs (goes with slots[0] only)" }`
    : `{ "day": 1, "theme": "one-sentence theme for this day", "focus": "Awareness | Education | Engagement | Conversion | Retention", "linkedinPost": "unique LinkedIn post (100-200 words with hashtags)", "instagramCaption": "unique Instagram caption (80-120 words with emojis and hashtags)", "facebookPost": "unique Facebook post (80-150 words)", "whatsappMessage": "unique WhatsApp message (40-60 words)", "emailSubject": "email subject line for this day", "emailBody": "short email body (2 paragraphs)" }`

  const slotsNote = postsPerDay > 1
    ? `\n\nEach day has ${postsPerDay} posts (a "slots" array of ${postsPerDay} objects) published at different times of that day. Each slot's content MUST be genuinely distinct from the other slots that same day — a different angle, hook, or piece of the message — never the same post repeated.`
    : ''

  const prompt = `You are an AI CMO generating a ${days}-day social media campaign schedule.

Campaign: ${form.name}
Type: ${campaignType}
Description: ${form.description}
Goal: ${form.goal}
Target Audience: ${(form.targetAudience || []).join(", ")}
Brand: ${form.brandName || form.name}${slotsNote}

Generate a ${days}-day campaign schedule. Return ONLY a valid JSON array with exactly ${days} objects:
[
  ${daySchema}
]`

  const tokenBudget = compact ? Math.min(6000, totalSlots * 80 + 400) : Math.min(6000, totalSlots * 200 + 500)

  const requestBody = JSON.stringify({
    model: "llama-3.1-8b-instant",
    messages: [
      { role: "system", content: "You are an AI CMO. Respond ONLY with a valid JSON array, no markdown, no explanation." },
      { role: "user", content: prompt },
    ],
    temperature: 0.8,
    max_tokens: tokenBudget,
  });

  // The calendar call fires right after the main-copy Groq call, on the same
  // model/key — a 429 here is usually a transient per-minute rate limit, not a
  // hard failure, so retry with backoff instead of silently returning an empty
  // calendar (which used to mean days 2..N never got generated or scheduled).
  const MAX_ATTEMPTS = 3
  let lastRes = null
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: requestBody,
      });
      if (res.ok) { lastRes = res; break }
      if (res.status !== 429 || attempt === MAX_ATTEMPTS - 1) { lastRes = res; break }

      // Groq embeds the actual cooldown in the error body (e.g. "try again in 4.2s");
      // fall back to exponential backoff if that's not present.
      let waitMs = 2500 * Math.pow(2, attempt)
      try {
        const errBody = await res.clone().json()
        const m = (errBody?.error?.message || "").match(/try again in ([\d.]+)s/i)
        if (m) waitMs = Math.ceil(parseFloat(m[1]) * 1000) + 300
      } catch {}
      await new Promise(r => setTimeout(r, Math.min(waitMs, 15000)))
    } catch {
      if (attempt === MAX_ATTEMPTS - 1) return []
    }
  }

  if (!lastRes || !lastRes.ok) return [];
  try {
    const data = await lastRes.json();
    const text = data.choices?.[0]?.message?.content || "";
    const match = text.match(/```json\s*([\s\S]*?)```/) || text.match(/(\[[\s\S]*\])/);
    if (!match) return [];
    try {
      const raw = match[1];
      const fixed = raw.replace(/"(?:[^"\\]|\\.)*"/g, (s) =>
        s.replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\t/g, "\\t")
      );
      return JSON.parse(fixed);
    } catch { return []; }
  } catch { return []; }
}

const campaignMeta = {
  event: {
    title: "Event Campaign",
    color: "#c8973e",
    icon: <Calendar size={22} />,
    badge: "STARTER",
  },
  product: {
    title: "Product Campaign",
    color: "#c8973e",
    icon: <Package size={22} />,
    badge: "GROWTH",
  },
  brand: {
    title: "Brand Campaign",
    color: "#a855f7",
    icon: <Zap size={22} />,
    badge: "ENTERPRISE",
  },
  growth_strategy: {
    title: "Growth Strategy",
    color: "#10b981",
    icon: <Zap size={22} />,
    badge: "STRATEGY",
  },
  growth_agent: {
    title: "Growth Agent",
    color: "#f97316",
    icon: <TrendingUp size={22} />,
    badge: "GROWTH",
  },
  competitive_intel: {
    title: "Competitive Intel",
    color: "#f59e0b",
    icon: <Zap size={22} />,
    badge: "INTEL",
  },
  content_calendar: {
    title: "Content Calendar",
    color: "#3b82f6",
    icon: <Calendar size={22} />,
    badge: "CONTENT",
  },
  seo_blog: {
    title: "SEO & Blog",
    color: "#c8973e",
    icon: <Zap size={22} />,
    badge: "SEO",
  },
  email_drip: {
    title: "Email Drip Campaign",
    color: "#8b5cf6",
    icon: <Mail size={22} />,
    badge: "EMAIL",
  },
  influencer: {
    title: "Influencer & PR",
    color: "#ec4899",
    icon: <Zap size={22} />,
    badge: "INFLUENCE",
  },
  analytics_report: {
    title: "Analytics Report",
    color: "#f97316",
    icon: <Zap size={22} />,
    badge: "ANALYTICS",
  },
  sales_enablement: {
    title: "Sales Enablement",
    color: "#6366f1",
    icon: <Zap size={22} />,
    badge: "SALES",
  },
  event_full: {
    title: "ELEVATE Event",
    color: "#c8973e",
    icon: <Calendar size={22} />,
    badge: "ELEVATE",
  },
  marketplace: {
    title: "Marketplace Growth",
    color: "#14b8a6",
    icon: <Package size={22} />,
    badge: "MARKETPLACE",
  },
  brand_strategy: {
    title: "Brand Strategy",
    color: "#a855f7",
    icon: <Zap size={22} />,
    badge: "BRANDING",
  },
  funnel_cro: {
    title: "Funnel & CRO",
    color: "#ef4444",
    icon: <Zap size={22} />,
    badge: "CRO",
  },
  pr_reputation: {
    title: "PR & Reputation",
    color: "#06b6d4",
    icon: <Megaphone size={22} />,
    badge: "PR",
  },
  crm_lifecycle: {
    title: "CRM & Lifecycle",
    color: "#10b981",
    icon: <Users size={22} />,
    badge: "CRM",
  },
  paid_advertising: {
    title: "Paid Advertising",
    color: "#f59e0b",
    icon: <Target size={22} />,
    badge: "PAID ADS",
  },
  ai_cfo: {
    title: "AI CFO",
    color: "#22c55e",
    icon: <TrendingUp size={22} />,
    badge: "EXECUTIVE",
  },
  ai_cto: {
    title: "AI CTO",
    color: "#6366f1",
    icon: <Code2 size={22} />,
    badge: "EXECUTIVE",
  },
  ai_cro_exec: {
    title: "AI CRO",
    color: "#f97316",
    icon: <TrendingUp size={22} />,
    badge: "EXECUTIVE",
  },
  ai_ceo: {
    title: "AI CEO",
    color: "#c8973e",
    icon: <Brain size={22} />,
    badge: "EXECUTIVE",
  },
  ai_compliance: {
    title: "AI Compliance",
    color: "#64748b",
    icon: <Shield size={22} />,
    badge: "EXECUTIVE",
  },
  ads_creation: {
    title: "Ads Creation",
    color: "#f97316",
    icon: <Megaphone size={22} />,
    badge: "PACKAGE C",
  },
  ads_manager: {
    title: "Ads Manager Connect",
    color: "#3b82f6",
    icon: <Target size={22} />,
    badge: "PACKAGE C",
  },
  target_audience: {
    title: "Target Audience Selection",
    color: "#10b981",
    icon: <Users size={22} />,
    badge: "PACKAGE C",
  },
};

const CURRENCIES = [
  { value: 'USD', label: '$ USD' },
  { value: 'INR', label: '₹ INR' },
  { value: 'EUR', label: '€ EUR' },
  { value: 'GBP', label: '£ GBP' },
  { value: 'AED', label: 'AED' },
  { value: 'AUD', label: 'A$ AUD' },
  { value: 'CAD', label: 'C$ CAD' },
  { value: 'SGD', label: 'S$ SGD' },
  { value: 'FREE', label: 'Free' },
]

function PriceCurrencyField({ currency, amount, onCurrencyChange, onAmountChange, inputStyle }) {
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef(null)
  const selected = CURRENCIES.find(c => c.value === currency) || CURRENCIES[0]
  const isFree = currency === 'FREE'

  React.useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          style={{
            ...inputStyle,
            width: 'auto',
            minWidth: 100,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            padding: '12px 14px',
            userSelect: 'none',
          }}
        >
          <span>{selected.label}</span>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ opacity: 0.5, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
            <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        {open && (
          <div className="price-currency-dropdown" style={{
            position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 99999,
            background: '#1c1a13', border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 12, overflow: 'hidden', minWidth: 130,
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
          }}>
            {CURRENCIES.map(c => (
              <div
                key={c.value}
                onClick={() => { onCurrencyChange(c.value); setOpen(false) }}
                style={{
                  padding: '10px 16px', fontSize: 14, fontWeight: 500,
                  color: c.value === currency ? '#f97316' : '#f0ebe0',
                  background: c.value === currency ? 'rgba(249,115,22,0.1)' : 'transparent',
                  cursor: 'pointer', transition: 'background 0.12s',
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                }}
                onMouseEnter={e => { if (c.value !== currency) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                onMouseLeave={e => { if (c.value !== currency) e.currentTarget.style.background = 'transparent' }}
              >
                {c.label}
              </div>
            ))}
          </div>
        )}
      </div>
      <input
        value={isFree ? '' : amount}
        onChange={e => onAmountChange(e.target.value)}
        placeholder={isFree ? 'Free' : 'Enter amount'}
        disabled={isFree}
        style={{ ...inputStyle, flex: 1, opacity: isFree ? 0.4 : 1 }}
      />
    </div>
  )
}

// â"€â"€â"€ Main CampaignForm component â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
export default function CampaignForm() {
  const { type } = useParams();
  const navigate  = useNavigate();
  const location  = useLocation();
  const backPath  = location.state?.from;
  const prefill   = location.state?.prefill || null;
  const { user: authUser } = useAuth();
  // Free-trial users have no membership type ID. Show the social-connect panel
  // only for paid Package A members — leave the free-trial flow untouched.
  const isFreeUser = !getEvokeUserProfile()?.data?.memberShipTypeID;
  const fromPackageA = location.state?.from === "/package-a" && !isFreeUser;
  const meta = campaignMeta[type] || campaignMeta.product;

  const INDIAN_CITIES = [
    "Online / Virtual",
    // â"€â"€ India â"€â"€
    "Mumbai, India",
    "Delhi, India",
    "Bengaluru, India",
    "Hyderabad, India",
    "Chennai, India",
    "Kolkata, India",
    "Pune, India",
    "Ahmedabad, India",
    "Jaipur, India",
    "Surat, India",
    "Lucknow, India",
    "Kanpur, India",
    "Nagpur, India",
    "Indore, India",
    "Thane, India",
    "Bhopal, India",
    "Visakhapatnam, India",
    "Patna, India",
    "Vadodara, India",
    "Coimbatore, India",
    "Agra, India",
    "Madurai, India",
    "Nashik, India",
    "Faridabad, India",
    "Meerut, India",
    "Rajkot, India",
    "Varanasi, India",
    "Srinagar, India",
    "Aurangabad, India",
    "Amritsar, India",
    "Navi Mumbai, India",
    "Ranchi, India",
    "Howrah, India",
    "Ghaziabad, India",
    "Chandigarh, India",
    "Jodhpur, India",
    "Ludhiana, India",
    "Mysore, India",
    "Kochi, India",
    "Guwahati, India",
    "Bhubaneswar, India",
    "Thiruvananthapuram, India",
    "Noida, India",
    "Gurugram, India",
    // â"€â"€ United States â"€â"€
    "New York, USA",
    "Los Angeles, USA",
    "Chicago, USA",
    "Houston, USA",
    "Phoenix, USA",
    "Philadelphia, USA",
    "San Antonio, USA",
    "San Diego, USA",
    "Dallas, USA",
    "San Jose, USA",
    "Austin, USA",
    "Jacksonville, USA",
    "Fort Worth, USA",
    "Columbus, USA",
    "Charlotte, USA",
    "Indianapolis, USA",
    "San Francisco, USA",
    "Seattle, USA",
    "Denver, USA",
    "Nashville, USA",
    "Las Vegas, USA",
    "Portland, USA",
    "Memphis, USA",
    "Atlanta, USA",
    "Boston, USA",
    "Miami, USA",
    "Minneapolis, USA",
    "New Orleans, USA",
    "Washington DC, USA",
    // â"€â"€ United Kingdom â"€â"€
    "London, UK",
    "Manchester, UK",
    "Birmingham, UK",
    "Leeds, UK",
    "Glasgow, UK",
    "Sheffield, UK",
    "Bradford, UK",
    "Edinburgh, UK",
    "Liverpool, UK",
    "Bristol, UK",
    "Cardiff, UK",
    "Belfast, UK",
    "Leicester, UK",
    "Nottingham, UK",
    "Newcastle, UK",
    // â"€â"€ Germany â"€â"€
    "Berlin, Germany",
    "Hamburg, Germany",
    "Munich, Germany",
    "Cologne, Germany",
    "Frankfurt, Germany",
    "Stuttgart, Germany",
    "Dusseldorf, Germany",
    "Leipzig, Germany",
    "Dortmund, Germany",
    "Essen, Germany",
    "Bremen, Germany",
    "Dresden, Germany",
    // â"€â"€ France â"€â"€
    "Paris, France",
    "Marseille, France",
    "Lyon, France",
    "Toulouse, France",
    "Nice, France",
    "Nantes, France",
    "Strasbourg, France",
    "Bordeaux, France",
    "Lille, France",
    "Rennes, France",
    // â"€â"€ UAE â"€â"€
    "Dubai, UAE",
    "Abu Dhabi, UAE",
    "Sharjah, UAE",
    "Ajman, UAE",
    "Ras Al Khaimah, UAE",
    // â"€â"€ Saudi Arabia â"€â"€
    "Riyadh, Saudi Arabia",
    "Jeddah, Saudi Arabia",
    "Mecca, Saudi Arabia",
    "Medina, Saudi Arabia",
    "Dammam, Saudi Arabia",
    // â"€â"€ Australia â"€â"€
    "Sydney, Australia",
    "Melbourne, Australia",
    "Brisbane, Australia",
    "Perth, Australia",
    "Adelaide, Australia",
    "Gold Coast, Australia",
    "Canberra, Australia",
    "Hobart, Australia",
    // â"€â"€ Canada â"€â"€
    "Toronto, Canada",
    "Vancouver, Canada",
    "Montreal, Canada",
    "Calgary, Canada",
    "Edmonton, Canada",
    "Ottawa, Canada",
    "Winnipeg, Canada",
    "Quebec City, Canada",
    // â"€â"€ Singapore â"€â"€
    "Singapore",
    // â"€â"€ Japan â"€â"€
    "Tokyo, Japan",
    "Osaka, Japan",
    "Yokohama, Japan",
    "Nagoya, Japan",
    "Sapporo, Japan",
    "Fukuoka, Japan",
    "Kobe, Japan",
    "Kyoto, Japan",
    // â"€â"€ China â"€â"€
    "Beijing, China",
    "Shanghai, China",
    "Guangzhou, China",
    "Shenzhen, China",
    "Chengdu, China",
    "Hangzhou, China",
    "Wuhan, China",
    "Xi'an, China",
    // â"€â"€ South Korea â"€â"€
    "Seoul, South Korea",
    "Busan, South Korea",
    "Incheon, South Korea",
    "Daegu, South Korea",
    // â"€â"€ Netherlands â"€â"€
    "Amsterdam, Netherlands",
    "Rotterdam, Netherlands",
    "The Hague, Netherlands",
    "Utrecht, Netherlands",
    "Eindhoven, Netherlands",
    // â"€â"€ Spain â"€â"€
    "Madrid, Spain",
    "Barcelona, Spain",
    "Valencia, Spain",
    "Seville, Spain",
    "Bilbao, Spain",
    "Malaga, Spain",
    "Zaragoza, Spain",
    // â"€â"€ Italy â"€â"€
    "Rome, Italy",
    "Milan, Italy",
    "Naples, Italy",
    "Turin, Italy",
    "Florence, Italy",
    "Venice, Italy",
    "Bologna, Italy",
    "Genoa, Italy",
    // â"€â"€ Brazil â"€â"€
    "Sao Paulo, Brazil",
    "Rio de Janeiro, Brazil",
    "Brasilia, Brazil",
    "Salvador, Brazil",
    "Fortaleza, Brazil",
    "Belo Horizonte, Brazil",
    "Manaus, Brazil",
    // â"€â"€ Mexico â"€â"€
    "Mexico City, Mexico",
    "Guadalajara, Mexico",
    "Monterrey, Mexico",
    "Cancun, Mexico",
    "Tijuana, Mexico",
    "Puebla, Mexico",
    // â"€â"€ South Africa â"€â"€
    "Johannesburg, South Africa",
    "Cape Town, South Africa",
    "Durban, South Africa",
    "Pretoria, South Africa",
    "Port Elizabeth, South Africa",
    // â"€â"€ Nigeria â"€â"€
    "Lagos, Nigeria",
    "Abuja, Nigeria",
    "Kano, Nigeria",
    "Ibadan, Nigeria",
    // â"€â"€ Kenya â"€â"€
    "Nairobi, Kenya",
    "Mombasa, Kenya",
    // â"€â"€ Egypt â"€â"€
    "Cairo, Egypt",
    "Alexandria, Egypt",
    "Giza, Egypt",
    // â"€â"€ Pakistan â"€â"€
    "Karachi, Pakistan",
    "Lahore, Pakistan",
    "Islamabad, Pakistan",
    "Rawalpindi, Pakistan",
    // â"€â"€ Bangladesh â"€â"€
    "Dhaka, Bangladesh",
    "Chittagong, Bangladesh",
    // â"€â"€ Sri Lanka â"€â"€
    "Colombo, Sri Lanka",
    "Kandy, Sri Lanka",
    // â"€â"€ Nepal â"€â"€
    "Kathmandu, Nepal",
    // â"€â"€ Malaysia â"€â"€
    "Kuala Lumpur, Malaysia",
    "George Town, Malaysia",
    "Johor Bahru, Malaysia",
    // â"€â"€ Indonesia â"€â"€
    "Jakarta, Indonesia",
    "Surabaya, Indonesia",
    "Bandung, Indonesia",
    "Bali, Indonesia",
    // â"€â"€ Philippines â"€â"€
    "Manila, Philippines",
    "Cebu, Philippines",
    "Davao, Philippines",
    // â"€â"€ Thailand â"€â"€
    "Bangkok, Thailand",
    "Chiang Mai, Thailand",
    "Phuket, Thailand",
    // â"€â"€ Vietnam â"€â"€
    "Ho Chi Minh City, Vietnam",
    "Hanoi, Vietnam",
    "Da Nang, Vietnam",
    // â"€â"€ Russia â"€â"€
    "Moscow, Russia",
    "Saint Petersburg, Russia",
    "Novosibirsk, Russia",
    // â"€â"€ Turkey â"€â"€
    "Istanbul, Turkey",
    "Ankara, Turkey",
    "Izmir, Turkey",
    // â"€â"€ Switzerland â"€â"€
    "Zurich, Switzerland",
    "Geneva, Switzerland",
    "Basel, Switzerland",
    // â"€â"€ Sweden â"€â"€
    "Stockholm, Sweden",
    "Gothenburg, Sweden",
    "Malmo, Sweden",
    // â"€â"€ Norway â"€â"€
    "Oslo, Norway",
    "Bergen, Norway",
    // â"€â"€ Denmark â"€â"€
    "Copenhagen, Denmark",
    "Aarhus, Denmark",
    // â"€â"€ Finland â"€â"€
    "Helsinki, Finland",
    "Tampere, Finland",
    // â"€â"€ Belgium â"€â"€
    "Brussels, Belgium",
    "Antwerp, Belgium",
    "Ghent, Belgium",
    // â"€â"€ Austria â"€â"€
    "Vienna, Austria",
    "Graz, Austria",
    "Salzburg, Austria",
    // â"€â"€ Portugal â"€â"€
    "Lisbon, Portugal",
    "Porto, Portugal",
    // â"€â"€ Greece â"€â"€
    "Athens, Greece",
    "Thessaloniki, Greece",
    // â"€â"€ Poland â"€â"€
    "Warsaw, Poland",
    "Krakow, Poland",
    "WrocÅ‚aw, Poland",
    "GdaÅ„sk, Poland",
    // â"€â"€ Israel â"€â"€
    "Tel Aviv, Israel",
    "Jerusalem, Israel",
    "Haifa, Israel",
    // â"€â"€ Qatar â"€â"€
    "Doha, Qatar",
    // â"€â"€ Kuwait â"€â"€
    "Kuwait City, Kuwait",
    // â"€â"€ Bahrain â"€â"€
    "Manama, Bahrain",
    // â"€â"€ Oman â"€â"€
    "Muscat, Oman",
    // â"€â"€ New Zealand â"€â"€
    "Auckland, New Zealand",
    "Wellington, New Zealand",
    "Christchurch, New Zealand",
    // â"€â"€ Argentina â"€â"€
    "Buenos Aires, Argentina",
    "Cordoba, Argentina",
    "Rosario, Argentina",
    // â"€â"€ Chile â"€â"€
    "Santiago, Chile",
    // â"€â"€ Colombia â"€â"€
    "Bogota, Colombia",
    "Medellin, Colombia",
    // â"€â"€ Peru â"€â"€
    "Lima, Peru",
    // â"€â"€ Ireland â"€â"€
    "Dublin, Ireland",
    "Cork, Ireland",
    // â"€â"€ Czech Republic â"€â"€
    "Prague, Czech Republic",
    "Brno, Czech Republic",
    // â"€â"€ Hungary â"€â"€
    "Budapest, Hungary",
    // â"€â"€ Romania â"€â"€
    "Bucharest, Romania",
    // â"€â"€ Ukraine â"€â"€
    "Kyiv, Ukraine",
    "Lviv, Ukraine",
  ];

  const PLATFORM_OPTIONS = [
    { key: "linkedin",    label: "LinkedIn",    color: "#0a66c2" },
    { key: "instagram",   label: "Instagram",   color: "#e1306c" },
    { key: "facebook",    label: "Facebook",    color: "#1877f2" },
    { key: "tiktok",      label: "TikTok",      color: "#ff0050" },
    { key: "whatsapp",    label: "WhatsApp",    color: "#25d366" },
    { key: "email",       label: "Email",       color: "#c8973e" },
    { key: "eventbrite",  label: "Eventbrite",  color: "#F05537" },
    { key: "luma",        label: "Luma",        color: "#6C47FF" },
    { key: "meetup",      label: "Meetup",      color: "#ED1C40" },
  ];

  const [form, setForm] = useState({
    name: "",
    description: prefill?.description || "",
    imageFile: null,
    imagePreview: null,
    date: "",
    time: "",
    location: "",
    eventLocations: [],
    eventUrl: "",
    website: prefill?.website || "",
    price: "",
    targetAudience: Array.isArray(prefill?.targetAudience) ? prefill.targetAudience : [],
    goal: "",
    goalType: prefill?.goalType || "",
    endDate: "",
    eventUrlMode: "manual",
    brandName: prefill?.brandName || "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    postDate: "",
    postTime: "09:00",
    postsPerDay: 1,
    postTimes: ["09:00"],
    campaignDays: 7,
    platforms: ["linkedin", "instagram", "facebook", "email", "whatsapp"],
    whatsappRecipients: "",
    emailRecipients: "",
    // New fields for extended CMO types
    competitorUrl: "",
    industry: prefill?.industry || "",
    budget: "",
    keywords: "",
    reportPeriod: "",
    funnelStage: "",
    toneOfVoice: prefill?.toneOfVoice || "",
    socialPlatforms: [],
    contentTypes: [],
    postingFrequency: "",
  });
  const [kbLoaded, setKbLoaded] = useState(false);
  const [connectedAccounts, setConnectedAccounts] = useState({});
  const [audienceOpen, setAudienceOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const [locationSearch, setLocationSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState(""); // 'uploading-image' | 'uploading-video' | 'generating' | 'posting'
  const [submitError, setSubmitError] = useState("");
  const [posterGenerating, setPosterGenerating] = useState(false);
  const [generatingEventUrl, setGeneratingEventUrl] = useState(false);
  const [generatedEventUrl, setGeneratedEventUrl] = useState("");
  const [eventUrlError, setEventUrlError] = useState("");

  // Event image upload (for LinkedIn / Instagram / Facebook)
  const [eventImageFile, setEventImageFile] = useState(null);
  const [eventImagePreview, setEventImagePreview] = useState(null);
  const [eventImageUploading, setEventImageUploading] = useState(false);
  const [eventImageUploadProgress, setEventImageUploadProgress] = useState(0);

  // Product visual converters
  const [assetResults,    setAssetResults]    = useState({}); // { [key]: { url, text, type } }
  const [generatingAsset, setGeneratingAsset] = useState(null); // key of converter running

  const runConverter = async (conv) => {
    if (!form.imagePreview) return;
    if (generatingAsset) return;
    setGeneratingAsset(conv.key);
    try {
      if (conv.type === "video") {
        if (!WS_KEY) throw new Error("WaveSpeed API key not set in .env");
        // get image URL from imgbb for wavespeed
        let imgUrl = "";
        if (form.imageFile) imgUrl = await uploadToImgBB(form.imageFile);
        else imgUrl = form.imagePreview;
        const prompt = conv.prompt(form.name, form.description, form.brandName);
        const job = await wsSubmit(conv.model, prompt, imgUrl, 5);
        if (!job?.urls?.get) throw new Error("No job returned");
        const videoUrl = await wsPoll(job.urls.get);
        setAssetResults((p) => ({ ...p, [conv.key]: { url: videoUrl, type: "video" } }));
      } else {
        if (!GEM_KEY) throw new Error("Gemini API key not set in .env");
        const prompt = conv.prompt(form.name, form.description, form.brandName);
        const text = await gemText(prompt);
        setAssetResults((p) => ({ ...p, [conv.key]: { text, type: "text" } }));
      }
    } catch (e) {
      setAssetResults((p) => ({ ...p, [conv.key]: { error: e.message, type: conv.type } }));
    } finally {
      setGeneratingAsset(null);
    }
  };

  const audienceOptions = [
    // Age / Generation
    "Gen Z (18-24)",
    "Millennials (25-40)",
    "Gen X (41-56)",
    "Baby Boomers (57+)",
    // Investors
    "Investors / VCs",
    "Angel Investors",
    "Stock & Crypto Investors",
    // Professional
    "Professionals / B2B",
    "C-Suite / Executives",
    "Marketing Managers",
    "Founders & CEOs",
    "Entrepreneurs",
    "Freelancers",
    "Sales Teams",
    "HR Professionals",
    "Finance Professionals",
    "Developers / Engineers",
    // Business Size
    "Small Business Owners",
    "Mid-Market Companies",
    "Enterprise Clients",
    "Startups",
    "Agencies",
    // Consumer Segments
    "Students",
    "Parents",
    "Homeowners",
    "First-Time Buyers",
    "Luxury Buyers",
    "Budget-Conscious Shoppers",
    // Interests
    "Tech Enthusiasts",
    "Fitness & Wellness",
    "Fashion & Lifestyle",
    "Food & Beverage Lovers",
    "Travel Enthusiasts",
    "Home & Family",
    "Gamers",
    "Health-Conscious Consumers",
    "Eco-Conscious / Sustainability",
    "Sports & Outdoor",
    // Industry-specific
    "E-commerce Shoppers",
    "SaaS Users",
    "Healthcare Professionals",
    "Real Estate Investors",
    "Event Attendees",
    "Content Creators / Influencers",
    "Investors / HNIs",
  ];

  const set = (key, val) => setForm((p) => ({ ...p, [key]: val }));

  // Default time-of-day spread when a new "posts per day" slot is added
  const DEFAULT_SLOT_TIMES = ["09:00", "13:00", "17:00"];
  const setPostsPerDay = (count) => setForm((p) => {
    const times = Array.from({ length: count }, (_, i) => p.postTimes?.[i] || DEFAULT_SLOT_TIMES[i] || "09:00");
    return { ...p, postsPerDay: count, postTimes: times };
  });
  const setPostTimeAt = (index, val) => setForm((p) => {
    const times = [...(p.postTimes || [])];
    times[index] = val;
    return { ...p, postTimes: times };
  });

  // ── Brand KB auto-fill ──────────────────────────────────────
  const CF_INDUSTRY_MAP = {
    digital_marketing: 'Marketing & Advertising', tech_saas: 'Technology / SaaS',
    ecommerce: 'E-commerce / Retail', fashion: 'Fashion & Apparel',
    food_beverage: 'Food & Beverage', health_wellness: 'Healthcare / Wellness',
    finance_fintech: 'Finance / Fintech', education: 'Education / EdTech',
    real_estate: 'Real Estate', media_entertainment: 'Media & Entertainment',
    hospitality: 'Travel & Hospitality', beauty: 'Fashion & Apparel',
    automotive: 'Manufacturing', ngo_nonprofit: 'Non-profit / NGO',
    agency: 'Marketing & Advertising',
  }
  const CF_GEO_MAP = {
    india_tier1: 'India', india_tier1_2: 'India', india_all: 'India',
    uae: 'Middle East', middle_east: 'Middle East', southeast_asia: 'Southeast Asia',
    usa: 'United States', europe: 'Europe', uk: 'United Kingdom',
    australia: 'Australia / New Zealand', global: 'Global',
  }
  const CF_BUDGET_MAP = {
    under_1k: 'Under ₹50,000 / $500', '1k_5k': '₹2L–₹5L / $2,000–$5,000',
    '5k_15k': '₹5L–₹15L / $5,000–$15,000', '15k_50k': '₹15L–₹50L / $15,000–$50,000',
    above_50k: 'Above ₹50L / $50,000+',
  }

  // For email drip, only email platform is relevant
  useEffect(() => {
    if (type === 'email_drip') set('platforms', ['email'])
  }, [type])

  useEffect(() => {
    if (!authUser?.uid) return
    getKnowledgeBase(authUser.uid).then(kb => {
      if (!kb) return
      setForm(prev => {
        const updated = { ...prev }
        // For product campaigns, don't pre-fill name — user must enter the specific product
        if (!prev.name && kb.companyName && type !== 'product') updated.name = kb.companyName
        if (!prev.brandName && kb.companyName)          updated.brandName = kb.companyName
        if (!prev.website   && kb.website)              updated.website = kb.website
        if (!prev.industry  && kb.industry)             updated.industry = CF_INDUSTRY_MAP[kb.industry] || ''
        if (!prev.location  && kb.geographicFocus)      updated.location = CF_GEO_MAP[kb.geographicFocus] || ''
        if (!prev.budget    && kb.marketingBudget)      updated.budget = CF_BUDGET_MAP[kb.marketingBudget] || ''
        if (!prev.toneOfVoice && kb.toneOfVoice)        updated.toneOfVoice = kb.toneOfVoice
        if (!prev.description && kb.productService) {
          const goals = (kb.primaryObjectives || []).join(', ')
          updated.description = kb.productService + (goals ? `. Goals: ${goals}` : '')
        }
        if (prev.targetAudience.length === 0 && kb.audienceType) {
          const aud = []
          if (kb.audienceType === 'b2b') aud.push('Professionals / B2B')
          else if (kb.audienceType === 'b2c') aud.push('Millennials (25-40)')
          else if (kb.audienceType === 'd2c') aud.push('Millennials (25-40)')
          if (aud.length) updated.targetAudience = aud
        }
        if (!prev.goalType && kb.primaryObjectives?.length) {
          const GOAL_MAP = {
            brand_awareness: 'Increase Brand Awareness',
            lead_generation: 'Generate Leads',
            sales_conversion: 'Drive Sales / Conversions',
            community_growth: 'Grow Community / Following',
            product_launch: 'Launch New Product / Event',
            website_traffic: 'Boost Website Traffic',
          }
          updated.goalType = GOAL_MAP[kb.primaryObjectives[0]] || 'Drive Sales / Conversions'
        } else if (!prev.goalType) {
          updated.goalType = 'Drive Sales / Conversions'
        }
        return updated
      })
      setKbLoaded(true)
    }).catch(() => {})
  }, [authUser?.uid])

  const handleImageFile = (file) => {
    if (!file) return;
    set("imageFile", file);
    set("imagePreview", URL.createObjectURL(file));
  };

  const toggleAudience = (opt) => {
    set(
      "targetAudience",
      form.targetAudience.includes(opt)
        ? form.targetAudience.filter((a) => a !== opt)
        : [...form.targetAudience, opt],
    );
  };

  const togglePlatform = (key) => {
    set(
      "platforms",
      form.platforms.includes(key)
        ? form.platforms.filter((p) => p !== key)
        : [...form.platforms, key],
    );
  };

  // Close dropdowns when clicking outside
  const audienceRef = useRef(null);
  const locationRef = useRef(null);
  const errorRef    = useRef(null);
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (audienceRef.current && !audienceRef.current.contains(e.target)) {
        setAudienceOpen(false);
      }
      if (locationRef.current && !locationRef.current.contains(e.target)) {
        setLocationOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Scroll error banner into view whenever an error appears
  useEffect(() => {
    if (submitError && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [submitError])

  // Auto-populate contact info from logged-in user profile
  useEffect(() => {
    const profile = getEvokeUserProfile();
    const currentUser = profileToUser(profile) || authUser;
    if (currentUser) {
      setForm(f => ({
        ...f,
        contactEmail: currentUser.email || f.contactEmail,
        contactName: currentUser.displayName || f.contactName,
      }));
    }
  }, [authUser]);

  // 30-Day Content Calendar defaults
  useEffect(() => {
    if (type === 'content_calendar') {
      setForm(f => ({ ...f, campaignDays: 30 }))
    }
  }, [type])

  // Load connected social accounts for social platform selector
  const loadConnectedAccounts = useCallback(() => {
    const profile = getEvokeUserProfile()
    const currentUser = profileToUser(profile) || authUser
    if (!currentUser) return
    getUserData(currentUser.uid).then(data => {
      if (!data?.socialAccounts) return
      const sa = data.socialAccounts
      setConnectedAccounts(sa)
      // Auto-select all connected platforms for every package
      const platforms = ['whatsapp']
      if (sa.linkedin?.connected)   platforms.push('linkedin')
      if (sa.instagram?.connected)  platforms.push('instagram')
      if (sa.facebook?.connected)   platforms.push('facebook')
      if (sa.gmail?.connected)      platforms.push('email')
      if (sa.tiktok?.connected)     platforms.push('tiktok')
      if (sa.eventbrite?.connected) platforms.push('eventbrite')
      setForm(prev => ({ ...prev, platforms }))
    }).catch(() => {})
  }, [fromPackageA, authUser]) // eslint-disable-line

  useEffect(() => {
    if (authUser) loadConnectedAccounts()
  }, [type, fromPackageA, authUser, loadConnectedAccounts])

  // Open /connect-accounts as popup so the form isn't left
  const openConnectPopup = useCallback((platformKey) => {
    const popup = window.open(
      `/connect-accounts?platform=${platformKey}&popup=1`,
      'evoke_connect',
      'width=620,height=720,left=200,top=100,resizable=yes,scrollbars=yes'
    )
    if (!popup) {
      // Popup blocked — fall back to navigation
      navigate('/connect-accounts', { state: { from: backPath || window.location.pathname } })
      return
    }
    // Poll for popup close, then refresh accounts
    const timer = setInterval(() => {
      if (popup.closed) {
        clearInterval(timer)
        loadConnectedAccounts()
      }
    }, 600)
  }, [navigate, backPath, loadConnectedAccounts])

  const handleSubmit = async () => {
    setSubmitError("");
    const needsBrandName = ["product", "brand", "brand_strategy"].includes(type);
    if (!form.name.trim()) return setSubmitError("Please enter a name.");
    if (!form.description.trim()) return setSubmitError("Please enter a description.");
    if (!form.goal.trim() && !form.goalType && type !== "ads_creation" && type !== "ads_manager" && type !== "target_audience") return setSubmitError("Please select or describe a campaign goal.");
    if (needsBrandName && !form.brandName.trim()) return setSubmitError("Please enter a brand name.");
    if (form.targetAudience.length === 0) return setSubmitError("Please select at least one target audience.");

    setLoading(true);
    setLoadingPhase("generating");
    try {
      // â"€â"€ Upload event/product image to ImgBB (LinkedIn / Instagram / Facebook) â"€â"€
      let resolvedImageUrl = "";
      if (type === "event" && eventImageFile) {
        setLoadingPhase("uploading-image");
        setEventImageUploading(true);
        try { resolvedImageUrl = await uploadToImgBB(eventImageFile); } catch (e) { console.warn("Event image upload failed:", e.message); }
        setEventImageUploading(false);
      } else if ((type === "product" || type === "brand") && form.imageFile) {
        setLoadingPhase("uploading-image");
        resolvedImageUrl = await uploadToImgBB(form.imageFile);
      }

      // â"€â"€ Auto-generate AI poster — skip for strategy/calendar types (no image needed) â"€â"€
      const skipPoster = ['growth_strategy','growth_agent','content_calendar','analytics_report','competitive_intel','seo_blog'].includes(type)
      if (!resolvedImageUrl && !skipPoster && form.name.trim() && form.description.trim()) {
        try {
          setLoadingPhase("generating-image");
          const { file: autoPosterFile } = await generateEventPoster(form);
          setLoadingPhase("uploading-image");
          resolvedImageUrl = await uploadToImgBB(autoPosterFile);
          if (type === "event") {
            setEventImageFile(autoPosterFile);
            setEventImagePreview(URL.createObjectURL(autoPosterFile));
          }
        } catch (autoImgErr) {
          console.warn("Auto poster generation failed, proceeding without image:", autoImgErr.message);
        }
      }

      // â"€â"€ Generate AI campaign content â"€â"€
      // For growth_strategy with a website, show "reading" phase first (Jina fetch happens inside the function)
      if ((type === 'growth_strategy' || type === 'growth_agent' || type === 'content_calendar') && form.website) {
        setLoadingPhase("reading-website");
      } else {
        setLoadingPhase("generating");
      }
      const combinedGoal = [form.goalType, form.goal].filter(Boolean).join(' — ');
      let campaignData;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          campaignData = await generateCampaignContent({ ...form, goal: combinedGoal || form.goal }, type, form.campaignDays);
          break;
        } catch (err) {
          const isRateLimit = err.message?.includes("rate limit") || err.message?.includes("429")
          const isParseErr  = err.message?.includes("parse") || err.message?.includes("JSON") || err.message?.includes("returned no JSON")
          if (attempt < 3 && isRateLimit) {
            setSubmitError(`Rate limit hit — retrying in 15 seconds… (attempt ${attempt}/3)`)
            await new Promise(r => setTimeout(r, 15000))
            setSubmitError('')
            setLoadingPhase("generating")
          } else if (attempt < 3 && isParseErr) {
            console.warn(`[CampaignForm] Attempt ${attempt} failed, retrying in 2s…`, err.message)
            setLoadingPhase("generating")
            await new Promise(r => setTimeout(r, 2000))
          } else {
            throw err;
          }
        }
      }

      // Append event URL to every post if the AI didn't include it
      const isEventType = type === "event" || type === "event_full";
      if (isEventType && form.eventUrl) {
        const urlTag = `\n\n🔗 ${form.eventUrl}`;
        ['linkedinPost','instagramCaption','facebookPost','whatsappMessage','emailBody'].forEach(field => {
          if (campaignData[field] && !campaignData[field].includes(form.eventUrl)) {
            campaignData[field] += urlTag;
          }
        });
      }

      // â"€â"€ Generate daily schedule for multi-day campaigns â"€â"€
      // Skipped for Package C ad tools — they have no campaign-duration UI and
      // produce ad creative, not a day-by-day social posting calendar.
      const isAdTool = type === "ads_creation" || type === "ads_manager" || type === "target_audience";
      const postsPerDay = form.postsPerDay || 1;
      let dailySchedule = [];
      if (!isAdTool && ((form.campaignDays || 7) > 1 || postsPerDay > 1)) {
        setLoadingPhase("generating-schedule");
        dailySchedule = await generateDailySchedule(form, type, form.campaignDays || 7, postsPerDay);
      }

      // â"€â"€ Build payload for n8n â"€â"€
      const today = new Date().toISOString().split("T")[0];
      const payload = {
        campaignType: type,
        name: form.name,
        description: form.description,
        price: form.price || "",
        targetAudience: form.targetAudience.join(", "),
        goal: [form.goalType, form.goal].filter(Boolean).join(' — ') || form.goal,
        brandName: form.brandName || form.name,
        contactName: form.contactName,
        contactEmail: form.contactEmail,
        contactPhone: form.contactPhone,
        website: form.website || "",
        postDate: form.postDate || today,
        postTime: form.postTime || "09:00",
        postsPerDay: postsPerDay,
        postTimes: form.postTimes?.length ? form.postTimes : [form.postTime || "09:00"],
        campaignDays: form.campaignDays || 7,
        dailyPostTime: form.postTime || "09:00",
        platforms: form.platforms.join(","),
        adminEmail: "vasanthchowdarythumati@gmail.com",
        imageUrl: resolvedImageUrl,
        whatsappRecipients: form.whatsappRecipients || "",
        emailRecipients: form.emailRecipients || "",
        dailySchedule: dailySchedule,
        campaignBrief: `${type} campaign for ${form.brandName || form.name}. Goal: ${form.goal}. Audience: ${form.targetAudience.join(", ")}. Description: ${form.description}`,
        ...((type === "event" || type === "event_full") && {
          date: form.date,
          endDate: form.endDate,
          time: form.time,
          location: form.eventLocations?.length ? form.eventLocations.join(", ") : form.location,
          eventUrl: form.eventUrl,
        }),
        ...(form.competitorUrl && { competitorUrl: form.competitorUrl }),
        ...(form.industry && { industry: form.industry }),
        ...(form.budget && { budget: form.budget }),
        ...(form.keywords && { keywords: form.keywords }),
        ...(form.reportPeriod && { reportPeriod: form.reportPeriod }),
        ...(form.funnelStage && { funnelStage: form.funnelStage }),
        emailSubject:     campaignData.emailSubject     || "",
        emailBody:        campaignData.emailBody        || "",
        linkedinPost:     campaignData.linkedinPost     || "",
        instagramCaption: campaignData.instagramCaption || "",
        facebookPost:     campaignData.facebookPost     || "",
        tiktokCaption:    campaignData.tiktokCaption    || "",
        whatsappMessage:  campaignData.whatsappMessage  || "",
        adHeadline:       campaignData.adHeadline       || "",
        adBody:           campaignData.adBody           || "",
        ...(type === "ads_creation" && {
          adStrategy:          campaignData.adStrategy          || "",
          staticAdVariants:    campaignData.staticAdVariants    || [],
          carouselAdVariant:   campaignData.carouselAdVariant   || null,
          videoStillAdVariant: campaignData.videoStillAdVariant || null,
          adHeadlineVariants:  campaignData.adHeadlineVariants  || [],
          landingPageTips:     campaignData.landingPageTips     || "",
          adPlatforms:         form.socialPlatforms || [],
          adFormats:           form.contentTypes || [],
        }),
      };

      // ── Attach inline-generated product assets (from converter cards) ──
      if (assetResults.angles?.url)      payload.productAnglesVideoUrl  = assetResults.angles.url;
      if (assetResults['360']?.url)      payload.product360VideoUrl     = assetResults['360'].url;
      if (assetResults.lifestyle?.url)   payload.lifestyleVideoUrl      = assetResults.lifestyle.url;
      if (assetResults.adVideo?.url)     payload.adVideoUrl             = assetResults.adVideo.url;
      if (assetResults.description?.text) payload.productDescriptionAI  = assetResults.description.text;
      if (assetResults.seo?.text)         payload.seoDataAI             = assetResults.seo.text;
      // Use first generated video as the main video URL for social posting
      const firstVideo = [assetResults.adVideo, assetResults.lifestyle, assetResults['360'], assetResults.angles].find(a => a?.url);
      if (firstVideo?.url) {
        payload.videoUrl  = firstVideo.url;
        payload.hasVideo  = true;
        payload.mediaType = 'video';   // tells n8n to post as video not image
      } else {
        payload.hasVideo  = false;
        payload.mediaType = 'image';
      }

      // ── Attach pre-generated product assets from ProductLaunchModal ──
      try {
        const rawAssets = sessionStorage.getItem('productAssets')
        if (rawAssets) {
          const assets = JSON.parse(rawAssets)
          if (assets.angles?.urls?.length)     payload.productAnglesUrls    = assets.angles.urls
          if (assets.lifestyle?.urls?.length)  payload.lifestyleImageUrls   = assets.lifestyle.urls
          if (assets['360']?.urls?.length)     payload.product360Urls       = assets['360'].urls
          if (assets.video?.data)              payload.videoScript          = assets.video.data
          if (assets.description?.data)        payload.productDescriptionAI = assets.description.data
          if (assets.seo?.data)                payload.seoDataAI            = assets.seo.data
          sessionStorage.removeItem('productAssets')
          sessionStorage.removeItem('productMeta')
        }
      } catch (_) {}

      // ── Attach user social credentials + CMO profile from Firestore ──
      const currentUser = profileToUser(getEvokeUserProfile()) || authUser;
      if (currentUser) {
        const userData = await getUserData(currentUser.uid);

        // Attach CMO setup profile (from onboarding chat) for personalization
        if (userData?.onboardingData) {
          const od = userData.onboardingData;
          payload.userProfile = {
            background:   od.background   || '',
            industry:     od.industry     || '',
            goal:         od.goal         || '',
            businessName: od.businessName || '',
            campaignType: od.campaignType || '',
          };
        }

        if (userData?.socialAccounts) {
          const sa = userData.socialAccounts;
          payload.userCredentials = {
            facebook:   sa.facebook?.connected   ? { pageId: sa.facebook.pageId, pageAccessToken: sa.facebook.pageAccessToken } : null,
            instagram:  sa.instagram?.connected  ? { businessAccountId: sa.instagram.businessAccountId, pageAccessToken: sa.instagram.pageAccessToken } : null,
            linkedin:   sa.linkedin?.connected   ? { personUrn: sa.linkedin.personUrn, accessToken: sa.linkedin.accessToken } : null,
            gmail:      sa.gmail?.connected      ? { email: sa.gmail.email, accessToken: sa.gmail.accessToken, refreshToken: sa.gmail.refreshToken } : null,
            tiktok:     sa.tiktok?.connected     ? { accessToken: sa.tiktok.accessToken, openId: sa.tiktok.openId } : null,
            eventbrite: sa.eventbrite?.connected ? { privateToken: sa.eventbrite.privateToken, organizationId: sa.eventbrite.organizationId } : null,
            luma:       sa.luma?.connected       ? { apiKey: sa.luma.apiKey } : null,
            meetup:     sa.meetup?.connected     ? { accessToken: sa.meetup.accessToken, groupUrlName: sa.meetup.groupUrlName } : null,
          };
        }
      }

      // â"€â"€ Store for Results page to review, edit, then launch â"€â"€
      sessionStorage.setItem("campaignResult", JSON.stringify({
        ...campaignData,
        imageUrl:  resolvedImageUrl,
        videoUrl:  payload.videoUrl  || "",
        hasVideo:  payload.hasVideo  || false,
        mediaType: payload.mediaType || "image",
      }));
      sessionStorage.setItem("campaignType", type);
      sessionStorage.setItem("campaignMeta", JSON.stringify({ name: form.name, brandName: form.brandName }));
      sessionStorage.setItem("campaignDays", String(isAdTool ? 1 : (form.campaignDays || 7)));
      sessionStorage.setItem("dailySchedule", JSON.stringify(dailySchedule));
      sessionStorage.setItem("webhookStatus", "idle");
      sessionStorage.setItem("webhookPayload", JSON.stringify(payload));
      navigate("/results");
    } catch (err) {
      console.error('[CampaignForm] Generation error:', err);
      setEventImageUploading(false);
      setSubmitError(err.message || "Failed to generate campaign. Please try again.");
    } finally {
      setLoading(false);
      setLoadingPhase("");
    }
  };

  const EXEC_TYPES = ['pr_reputation','crm_lifecycle','paid_advertising','ai_cfo','ai_cto','ai_cro_exec','ai_ceo','ai_compliance']

  const labelMap = {
    event:            { name: "Event Name",           namePh: "Enter event name",                  desc: "Event Description"                        },
    product:          { name: "Product Name",          namePh: "Enter product name",                desc: "Product Description"                      },
    brand:            { name: "Campaign Name",         namePh: "Enter campaign name",               desc: "Brand Description"                        },
    growth_strategy:  { name: "Company / Brand",       namePh: "Your company or brand name",        desc: "Business Overview & Goals"                },
    growth_agent:     { name: "Company / Brand",       namePh: "Your company or brand name",        desc: "Business Overview & Client Goals"         },
    competitive_intel:{ name: "Your Brand",            namePh: "Your brand name",                   desc: "Your Product / Service to Analyze"        },
    content_calendar: { name: "Brand / Channel",       namePh: "Brand or social channel name",      desc: "What content do you want to create & what are your goals?" },
    seo_blog:         { name: "Blog Topic",            namePh: "e.g. How to grow on LinkedIn",      desc: "Target Audience & Context"                },
    email_drip:       { name: "Campaign / Product",    namePh: "What this email series is for",     desc: "Campaign Brief"           },
    influencer:       { name: "Brand / Campaign",      namePh: "Brand or campaign name",            desc: "Campaign Objectives & Key Messages"       },
    analytics_report: { name: "Company / Period",      namePh: "e.g. Acme Inc - Q1 2025",           desc: "Marketing Activities to Report On"        },
    sales_enablement: { name: "Product / Service",     namePh: "What you're selling",               desc: "Target Customer & Unique Value Prop"      },
    event_full:       { name: "Event Name",            namePh: "Enter event name",                  desc: "Full Event Description"                   },
    marketplace:      { name: "Marketplace / Brand",   namePh: "EVOKE Marketplace or vendor",       desc: "Products / Categories to Promote"         },
    brand_strategy:   { name: "Brand Name",            namePh: "Enter brand name",                  desc: "Brand Background & Vision"                },
    funnel_cro:       { name: "Product / Landing Page", namePh: "What you want to optimize",        desc: "Current Funnel & Key Drop-off Points"     },
    pr_reputation:    { name: "Brand / Company Name",  namePh: "e.g. EVOKE Media",                  desc: "What is your current PR situation or goal? What do you need to communicate?" },
    crm_lifecycle:    { name: "Business / Product",    namePh: "e.g. EVOKE SaaS Platform",          desc: "Describe your customer journey, current retention challenges, and lifecycle goals." },
    paid_advertising: { name: "Brand / Product",       namePh: "What you want to advertise",        desc: "Describe what you're promoting, key benefits, and what makes it stand out from competitors." },
    ai_cfo:           { name: "Company / Business",    namePh: "e.g. EVOKE Technologies",           desc: "Describe your business model, current revenue stage, and key financial goals." },
    ai_cto:           { name: "Company / Product",     namePh: "e.g. EVOKE CMO Platform",           desc: "Describe your current tech stack, marketing tools, and what you want to automate or improve." },
    ai_cro_exec:      { name: "Company / Business",    namePh: "e.g. EVOKE Marketplace",            desc: "Describe your current revenue model, sales process, and primary growth bottleneck." },
    ai_ceo:           { name: "Company / Brand",       namePh: "e.g. EVOKE Group",                  desc: "Describe your company, current market position, and 3-year vision or strategic challenge." },
    ai_compliance:    { name: "Company / Brand",       namePh: "e.g. EVOKE Media",                  desc: "Describe your marketing activities, platforms used, and any compliance concerns or requirements." },
  };
  const lm = labelMap[type] || labelMap.product;
  const nameLabel = lm.name;
  const namePlaceholder = lm.namePh;
  const descLabel = lm.desc;

  const FONT = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  const s = {
    page: { minHeight: "100vh", background: "#0e0c09", color: "#ffffff", fontFamily: FONT },
    container: {
      maxWidth: 720,
      margin: "0 auto",
      padding: "108px 24px 80px",
      position: "relative",
      zIndex: 1,
      fontFamily: FONT,
    },
    card: {
      background: "#1c1a13",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: "20px",
      padding: "36px",
      boxShadow: "none",
      fontFamily: FONT,
    },
    label: {
      display: "block",
      fontSize: "11px",
      fontWeight: 700,
      color: "rgba(255,255,255,0.65)",
      marginBottom: "8px",
      marginTop: "22px",
      letterSpacing: "0.07em",
      textTransform: "uppercase",
      fontFamily: FONT,
    },
    req: { color: meta.color, marginLeft: "2px" },
    input: {
      width: "100%",
      padding: "12px 16px",
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.12)",
      borderRadius: "12px",
      color: "#ffffff",
      fontSize: "15px",
      fontWeight: 500,
      boxSizing: "border-box",
      outline: "none",
      transition: "border-color 0.2s, box-shadow 0.2s",
      fontFamily: FONT,
    },
    textarea: {
      width: "100%",
      padding: "12px 16px",
      minHeight: "100px",
      resize: "vertical",
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.12)",
      borderRadius: "12px",
      color: "#ffffff",
      fontSize: "15px",
      fontWeight: 500,
      boxSizing: "border-box",
      outline: "none",
      fontFamily: FONT,
    },
    dropZone: {
      border: `2px dashed rgba(255,255,255,0.18)`,
      borderRadius: "14px",
      padding: "32px 20px",
      textAlign: "center",
      cursor: "pointer",
      color: "rgba(255,255,255,0.4)",
      fontSize: "14px",
      fontFamily: FONT,
    },
    divider: {
      height: "1px",
      background: "rgba(245,240,232,0.1)",
      margin: "28px 0",
    },
    sectionTitle: {
      fontSize: "11px",
      fontWeight: 800,
      letterSpacing: "0.1em",
      color: `${meta.color}`,
      textTransform: "uppercase",
      marginBottom: "4px",
      fontFamily: FONT,
    },
    submitBtn: {
      width: "100%",
      marginTop: "28px",
      padding: "16px",
      background: loading
        ? "#f0ebe0"
        : `linear-gradient(135deg, ${meta.color}, ${meta.color}bb)`,
      border: "none",
      borderRadius: "14px",
      color: loading ? "#94a3b8" : "#fff",
      fontSize: "16px",
      fontWeight: 800,
      cursor: loading ? "not-allowed" : "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "10px",
      letterSpacing: "-0.01em",
    },
  };

  return (
    <div style={s.page}>
      <Navbar />
      <div style={s.container}>
        <button
          onClick={() => backPath ? navigate(backPath) : navigate(-1)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            background: "none",
            border: "none",
            color: "rgba(255,255,255,0.45)",
            fontSize: "13px",
            fontWeight: 600,
            cursor: "pointer",
            marginBottom: "28px",
            padding: 0,
            letterSpacing: "0.01em",
            transition: "color 0.15s",
          }}
          onMouseEnter={e => e.currentTarget.style.color = "rgba(255,255,255,0.85)"}
          onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.45)"}
        >
          <ChevronLeft size={16} />
          Back to Agents
        </button>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: "32px" }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 12px",
              background: `${meta.color}18`,
              border: `1px solid ${meta.color}30`,
              borderRadius: "100px",
              fontSize: "11px",
              fontWeight: 700,
              color: meta.color,
              letterSpacing: "0.07em",
              marginBottom: "14px",
            }}
          >
            {meta.icon} {meta.badge}
          </div>
          <h1
            style={{
              fontSize: "36px",
              fontWeight: 900,
              letterSpacing: "-0.03em",
              color: "#ffffff",
              marginBottom: "8px",
              fontFamily: FONT,
              lineHeight: 1.15,
            }}
          >
            {meta.title}
          </h1>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "15px", fontFamily: FONT, fontWeight: 400 }}>
            {type === "growth_agent"
              ? "Fill in your business details and your AI CMO will build a complete client acquisition & growth plan."
              : type === "content_calendar"
              ? "Fill in your brand details and your AI CMO will create a tailored content strategy and calendar."
              : type === "pr_reputation"
              ? "Fill in your brand details and your AI CMO will generate a full PR & reputation management package."
              : type === "crm_lifecycle"
              ? "Fill in your business details and your AI CMO will build a complete CRM and customer lifecycle strategy."
              : type === "paid_advertising"
              ? "Fill in your campaign details and your AI CMO will create ads for Meta, Google, TikTok, and LinkedIn."
              : type === "ai_cfo"
              ? "Fill in your financial context and your AI CFO will generate forecasts, budgets, and ROI dashboards."
              : type === "ai_cto"
              ? "Fill in your tech context and your AI CTO will build a marketing technology and automation roadmap."
              : type === "ai_cro_exec"
              ? "Fill in your revenue context and your AI CRO will build a complete revenue growth and partnership strategy."
              : type === "ai_ceo"
              ? "Fill in your company context and your AI CEO will generate vision, strategic priorities, and board materials."
              : type === "ai_compliance"
              ? "Fill in your marketing activities and your AI Compliance Officer will audit risks and build your compliance framework."
              : "Fill in the details below and your AI CMO will generate a complete, multi-channel marketing campaign in seconds."}
          </p>
        </motion.div>

        {/* ── Social Accounts connect panel — Package A agents only ── */}
        {fromPackageA && (() => {
          const ICONS = {
            instagram: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <defs><linearGradient id="cfIg" x1="0" y1="24" x2="24" y2="0">
                  <stop offset="0%" stopColor="#f58529"/><stop offset="50%" stopColor="#dd2a7b"/><stop offset="100%" stopColor="#8134af"/>
                </linearGradient></defs>
                <rect x="2" y="2" width="20" height="20" rx="6" stroke="url(#cfIg)" strokeWidth="2" fill="none"/>
                <circle cx="12" cy="12" r="4" stroke="url(#cfIg)" strokeWidth="2" fill="none"/>
                <circle cx="17.5" cy="6.5" r="1.2" fill="#dd2a7b"/>
              </svg>
            ),
            facebook: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#1877f2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            ),
            linkedin: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#0a66c2"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
            ),
            whatsapp: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#25d366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
            ),
            gmail: (
              <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#4caf50" d="M45 16.2l-5 2.75-5 4.75L35 40h7c1.657 0 3-1.343 3-3V16.2z"/><path fill="#1e88e5" d="M3 16.2l3.614 1.71L13 23.7V40H6c-1.657 0-3-1.343-3-3V16.2z"/><polygon fill="#e53935" points="35,11.2 24,19.45 13,11.2 12,17 13,23.7 24,31.95 35,23.7 36,17"/><path fill="#c62828" d="M3 12.298V16.2l10 7.5V11.2L9.876 8.859C9.132 8.301 8.228 8 7.298 8 4.924 8 3 9.924 3 12.298z"/><path fill="#fbc02d" d="M45 12.298V16.2l-10 7.5V11.2l3.124-2.341C38.868 8.301 39.772 8 40.702 8 43.076 8 45 9.924 45 12.298z"/></svg>
            ),
            tiktok: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#ffffff"><path d="M16.6 5.82c-1.01-.66-1.74-1.7-1.97-2.91-.05-.26-.08-.53-.08-.81h-3.45v13.36c0 1.63-1.32 2.96-2.96 2.96-.49 0-.95-.12-1.36-.33-.93-.48-1.57-1.45-1.57-2.58 0-1.6 1.3-2.9 2.9-2.9.31 0 .6.05.88.14V9.4a6.4 6.4 0 0 0-.88-.06A6.36 6.36 0 0 0 1.75 15.7a6.36 6.36 0 0 0 6.36 6.36 6.36 6.36 0 0 0 6.36-6.36V8.58a8.18 8.18 0 0 0 4.77 1.52V6.65c-.94 0-1.86-.3-2.64-.83z"/></svg>
            ),
          }
          const SOCIALS = [
            { key: 'instagram', label: 'Instagram', color: '#dd2a7b' },
            { key: 'facebook',  label: 'Facebook',  color: '#1877f2' },
            { key: 'linkedin',  label: 'LinkedIn',  color: '#0a66c2' },
            { key: 'tiktok',    label: 'TikTok',    color: '#69c9d0' },
            { key: 'whatsapp',  label: 'WhatsApp',  color: '#25d366', alwaysOn: true },
            { key: 'gmail',     label: 'Gmail',     color: '#ea4335' },
          ]
          const connectedCount = SOCIALS.filter(p => p.alwaysOn || connectedAccounts[p.key]?.connected).length
          const goConnect = () => navigate('/connect-accounts', { state: { from: backPath } })
          return (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              style={{ ...s.card, padding: "22px 24px", marginBottom: "20px" }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
                <div>
                  <p style={{ ...s.sectionTitle, marginBottom: 4 }}>Social Accounts</p>
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>
                    {connectedCount} of {SOCIALS.length} connected · we'll auto-post to these when you generate
                  </p>
                </div>
                <button
                  onClick={goConnect}
                  style={{ fontSize: 12, fontWeight: 700, color: meta.color, background: `${meta.color}15`, border: `1px solid ${meta.color}35`, borderRadius: 9, padding: "7px 14px", cursor: "pointer", fontFamily: FONT }}
                >
                  Manage
                </button>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                {SOCIALS.map(p => {
                  const isConnected = p.alwaysOn || connectedAccounts[p.key]?.connected
                  const acct = connectedAccounts[p.key]
                  const label = acct?.name || acct?.pageName || acct?.username || acct?.email
                  // Whole card is clickable: connected → Manage, unconnected → Connect
                  return (
                    <div
                      key={p.key}
                      onClick={goConnect}
                      title={isConnected ? `Manage ${p.label}` : `Connect ${p.label}`}
                      style={{
                        display: "flex", alignItems: "center", gap: 11, padding: "11px 14px",
                        background: isConnected ? `${p.color}12` : "rgba(255,255,255,0.03)",
                        border: `1px solid ${isConnected ? p.color + "40" : "rgba(255,255,255,0.1)"}`,
                        borderRadius: 12, minWidth: 168, flex: "1 1 168px", cursor: "pointer",
                        transition: "all 0.15s",
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = p.color; e.currentTarget.style.background = `${p.color}1a` }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = isConnected ? p.color + "40" : "rgba(255,255,255,0.1)"; e.currentTarget.style.background = isConnected ? `${p.color}12` : "rgba(255,255,255,0.03)" }}
                    >
                      <div style={{ flexShrink: 0, width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", opacity: isConnected ? 1 : 0.55 }}>
                        {ICONS[p.key]}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{p.label}</div>
                        <div style={{ fontSize: 10, color: isConnected ? "#10b981" : "rgba(255,255,255,0.35)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 600 }}>
                          {p.alwaysOn ? "Always on ✓" : isConnected ? (label ? label : "Connected ✓") : "Not connected"}
                        </div>
                      </div>
                      {isConnected ? (
                        <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#10b981", flexShrink: 0, boxShadow: "0 0 6px #10b981" }} />
                      ) : (
                        <span style={{ fontSize: 11, fontWeight: 700, color: p.color, background: `${p.color}15`, border: `1px solid ${p.color}35`, borderRadius: 7, padding: "5px 11px", flexShrink: 0 }}>
                          Connect
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            </motion.div>
          )
        })()}

<motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={s.card}
        >
          <p style={s.sectionTitle}>Campaign Details</p>

          <label style={{ ...s.label, marginTop: "12px" }}>
            {nameLabel} <span style={s.req}>*</span>
          </label>
          <input
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder={namePlaceholder}
            style={s.input}
          />

          <label style={s.label}>
            {descLabel} <span style={s.req}>*</span>
          </label>
          <textarea
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Describe in detail..."
            style={s.textarea}
          />

          {/* â"€â"€ Type-specific extra fields â"€â"€ */}
          {type === "ads_creation" && (
            <>
              <label style={s.label}>Ad Budget <span style={s.req}>*</span></label>
              <select value={form.budget || ""} onChange={(e) => set("budget", e.target.value)} style={{ ...s.input, cursor: "pointer", colorScheme: "dark" }}>
                {["","Under ₹5,000 / $50","₹5,000–₹20,000 / $50–$200","₹20,000–₹50,000 / $200–$500","₹50,000–₹1.5L / $500–$1,500","₹1.5L–₹5L / $1,500–$5,000","Above ₹5L / $5,000+"].map(v => (
                  <option key={v} value={v} style={{ background: "#1c1a13", color: v ? "#f0ebe0" : "rgba(240,235,224,0.4)" }}>{v || "Select ad budget..."}</option>
                ))}
              </select>

              <label style={s.label}>Ad Platforms <span style={s.req}>*</span></label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "4px" }}>
                {[
                  { key: "facebook_ads",   label: "Facebook Ads",   color: "#1877f2" },
                  { key: "instagram_ads",  label: "Instagram Ads",  color: "#e1306c" },
                  { key: "google_search",  label: "Google Search",  color: "#34a853" },
                  { key: "google_display", label: "Google Display", color: "#fbbc04" },
                  { key: "youtube_ads",    label: "YouTube Ads",    color: "#ff0000" },
                  { key: "linkedin_ads",   label: "LinkedIn Ads",   color: "#0a66c2" },
                ].map(({ key, label, color }) => {
                  const sel = (form.socialPlatforms || []).includes(key);
                  return (
                    <button key={key} type="button"
                      onClick={() => {
                        const cur = form.socialPlatforms || [];
                        set("socialPlatforms", sel ? cur.filter(p => p !== key) : [...cur, key]);
                      }}
                      style={{
                        display: "flex", alignItems: "center", gap: "6px",
                        padding: "8px 16px", borderRadius: "10px", cursor: "pointer",
                        background: sel ? `${color}18` : "#f8fafc",
                        border: `1.5px solid ${sel ? color : "rgba(245,240,232,0.15)"}`,
                        color: sel ? color : "#0f172a", fontSize: "13px", fontWeight: 600,
                        transition: "all 0.15s",
                      }}
                    >
                      {sel && <Check size={12} />}{label}
                    </button>
                  );
                })}
              </div>

              <label style={{ ...s.label, marginTop: "14px" }}>Ad Objective <span style={s.req}>*</span></label>
              <select value={form.goal || ""} onChange={(e) => set("goal", e.target.value)} style={{ ...s.input, cursor: "pointer", colorScheme: "dark" }}>
                {["","Traffic — Drive clicks to website","Conversions — Sales or sign-ups","Lead Generation — Capture contact info","Brand Awareness — Reach & impressions","App Installs — Download campaigns","Video Views — Engagement & watch time","Retargeting — Re-engage website visitors"].map(v => (
                  <option key={v} value={v} style={{ background: "#1c1a13", color: v ? "#f0ebe0" : "rgba(240,235,224,0.4)" }}>{v || "Select campaign objective..."}</option>
                ))}
              </select>

              <label style={{ ...s.label, marginTop: "14px" }}>Landing Page URL <span style={s.req}>*</span></label>
              <div style={{ position: "relative" }}>
                <svg style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.35)" }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
                <input value={form.website} onChange={(e) => set("website", e.target.value)} placeholder="https://yoursite.com/product" style={{ ...s.input, paddingLeft: "36px" }} />
              </div>

              <label style={{ ...s.label, marginTop: "14px" }}>Ad Format</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "4px" }}>
                {["Image Ad","Video Ad","Carousel Ad","Story / Reel Ad","Collection Ad"].map(fmt => {
                  const sel = (form.contentTypes || []).includes(fmt);
                  return (
                    <button key={fmt} type="button"
                      onClick={() => {
                        const cur = form.contentTypes || [];
                        set("contentTypes", sel ? cur.filter(c => c !== fmt) : [...cur, fmt]);
                      }}
                      style={{
                        padding: "7px 16px", borderRadius: "10px", cursor: "pointer", fontSize: "13px", fontWeight: 600,
                        background: sel ? "rgba(249,115,22,0.12)" : "#f8fafc",
                        border: `1.5px solid ${sel ? "#f97316" : "rgba(245,240,232,0.15)"}`,
                        color: sel ? "#f97316" : "#0f172a", transition: "all 0.15s",
                      }}
                    >{fmt}</button>
                  );
                })}
              </div>
            </>
          )}

          {type === "competitive_intel" && (
            <>
              <label style={s.label}>Competitor Website URL</label>
              <input value={form.competitorUrl} onChange={(e) => set("competitorUrl", e.target.value)} placeholder="https://competitor.com" style={s.input} />
              <label style={s.label}>Industry / Niche <span style={s.req}>*</span></label>
              <input value={form.industry} onChange={(e) => set("industry", e.target.value)} placeholder="e.g. SaaS, E-commerce, Events" style={s.input} />
            </>
          )}

          {/* ── Content Calendar — brand/website + industry/niche ── */}
          {type === "content_calendar" && (
            <>
              <label style={s.label}>Industry / Niche <span style={s.req}>*</span></label>
              <select value={form.industry || ""} onChange={(e) => set("industry", e.target.value)} style={{ ...s.input, cursor: "pointer", colorScheme: "dark" }}>
                {["","AI Marketing Technology / SaaS / Digital Marketing Platform","Technology / SaaS","E-commerce / Retail","Healthcare / Wellness","Finance / Fintech","Education / EdTech","Real Estate","Food & Beverage","Fashion & Apparel","Travel & Hospitality","Marketing & Advertising","Media & Entertainment","Manufacturing","Professional Services","Non-profit / NGO","Other"].map((v) => (
                  <option key={v} value={v} style={{ background: "#1c1a13", color: v ? "#f0ebe0" : "rgba(240,235,224,0.4)" }}>{v || "Select industry..."}</option>
                ))}
              </select>

              <label style={s.label}>
                Your Website URL
                <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, fontWeight: 400 }}> (optional — AI will read your brand)</span>
              </label>
              <div style={{ position: "relative" }}>
                <Link size={14} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.35)", pointerEvents: "none" }} />
                <input
                  value={form.website}
                  onChange={(e) => set("website", e.target.value)}
                  placeholder="https://yourbrand.com"
                  style={{ ...s.input, paddingLeft: "36px" }}
                />
              </div>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: -6, marginBottom: 4 }}>
                The AI will scan your site to match your brand tone and voice in the content calendar.
              </p>

              <label style={s.label}>Brand Tone of Voice</label>
              <select value={form.toneOfVoice || ""} onChange={(e) => set("toneOfVoice", e.target.value)} style={{ ...s.input, cursor: "pointer", colorScheme: "dark" }}>
                {["","Professional & Authoritative","Friendly & Conversational","Bold & Energetic","Inspirational & Motivational","Educational & Informative","Witty & Humorous","Luxury & Sophisticated","Casual & Relatable"].map((v) => (
                  <option key={v} value={v} style={{ background: "#1c1a13", color: v ? "#f0ebe0" : "rgba(240,235,224,0.4)" }}>{v || "Select tone..."}</option>
                ))}
              </select>

              <label style={s.label}>Content Types to Include <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, fontWeight: 400 }}>(select all that apply)</span></label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
                {["Instagram Posts","Reels / Short Videos","Stories","Facebook Posts","LinkedIn Posts","X / Twitter Posts","YouTube Shorts","Blog / Articles"].map((ct) => {
                  const selected = (form.contentTypes || []).includes(ct)
                  return (
                    <button
                      key={ct}
                      type="button"
                      onClick={() => {
                        const cur = form.contentTypes || []
                        set("contentTypes", selected ? cur.filter(c => c !== ct) : [...cur, ct])
                      }}
                      style={{
                        padding: "6px 14px", borderRadius: 20, fontSize: 12, cursor: "pointer",
                        border: selected ? "1px solid #c8973e" : "1px solid rgba(255,255,255,0.12)",
                        background: selected ? "rgba(200,151,62,0.18)" : "rgba(255,255,255,0.04)",
                        color: selected ? "#c8973e" : "rgba(240,235,224,0.6)",
                        fontWeight: selected ? 600 : 400,
                        transition: "all 0.15s",
                      }}
                    >{ct}</button>
                  )
                })}
              </div>

              <label style={s.label}>Posting Frequency <span style={s.req}>*</span></label>
              <select value={form.postingFrequency || ""} onChange={(e) => set("postingFrequency", e.target.value)} style={{ ...s.input, cursor: "pointer", colorScheme: "dark" }}>
                {["","1x per day","2x per day","Every other day (3–4x/week)","3x per week","2x per week","1x per week"].map((v) => (
                  <option key={v} value={v} style={{ background: "#1c1a13", color: v ? "#f0ebe0" : "rgba(240,235,224,0.4)" }}>{v || "Select posting frequency..."}</option>
                ))}
              </select>
            </>
          )}
          {EXEC_TYPES.includes(type) && (
            <>
              <label style={s.label}>Industry / Sector <span style={s.req}>*</span></label>
              <select value={form.industry || ""} onChange={(e) => set("industry", e.target.value)} style={{ ...s.input, cursor: "pointer", colorScheme: "dark" }}>
                {["","Technology / SaaS","E-commerce / Retail","Healthcare / Wellness","Finance / Fintech","Education / EdTech","Real Estate","Food & Beverage","Fashion & Apparel","Travel & Hospitality","Marketing & Advertising","Media & Entertainment","Manufacturing","Professional Services","Non-profit / NGO","Other"].map((v) => (
                  <option key={v} value={v} style={{ background: "#1c1a13", color: v ? "#f0ebe0" : "rgba(240,235,224,0.4)" }}>{v || "Select industry..."}</option>
                ))}
              </select>

              {['paid_advertising','ai_cfo','ai_cro_exec','ai_ceo'].includes(type) && (
                <>
                  <label style={s.label}>Monthly Budget (optional)</label>
                  <select value={form.budget || ""} onChange={(e) => set("budget", e.target.value)} style={{ ...s.input, cursor: "pointer", colorScheme: "dark" }}>
                    {["","Under ₹50,000 / $500","₹50,000–₹2L / $500–$2,000","₹2L–₹5L / $2,000–$5,000","₹5L–₹15L / $5,000–$15,000","₹15L–₹50L / $15,000–$50,000","Above ₹50L / $50,000+"].map((v) => (
                      <option key={v} value={v} style={{ background: "#1c1a13", color: v ? "#f0ebe0" : "rgba(240,235,224,0.4)" }}>{v || "Select budget range..."}</option>
                    ))}
                  </select>
                </>
              )}

              <label style={s.label}>Your Website URL <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, fontWeight: 400 }}>(optional)</span></label>
              <div style={{ position: "relative" }}>
                <Link size={14} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.35)", pointerEvents: "none" }} />
                <input value={form.website} onChange={(e) => set("website", e.target.value)} placeholder="https://yourcompany.com" style={{ ...s.input, paddingLeft: "36px" }} />
              </div>
            </>
          )}

          {(type === "growth_strategy" || type === "growth_agent" || type === "analytics_report") && (
            <>
              <label style={s.label}>Industry / Sector <span style={s.req}>*</span></label>
              <select value={form.industry || ""} onChange={(e) => set("industry", e.target.value)} style={{ ...s.input, cursor: "pointer", colorScheme: "dark" }}>
                {["","Technology / SaaS","E-commerce / Retail","Healthcare / Wellness","Finance / Fintech","Education / EdTech","Real Estate","Food & Beverage","Fashion & Apparel","Travel & Hospitality","Marketing & Advertising","Media & Entertainment","Manufacturing","Professional Services","Non-profit / NGO","Other"].map((v,i) => (
                  <option key={v} value={v} style={{ background: "#1c1a13", color: v ? "#f0ebe0" : "rgba(240,235,224,0.4)" }}>{v || "Select industry..."}</option>
                ))}
              </select>

              <label style={s.label}>Location / Region (optional)</label>
              <select value={form.location || ""} onChange={(e) => set("location", e.target.value)} style={{ ...s.input, cursor: "pointer", colorScheme: "dark" }}>
                {["","India","United States","United Kingdom","Europe","Middle East","Southeast Asia","Australia / New Zealand","Canada","Latin America","Africa","Global"].map((v) => (
                  <option key={v} value={v} style={{ background: "#1c1a13", color: v ? "#f0ebe0" : "rgba(240,235,224,0.4)" }}>{v || "Select region..."}</option>
                ))}
              </select>

              <label style={s.label}>Monthly Marketing Budget (optional)</label>
              <select value={form.budget || ""} onChange={(e) => set("budget", e.target.value)} style={{ ...s.input, cursor: "pointer", colorScheme: "dark" }}>
                {["","Under ₹50,000 / $500","₹50,000–₹2L / $500–$2,000","₹2L–₹5L / $2,000–$5,000","₹5L–₹15L / $5,000–$15,000","₹15L–₹50L / $15,000–$50,000","Above ₹50L / $50,000+"].map((v) => (
                  <option key={v} value={v} style={{ background: "#1c1a13", color: v ? "#f0ebe0" : "rgba(240,235,224,0.4)" }}>{v || "Select budget range..."}</option>
                ))}
              </select>
            </>
          )}

          {/* ── Growth Agent–only fields: client acquisition context ── */}
          {type === "growth_agent" && (
            <>
              <label style={s.label}>Target Client Profile <span style={s.req}>*</span></label>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: -8, marginBottom: 8 }}>
                Describe your ideal client — industry, size, pain points, and buying behaviour.
              </p>
              <textarea
                value={form.targetClientProfile || ""}
                onChange={(e) => set("targetClientProfile", e.target.value)}
                placeholder="e.g. Mid-size SaaS companies with 50–500 employees struggling with lead generation and churn..."
                rows={3}
                style={{ ...s.input, resize: "vertical", minHeight: 80 }}
              />

              <label style={s.label}>Average Deal / Contract Value <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, fontWeight: 400 }}>(optional)</span></label>
              <select value={form.avgDealSize || ""} onChange={(e) => set("avgDealSize", e.target.value)} style={{ ...s.input, cursor: "pointer", colorScheme: "dark" }}>
                {["", "Under $1,000", "$1,000 – $5,000", "$5,000 – $20,000", "$20,000 – $50,000", "$50,000 – $150,000", "$150,000+"].map((v) => (
                  <option key={v} value={v} style={{ background: "#1c1a13", color: v ? "#f0ebe0" : "rgba(240,235,224,0.4)" }}>{v || "Select deal size..."}</option>
                ))}
              </select>

              <label style={s.label}>Primary Acquisition Channel <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, fontWeight: 400 }}>(optional)</span></label>
              <select value={form.acquisitionChannel || ""} onChange={(e) => set("acquisitionChannel", e.target.value)} style={{ ...s.input, cursor: "pointer", colorScheme: "dark" }}>
                {["", "Cold Outreach (Email / LinkedIn)", "Referrals & Word of Mouth", "Inbound / Content Marketing", "Paid Ads (Google / Meta)", "Events & Networking", "Partnerships & Resellers", "Social Media Organic", "Not sure yet"].map((v) => (
                  <option key={v} value={v} style={{ background: "#1c1a13", color: v ? "#f0ebe0" : "rgba(240,235,224,0.4)" }}>{v || "Select main channel..."}</option>
                ))}
              </select>
            </>
          )}

          {/* ── Website URL — growth_strategy & growth_agent (Jina AI will read & feed it to the AI) ── */}
          {(type === "growth_strategy" || type === "growth_agent") && (
            <>
              <label style={s.label}>Your Website URL <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, fontWeight: 400 }}>(Optional)</span></label>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: -8, marginBottom: 8 }}>
                The AI CMO will scan your site and use it to build a strategy tailored to your actual business.
              </p>
              <div style={{ position: "relative" }}>
                <Link size={14} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.35)", pointerEvents: "none" }} />
                <input
                  value={form.website}
                  onChange={(e) => set("website", e.target.value)}
                  placeholder="https://yourcompany.com"
                  style={{ ...s.input, paddingLeft: "36px" }}
                />
              </div>
            </>
          )}

          {/* ── Social Platforms — Package A free agents (strategy / growth / content) ── */}
          {(type === "growth_strategy" || type === "growth_agent" || type === "content_calendar") && (
            <>
              <label style={s.label}>
                Social Platforms to Target
                <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, fontWeight: 400 }}> (select your connected accounts)</span>
              </label>
              {(() => {
                const PLAT_ICONS = {
                  linkedin: <svg width="18" height="18" viewBox="0 0 24 24" fill="#0a66c2"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>,
                  instagram: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><defs><linearGradient id="cfSel" x1="0" y1="24" x2="24" y2="0"><stop offset="0%" stopColor="#f58529"/><stop offset="50%" stopColor="#dd2a7b"/><stop offset="100%" stopColor="#8134af"/></linearGradient></defs><rect x="2" y="2" width="20" height="20" rx="6" stroke="url(#cfSel)" strokeWidth="2" fill="none"/><circle cx="12" cy="12" r="4" stroke="url(#cfSel)" strokeWidth="2" fill="none"/><circle cx="17.5" cy="6.5" r="1.2" fill="#dd2a7b"/></svg>,
                  facebook: <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877f2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>,
                  whatsapp: <svg width="18" height="18" viewBox="0 0 24 24" fill="#25d366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884"/></svg>,
                  gmail: <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#4caf50" d="M45 16.2l-5 2.75-5 4.75L35 40h7c1.657 0 3-1.343 3-3V16.2z"/><path fill="#1e88e5" d="M3 16.2l3.614 1.71L13 23.7V40H6c-1.657 0-3-1.343-3-3V16.2z"/><polygon fill="#e53935" points="35,11.2 24,19.45 13,11.2 12,17 13,23.7 24,31.95 35,23.7 36,17"/><path fill="#c62828" d="M3 12.298V16.2l10 7.5V11.2L9.876 8.859C9.132 8.301 8.228 8 7.298 8 4.924 8 3 9.924 3 12.298z"/><path fill="#fbc02d" d="M45 12.298V16.2l-10 7.5V11.2l3.124-2.341C38.868 8.301 39.772 8 40.702 8 43.076 8 45 9.924 45 12.298z"/></svg>,
                  tiktok: <svg width="18" height="18" viewBox="0 0 24 24" fill="#ffffff"><path d="M16.6 5.82c-1.01-.66-1.74-1.7-1.97-2.91-.05-.26-.08-.53-.08-.81h-3.45v13.36c0 1.63-1.32 2.96-2.96 2.96-.49 0-.95-.12-1.36-.33-.93-.48-1.57-1.45-1.57-2.58 0-1.6 1.3-2.9 2.9-2.9.31 0 .6.05.88.14V9.4a6.4 6.4 0 0 0-.88-.06A6.36 6.36 0 0 0 1.75 15.7a6.36 6.36 0 0 0 6.36 6.36 6.36 6.36 0 0 0 6.36-6.36V8.58a8.18 8.18 0 0 0 4.77 1.52V6.65c-.94 0-1.86-.3-2.64-.83z"/></svg>,
                }
                const PLAT = [
                  { key: 'linkedin',  label: 'LinkedIn',  color: '#0a66c2' },
                  { key: 'instagram', label: 'Instagram', color: '#dd2a7b' },
                  { key: 'facebook',  label: 'Facebook',  color: '#1877f2' },
                  { key: 'tiktok',    label: 'TikTok',    color: '#000000' },
                  { key: 'whatsapp',  label: 'WhatsApp',  color: '#25d366' },
                  { key: 'gmail',     label: 'Gmail',     color: '#ea4335' },
                ]
                const connected = PLAT.filter(p => connectedAccounts[p.key]?.connected || p.key === 'whatsapp')
                const unconnected = PLAT.filter(p => !connectedAccounts[p.key]?.connected && p.key !== 'whatsapp')
                const toggle = (key) => {
                  const cur = form.socialPlatforms || []
                  set('socialPlatforms', cur.includes(key) ? cur.filter(k => k !== key) : [...cur, key])
                }
                return (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 8 }}>
                    {connected.map(p => {
                      const sel = (form.socialPlatforms || []).includes(p.key)
                      return (
                        <button key={p.key} type="button" onClick={() => toggle(p.key)} title={`${p.label} — connected`} style={{
                          position: 'relative',
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                          width: 76, padding: '12px 6px 8px',
                          background: sel ? `${p.color}20` : 'rgba(255,255,255,0.04)',
                          border: `1.5px solid ${sel ? p.color : 'rgba(255,255,255,0.12)'}`,
                          borderRadius: 14, cursor: 'pointer', transition: 'all 0.15s',
                        }}>
                          {/* selected check badge */}
                          {sel && (
                            <span style={{ position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: '50%', background: p.color, border: '2px solid #1c1a13', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Check size={10} color="#fff" strokeWidth={3} />
                            </span>
                          )}
                          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {PLAT_ICONS[p.key]}
                            {/* green online dot */}
                            <span style={{ position: 'absolute', bottom: -2, right: -5, width: 9, height: 9, borderRadius: '50%', background: '#10b981', border: '2px solid #1c1a13', boxShadow: '0 0 5px #10b981' }} />
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 700, color: sel ? p.color : 'rgba(255,255,255,0.75)' }}>{p.label}</span>
                          <span style={{ fontSize: 9, fontWeight: 700, color: '#10b981', letterSpacing: '0.03em' }}>● Connected</span>
                        </button>
                      )
                    })}
                    {unconnected.map(p => (
                      <button
                        key={p.key}
                        type="button"
                        onClick={() => openConnectPopup(p.key)}
                        title={`${p.label} — not connected, click to connect`}
                        style={{
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                          width: 76, padding: '12px 6px 8px',
                          background: 'rgba(255,255,255,0.02)',
                          border: '1px dashed rgba(255,255,255,0.14)',
                          borderRadius: 14, cursor: 'pointer', transition: 'all 0.15s',
                        }}
                      >
                        <div style={{ filter: 'grayscale(1)', opacity: 0.45, display: 'flex' }}>
                          {PLAT_ICONS[p.key]}
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>{p.label}</span>
                        <span style={{ fontSize: 9, fontWeight: 700, color: '#f59e0b', letterSpacing: '0.03em' }}>+ Connect</span>
                      </button>
                    ))}
                  </div>
                )
              })()}
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: -2, marginBottom: 4 }}>
                Tap a connected platform to target it. Faded icons aren't connected yet.
              </p>
            </>
          )}

          {type === "seo_blog" && (
            <>
              <label style={s.label}>Primary Keyword <span style={s.req}>*</span></label>
              <input value={form.keywords} onChange={(e) => set("keywords", e.target.value)} placeholder="e.g. best marketing tools 2025" style={s.input} />
              <label style={s.label}>Industry / Niche</label>
              <input value={form.industry} onChange={(e) => set("industry", e.target.value)} placeholder="e.g. SaaS, Marketing, Finance" style={s.input} />
            </>
          )}
          {type === "analytics_report" && (
            <>
              <label style={s.label}>Report Period <span style={s.req}>*</span></label>
              <input value={form.reportPeriod} onChange={(e) => set("reportPeriod", e.target.value)} placeholder="e.g. Q1 2025, January 2025" style={s.input} />
            </>
          )}
          {type === "funnel_cro" && (
            <>
              <label style={s.label}>Current Funnel Stage to Optimize</label>
              <select value={form.funnelStage} onChange={(e) => set("funnelStage", e.target.value)} style={{ ...s.input, cursor: "pointer" }}>
                <option value="">Select stage...</option>
                <option value="awareness">Awareness (Top of Funnel)</option>
                <option value="consideration">Consideration (Middle of Funnel)</option>
                <option value="conversion">Conversion (Bottom of Funnel)</option>
                <option value="retention">Retention & Upsell</option>
                <option value="full">Full Funnel Audit</option>
              </select>
            </>
          )}

          {(type === "event" || type === "event_full") && (
            <>
              {/* ── Unified Date & Time box ── */}
              <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.10)", borderRadius: 14, padding: "16px 20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>

                  {/* DATE — native calendar picker */}
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(240,235,224,0.45)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>
                      Event Start Date <span style={{ color: meta.color }}>*</span>
                    </div>
                    <input
                      type="date"
                      value={form.date}
                      onChange={e => set("date", e.target.value)}
                      style={{ ...s.input, margin: 0, colorScheme: "dark", minWidth: 160, accentColor: meta.color }}
                    />
                  </div>

                  {/* Divider */}
                  <div style={{ width: 1, height: 48, background: "rgba(255,255,255,0.08)", flexShrink: 0 }} />

                  {/* TIME — custom AM/PM picker */}
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(240,235,224,0.45)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>
                      Event Time <span style={{ color: meta.color }}>*</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <input
                        type="time"
                        value={form.time}
                        onChange={e => set("time", e.target.value)}
                        style={{ ...s.input, margin: 0, colorScheme: "dark", accentColor: meta.color, minWidth: 160, padding: "10px 12px" }}
                      />
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        {["AM","PM"].map(val => {
                          const h = parseInt((form.time||"12:00").split(":")[0]||"12",10)
                          const active = val==="AM" ? h<12 : h>=12
                          return (
                            <button key={val} type="button" onClick={() => {
                              const [hh, mm] = (form.time||"12:00").split(":")
                              let h24 = parseInt(hh||"12",10)
                              if(val==="PM" && h24<12) h24+=12
                              if(val==="AM" && h24>=12) h24-=12
                              set("time", `${String(h24).padStart(2,"0")}:${mm||"00"}`)
                            }} style={{ padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700, border: "1px solid", cursor: "pointer", fontFamily: "inherit", background: active ? meta.color : "rgba(255,255,255,0.05)", color: active ? "#0e0c09" : "rgba(255,255,255,0.4)", borderColor: active ? meta.color : "rgba(255,255,255,0.12)" }}>{val}</button>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <label style={s.label}>
                Event End Date{" "}
                <span style={{ color: "rgba(255,255,255,0.35)", fontSize: "12px", fontWeight: 400 }}>(optional)</span>
              </label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => set("endDate", e.target.value)}
                style={{ ...s.input, colorScheme: "dark", accentColor: meta.color }}
              />

              <label style={s.label}>
                Location <span style={s.req}>*</span>
              </label>
              <div ref={locationRef} style={{ position: "relative" }}>
                {/* Selected location chips */}
                {form.eventLocations.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                    {form.eventLocations.map((loc) => (
                      <span key={loc} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 10px", background: `${meta.color}18`, border: `1px solid ${meta.color}40`, borderRadius: 20, fontSize: 12, color: "#f0ebe0" }}>
                        <MapPin size={10} style={{ color: meta.color, flexShrink: 0 }} />
                        {loc}
                        <button
                          type="button"
                          onClick={() => set("eventLocations", form.eventLocations.filter(l => l !== loc))}
                          style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", color: "rgba(255,255,255,0.4)", marginLeft: 2 }}
                        >
                          <X size={11} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                {/* Search input */}
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <MapPin size={14} style={{ position: "absolute", left: 14, color: "rgba(255,255,255,0.35)", pointerEvents: "none", zIndex: 1 }} />
                  <input
                    value={locationSearch}
                    onChange={(e) => {
                      setLocationSearch(e.target.value);
                      setLocationOpen(e.target.value.length > 0);
                    }}
                    onFocus={() => setLocationOpen(true)}
                    onBlur={() => setTimeout(() => setLocationOpen(false), 150)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && locationSearch.trim()) {
                        e.preventDefault();
                        const val = locationSearch.trim();
                        if (!form.eventLocations.includes(val)) set("eventLocations", [...form.eventLocations, val]);
                        setLocationSearch("");
                        setLocationOpen(false);
                      }
                      if (e.key === "Escape") setLocationOpen(false);
                    }}
                    placeholder={form.eventLocations.length ? "Add another location..." : "Type city, venue or full address..."}
                    style={{ ...s.input, margin: 0, paddingLeft: 36 }}
                  />
                </div>
                <AnimatePresence>
                  {locationOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      style={{
                        position: "absolute",
                        top: "110%",
                        left: 0,
                        right: 0,
                        zIndex: 60,
                        background: "#1c1a13",
                        border: `1px solid ${meta.color}30`,
                        borderRadius: "12px",
                        overflow: "hidden",
                        boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
                      }}
                    >
                      <div style={{ maxHeight: "220px", overflowY: "auto" }}>
                        {INDIAN_CITIES.filter((c) =>
                          c.toLowerCase().includes(locationSearch.toLowerCase()) &&
                          !form.eventLocations.includes(c)
                        ).slice(0, 10).map((city) => (
                          <button
                            key={city}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              set("eventLocations", [...form.eventLocations, city]);
                              setLocationSearch("");
                              setLocationOpen(false);
                            }}
                            style={{
                              width: "100%",
                              padding: "10px 16px",
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              color: "rgba(255,255,255,0.7)",
                              fontSize: "13px",
                              textAlign: "left",
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                            }}
                          >
                            <MapPin size={11} style={{ color: "rgba(255,255,255,0.35)", flexShrink: 0 }} />
                            {city}
                          </button>
                        ))}
                        {/* Custom entry option */}
                        {!INDIAN_CITIES.some(c => c.toLowerCase() === locationSearch.toLowerCase()) && (
                          <button
                            onMouseDown={(e) => {
                              e.preventDefault();
                              const val = locationSearch.trim();
                              if (val && !form.eventLocations.includes(val)) set("eventLocations", [...form.eventLocations, val]);
                              setLocationSearch("");
                              setLocationOpen(false);
                            }}
                            style={{
                              width: "100%",
                              padding: "10px 16px",
                              background: `${meta.color}10`,
                              border: "none",
                              borderTop: "1px solid rgba(255,255,255,0.06)",
                              cursor: "pointer",
                              color: meta.color,
                              fontSize: "13px",
                              textAlign: "left",
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                            }}
                          >
                            <MapPin size={11} style={{ flexShrink: 0 }} />
                            Add "{locationSearch.trim()}"
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* ── Event URL ── */}
              <label style={{ ...s.label, marginTop: 0 }}>
                Event URL <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, fontWeight: 400 }}>(optional)</span>
              </label>
              <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                {[{ val: "manual", label: "I have a URL" }, { val: "create", label: "Create one for me" }].map(({ val, label }) => {
                  const active = form.eventUrlMode === val;
                  return (
                    <button key={val} type="button" onClick={() => set("eventUrlMode", val)} style={{
                      flex: 1, padding: "10px 14px", borderRadius: 10, cursor: "pointer",
                      background: active ? `${meta.color}15` : "rgba(255,255,255,0.03)",
                      border: `1.5px solid ${active ? meta.color : "rgba(255,255,255,0.1)"}`,
                      color: active ? meta.color : "rgba(255,255,255,0.5)",
                      fontSize: 13, fontWeight: 700, transition: "all 0.15s",
                    }}>
                      {active && <Check size={12} style={{ display: "inline", marginRight: 5 }} />}{label}
                    </button>
                  );
                })}
              </div>
              {form.eventUrlMode === "manual" ? (
                <div style={{ position: "relative" }}>
                  <Link size={14} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.35)" }} />
                  <input value={form.eventUrl} onChange={(e) => set("eventUrl", e.target.value)} placeholder="https://eventbrite.com/your-event" style={{ ...s.input, paddingLeft: 36 }} />
                </div>
              ) : (
                <div>
              {(form.eventUrl || generatedEventUrl) ? (
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 16px", background: `${meta.color}10`, border: `1px solid ${meta.color}40`, borderRadius: 12 }}>
                    <Link size={14} style={{ color: meta.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: "#f0ebe0", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {form.eventUrl || generatedEventUrl}
                    </span>
                    <button
                      type="button"
                      onClick={() => navigator.clipboard?.writeText(form.eventUrl || generatedEventUrl)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: meta.color, fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0 }}
                    >
                      Copy
                    </button>
                    <a href={form.eventUrl || generatedEventUrl} target="_blank" rel="noopener noreferrer" style={{ color: meta.color, display: "flex", alignItems: "center", flexShrink: 0 }}>
                      <ExternalLink size={13} />
                    </a>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const data = { name: form.name, description: form.description, date: form.date, endDate: form.endDate, time: form.time, locations: form.eventLocations, location: form.eventLocations?.join(", ") || form.location, imageUrl: eventImagePreview || "", targetAudience: form.targetAudience, brandName: form.brandName, price: form.price, contactEmail: form.contactEmail, registrationUrl: form.eventUrl };
                      const hash = btoa(unescape(encodeURIComponent(JSON.stringify(data))));
                      const url = `https://agents.evokemarketplace.com/e#${hash}`;
                      set("eventUrl", url); setGeneratedEventUrl(url);
                    }}
                    style={{ marginTop: 8, fontSize: 12, color: "rgba(255,255,255,0.4)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", padding: 0 }}
                  >
                    Regenerate URL
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={!form.name}
                  onClick={() => {
                    if (!form.name) return;
                    const data = { name: form.name, description: form.description, date: form.date, endDate: form.endDate, time: form.time, locations: form.eventLocations, location: form.eventLocations?.join(", ") || form.location, imageUrl: eventImagePreview || "", targetAudience: form.targetAudience, brandName: form.brandName, price: form.price, contactEmail: form.contactEmail, registrationUrl: form.eventUrl };
                    const hash = btoa(unescape(encodeURIComponent(JSON.stringify(data))));
                    const url = `https://agents.evokemarketplace.com/e#${hash}`;
                    set("eventUrl", url); setGeneratedEventUrl(url);
                  }}
                  style={{
                    width: "100%", padding: "13px 16px", borderRadius: 12,
                    background: form.name ? `linear-gradient(135deg, ${meta.color}20, ${meta.color}10)` : "rgba(255,255,255,0.03)",
                    border: `1.5px solid ${form.name ? meta.color + "60" : "rgba(255,255,255,0.1)"}`,
                    color: form.name ? meta.color : "rgba(255,255,255,0.3)",
                    fontSize: 13, fontWeight: 700, cursor: form.name ? "pointer" : "not-allowed",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all 0.2s",
                  }}
                >
                  <Link size={14} /> {form.name ? "Generate Event Page URL" : "Enter event name first"}
                </button>
              )}
                </div>
              )}

              {/* ── Event Image ── */}
              <label style={{ ...s.label, marginTop: 24 }}>
                Event Image <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, fontWeight: 400 }}>(optional)</span>
              </label>
              <EventBannerGenerator
                eventData={{
                  name: form.name,
                  date: form.date,
                  endDate: form.endDate,
                  time: form.time,
                  location: form.eventLocations?.length ? form.eventLocations.join(", ") : form.location,
                  tagline: form.description?.substring(0, 80),
                  brandName: form.brandName,
                  eventUrl: form.eventUrl || generatedEventUrl,
                }}
                onBannerGenerated={(banner) => {
                  if (banner?.imageUrl) {
                    fetch(banner.imageUrl)
                      .then(res => res.blob())
                      .then(blob => {
                        const file = new File([blob], "event-banner.png", { type: "image/png" });
                        setEventImageFile(file);
                        setEventImagePreview(banner.imageUrl);
                      })
                      .catch(err => console.warn("Could not convert banner to file:", err.message));
                  }
                }}
                loading={posterGenerating}
                disabled={!form.name.trim()}
              />
              <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(200,151,62,0.08)", border: "1px solid rgba(200,151,62,0.2)", borderRadius: "10px", padding: "9px 14px", marginBottom: "10px", fontSize: "12px", color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>
                <span style={{ fontSize: "15px" }}>✨</span>
                <span>AI-generated poster with your event details. QR code auto-adds if you have an event URL for easy registration.</span>
              </div>
              <div
                style={{
                  border: `2px dashed ${eventImageFile ? "rgba(124,58,237,0.5)" : "rgba(245,240,232,0.15)"}`,
                  borderRadius: "14px", padding: "28px 20px", textAlign: "center",
                  cursor: "pointer", color: "rgba(255,255,255,0.5)", fontSize: "14px",
                  background: eventImageFile ? "rgba(124,58,237,0.04)" : "transparent", transition: "all 0.2s",
                }}
                onClick={() => document.getElementById("event-image-input").click()}
                onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f && f.type.startsWith("image/")) { setEventImageFile(f); setEventImagePreview(URL.createObjectURL(f)); } }}
                onDragOver={(e) => e.preventDefault()}
              >
                {eventImagePreview ? (
                  <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                    <img src={eventImagePreview} alt="preview" style={{ width: 72, height: 72, objectFit: "cover", borderRadius: "10px", border: "1px solid rgba(200,151,62,0.4)" }} />
                    <div style={{ textAlign: "left", flex: 1 }}>
                      <div style={{ color: meta.color, fontWeight: 600, fontSize: "13px" }}>{eventImageFile.name}</div>
                      <div style={{ color: "rgba(255,255,255,0.35)", fontSize: "12px", marginTop: "2px" }}>{(eventImageFile.size / 1024).toFixed(0)} KB · Click to change</div>
                      <div style={{ marginTop: "6px", display: "flex", alignItems: "center", gap: "12px" }}>
                        <a href={eventImagePreview} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} style={{ display: "flex", alignItems: "center", gap: "4px", background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: "12px", padding: 0, textDecoration: "none" }}>
                          <ExternalLink size={12} /> View
                        </a>
                        <button onClick={(e) => { e.stopPropagation(); setEventImageFile(null); setEventImagePreview(null); }} style={{ display: "flex", alignItems: "center", gap: "4px", background: "none", border: "none", color: "#f87171", cursor: "pointer", fontSize: "12px", padding: 0 }}>
                          <X size={12} /> Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <><Upload size={26} style={{ color: "rgba(255,255,255,0.25)", marginBottom: "8px" }} /><div>Drag &amp; drop or <span style={{ color: meta.color }}>click to upload</span></div><div style={{ fontSize: "12px", marginTop: "4px" }}>PNG, JPG, WEBP - max 10MB</div></>
                )}
                <input id="event-image-input" type="file" accept="image/png,image/jpeg,image/webp" style={{ display: "none" }} onChange={(e) => { const f = e.target.files[0]; if (f) { setEventImageFile(f); setEventImagePreview(URL.createObjectURL(f)); } }} />
              </div>
              {eventImageUploading && (
                <div style={{ marginTop: "8px", fontSize: "12px", color: "rgba(255,255,255,0.5)", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> Uploading image...
                </div>
              )}

            </>
          )}

          {(type === "product" || type === "brand") && (
            <>
              <label style={s.label}>
                {type === "product" ? "Product URL" : "Website"}{" "}
                <span
                  style={{
                    color: "rgba(255,255,255,0.35)",
                    fontSize: "12px",
                    fontWeight: 400,
                  }}
                >
                  (optional)
                </span>
              </label>
              <div style={{ position: "relative" }}>
                <Link
                  size={14}
                  style={{
                    position: "absolute",
                    left: 14,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "rgba(255,255,255,0.35)",
                  }}
                />
                <input
                  value={form.website}
                  onChange={(e) => set("website", e.target.value)}
                  placeholder="https://your-website.com"
                  style={{ ...s.input, paddingLeft: "36px" }}
                />
              </div>
            </>
          )}

          {type !== "event" && type !== "growth_strategy" && type !== "growth_agent" && type !== "content_calendar" && type !== "ads_creation" && type !== "ads_manager" && type !== "target_audience" && type !== "email_drip" && type !== "influencer" && type !== "analytics_report" && !EXEC_TYPES.includes(type) && (
            <>
              <label style={s.label}>
                Price / Pricing Info{" "}
                <span
                  style={{
                    color: "rgba(255,255,255,0.35)",
                    fontSize: "12px",
                    fontWeight: 400,
                  }}
                >
                  (optional)
                </span>
              </label>
              <PriceCurrencyField
                currency={form.priceCurrency || 'USD'}
                amount={form.price}
                onCurrencyChange={(v) => set('priceCurrency', v)}
                onAmountChange={(v) => set('price', v)}
                inputStyle={s.input}
              />
            </>
          )}

          <label style={{ ...s.label, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>Target Audience <span style={s.req}>*</span></span>
            {prefill?.targetAudience?.length > 0 && <span style={{ fontSize: 10, fontWeight: 700, color: '#c8973e', background: 'rgba(200,151,62,0.12)', border: '1px solid rgba(200,151,62,0.3)', borderRadius: 100, padding: '1px 7px', letterSpacing: '0.04em' }}>✓ Pre-filled</span>}
          </label>
          <div ref={audienceRef} style={{ position: "relative" }}>
            <button
              onClick={() => setAudienceOpen((v) => !v)}
              style={{
                ...s.input,
                textAlign: "left",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                cursor: "pointer",
              }}
            >
              <span
                style={{
                  color:
                    form.targetAudience.length > 0
                      ? "rgba(255,255,255,0.9)"
                      : "#94a3b8",
                }}
              >
                {form.targetAudience.length > 0
                  ? form.targetAudience.join(", ")
                  : "Select target audience(s)"}
              </span>
              <ChevronDown
                size={14}
                style={{ color: "rgba(255,255,255,0.5)", flexShrink: 0 }}
              />
            </button>
            <AnimatePresence>
              {audienceOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  style={{
                    position: "absolute",
                    top: "110%",
                    left: 0,
                    right: 0,
                    zIndex: 50,
                    background: "#1c1a13",
                    border: `1px solid ${meta.color}30`,
                    borderRadius: "12px",
                    maxHeight: "280px",
                    overflowY: "auto",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
                    scrollbarWidth: "thin",
                    scrollbarColor: `${meta.color}55 transparent`,
                  }}
                >
                  {audienceOptions.map((opt) => {
                    const active = form.targetAudience.includes(opt);
                    return (
                      <button
                        key={opt}
                        onClick={() => toggleAudience(opt)}
                        style={{
                          width: "100%",
                          padding: "10px 16px",
                          background: active ? `${meta.color}12` : "none",
                          border: "none",
                          cursor: "pointer",
                          color: active ? meta.color : "rgba(255,255,255,0.7)",
                          fontSize: "13px",
                          textAlign: "left",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        {active && <Check size={12} />}
                        {opt}
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {type !== "ads_creation" && type !== "ads_manager" && type !== "target_audience" && (
            <>
              <label style={{ ...s.label, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>Campaign Goal <span style={s.req}>*</span></span>
                {prefill?.goalType && <span style={{ fontSize: 10, fontWeight: 700, color: '#c8973e', background: 'rgba(200,151,62,0.12)', border: '1px solid rgba(200,151,62,0.3)', borderRadius: 100, padding: '1px 7px', letterSpacing: '0.04em' }}>✓ Pre-filled</span>}
              </label>
              <select
                value={form.goalType}
                onChange={(e) => set("goalType", e.target.value)}
                style={{ ...s.input, cursor: "pointer", colorScheme: "dark", marginBottom: "8px" }}
              >
                {(type === "email_drip" ? [
                  "", "Drive Sales / Conversions", "Generate Leads",
                  "Re-engage Existing Customers", "Onboard New Users",
                  "Build Brand Authority", "Promote an Event",
                  "Upsell / Cross-sell", "Other",
                ] : [
                  "",
                  type === "event" || type === "event_full" ? "Drive Event Registrations / Attendance" : null,
                  "Increase Brand Awareness",
                  "Generate Leads",
                  "Drive Sales / Conversions",
                  "Grow Community / Following",
                  "Build Brand Authority",
                  "Launch New Product / Event",
                  "Re-engage Existing Customers",
                  "Boost Website Traffic",
                  "Other",
                ].filter(v => v !== null)).map((v) => (
                  <option key={v} value={v} style={{ background: "#1c1a13", color: v ? "#f0ebe0" : "rgba(240,235,224,0.4)" }}>
                    {v || "Select campaign goal..."}
                  </option>
                ))}
              </select>
              {type !== 'product' && (
                <textarea
                  value={form.goal}
                  onChange={(e) => set("goal", e.target.value)}
                  placeholder="Describe your goal in more detail... (optional)"
                  style={{ ...s.textarea, minHeight: "80px" }}
                />
              )}
            </>
          )}

          {type !== "event" && type !== "growth_strategy" && type !== "growth_agent" && type !== "content_calendar" && type !== "product" && (
            <>
              <label style={{ ...s.label, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>Brand Name <span style={s.req}>*</span></span>
                {prefill?.brandName && <span style={{ fontSize: 10, fontWeight: 700, color: '#c8973e', background: 'rgba(200,151,62,0.12)', border: '1px solid rgba(200,151,62,0.3)', borderRadius: 100, padding: '1px 7px', letterSpacing: '0.04em' }}>✓ Pre-filled</span>}
              </label>
              <input
                value={form.brandName}
                onChange={(e) => set("brandName", e.target.value)}
                placeholder="Your brand or company name"
                style={s.input}
              />
            </>
          )}

          {/* ── Email Drip: sequence type + email count ── */}
          {type === "email_drip" && (
            <>
              <label style={s.label}>Email Sequence Type <span style={s.req}>*</span></label>
              <select
                value={form.funnelStage || ""}
                onChange={(e) => set("funnelStage", e.target.value)}
                style={{ ...s.input, cursor: "pointer", colorScheme: "dark" }}
              >
                {[
                  "", "Onboarding / Welcome Series", "Lead Nurturing",
                  "Sales / Conversion", "Re-engagement",
                  "Post-Purchase / Upsell", "Cart Abandonment Recovery",
                  "Educational / Drip Content", "Event Promotion",
                ].map((v) => (
                  <option key={v} value={v} style={{ background: "#1c1a13", color: v ? "#f0ebe0" : "rgba(240,235,224,0.4)" }}>
                    {v || "Select sequence type..."}
                  </option>
                ))}
              </select>

              <label style={s.label}>Number of Emails</label>
              <select
                value={form.campaignDays || 5}
                onChange={(e) => set("campaignDays", parseInt(e.target.value))}
                style={{ ...s.input, cursor: "pointer", colorScheme: "dark" }}
              >
                {[
                  { v: 3, l: "3 Emails" },
                  { v: 5, l: "5 Emails (Recommended)" },
                  { v: 7, l: "7 Emails" },
                  { v: 10, l: "10 Emails" },
                ].map(({ v, l }) => (
                  <option key={v} value={v} style={{ background: "#1c1a13", color: "#f0ebe0" }}>{l}</option>
                ))}
              </select>
            </>
          )}

          {(type === "product" || type === "brand" || (type === "ads_creation" && (form.contentTypes || []).some(f => f === "Video Ad" || f === "Story / Reel Ad"))) && (
            <>
              <div style={s.divider} />
              <p style={s.sectionTitle}>{type === "brand" ? "Brand Image" : type === "ads_creation" ? "Ad Video Source Image" : "Product Image"}</p>
              {type === "ads_creation" && (
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: -4, marginBottom: 8 }}>
                  Upload a product/creative image to generate an actual ad video below — text alone can't produce video.
                </p>
              )}
              <label
                style={{ ...s.label, marginTop: "12px" }}
                id="product-image-field"
              >
                {type === "brand" ? "Brand / Campaign Image" : type === "ads_creation" ? "Creative Image" : "Product Image"}{" "}
                <span
                  style={{
                    color: "rgba(255,255,255,0.35)",
                    fontSize: "12px",
                    fontWeight: 400,
                  }}
                >
                  (optional)
                </span>
              </label>
              <div
                style={{
                  ...s.dropZone,
                  borderColor: form.imagePreview
                    ? `${meta.color}50`
                    : "rgba(245,240,232,0.15)",
                }}
                onClick={() =>
                  document.getElementById("main-image-input").click()
                }
                onDrop={(e) => {
                  e.preventDefault();
                  handleImageFile(e.dataTransfer.files[0]);
                }}
                onDragOver={(e) => e.preventDefault()}
              >
                {form.imagePreview ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "16px",
                    }}
                  >
                    <img
                      src={form.imagePreview}
                      alt="preview"
                      style={{
                        width: 80,
                        height: 80,
                        objectFit: "cover",
                        borderRadius: "10px",
                        border: `1px solid ${meta.color}40`,
                      }}
                    />
                    <div style={{ textAlign: "left" }}>
                      <div
                        style={{
                          color: meta.color,
                          fontWeight: 600,
                          fontSize: "14px",
                        }}
                      >
                        {form.imageFile?.name || "AI Generated Image"}
                      </div>
                      <div
                        style={{
                          color: "rgba(255,255,255,0.35)",
                          fontSize: "12px",
                          marginTop: "4px",
                        }}
                      >
                        Click to change image
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          set("imageFile", null);
                          set("imagePreview", null);
                        }}
                        style={{
                          marginTop: "6px",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                          background: "none",
                          border: "none",
                          color: "#f87171",
                          cursor: "pointer",
                          fontSize: "12px",
                          padding: 0,
                        }}
                      >
                        <X size={12} /> Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <Upload
                      size={28}
                      style={{
                        color: "rgba(255,255,255,0.25)",
                        marginBottom: "10px",
                      }}
                    />
                    <div>
                      <span style={{ color: meta.color }}>Click to upload</span>{" "}
                      or drag and drop
                    </div>
                    <div style={{ fontSize: "12px", marginTop: "4px" }}>
                      PNG, JPG, WEBP - max 100MB
                    </div>
                  </>
                )}
                <input
                  id="main-image-input"
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={(e) => handleImageFile(e.target.files[0])}
                />
              </div>

              {/* ── Visual Converters (shown after image upload) ── */}
              {form.imagePreview && (
                <div style={{ marginTop: 16 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.35)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>
                    Generate Visual Assets
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                    {CONVERTERS.filter((conv) => type !== "ads_creation" || conv.type === "video").map((conv) => {
                      const res = assetResults[conv.key];
                      const isRunning = generatingAsset === conv.key;
                      const isDone = !!res && !res.error;
                      const isError = !!res?.error;
                      return (
                        <div
                          key={conv.key}
                          onClick={() => !isRunning && !generatingAsset && runConverter(conv)}
                          style={{
                            background: isDone ? `${conv.color}12` : "rgba(255,255,255,0.03)",
                            border: `1px solid ${isDone ? conv.color + "50" : isError ? "rgba(248,113,113,0.4)" : "rgba(255,255,255,0.09)"}`,
                            borderRadius: 10, padding: "10px 8px",
                            cursor: isRunning || generatingAsset ? "not-allowed" : "pointer",
                            opacity: generatingAsset && !isRunning ? 0.5 : 1,
                            transition: "all 0.2s", textAlign: "center",
                          }}
                          onMouseEnter={e => { if (!generatingAsset && !isDone) e.currentTarget.style.borderColor = conv.color + "80" }}
                          onMouseLeave={e => { if (!isDone) e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)" }}
                        >
                          {/* Preview for done state */}
                          {isDone && res.type === "video" && (
                            <video
                              src={res.url} autoPlay loop muted playsInline
                              style={{ width: "100%", borderRadius: 6, marginBottom: 6, maxHeight: 70, objectFit: "cover" }}
                            />
                          )}
                          {isDone && res.type === "text" && (
                            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.45)", lineHeight: 1.4, marginBottom: 6, maxHeight: 50, overflow: "hidden", textAlign: "left", padding: "0 2px" }}>
                              {res.text?.slice(0, 120)}…
                            </div>
                          )}

                          {/* Icon / spinner */}
                          <div style={{ fontSize: 16, marginBottom: 4 }}>
                            {isRunning
                              ? <Loader2 size={14} color={conv.color} style={{ animation: "spin 1s linear infinite", margin: "0 auto" }} />
                              : isDone
                                ? <span style={{ color: "#4ade80", fontSize: 13 }}>✓</span>
                                : <span style={{ color: conv.color, opacity: 0.8 }}>{conv.icon}</span>
                            }
                          </div>

                          <div style={{ fontSize: 10, fontWeight: 700, color: isDone ? conv.color : "rgba(255,255,255,0.55)", lineHeight: 1.2 }}>
                            {conv.label}
                          </div>
                          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", marginTop: 2 }}>
                            {isRunning ? "Generating…" : isDone ? (res.type === "video" ? "Video ready" : "Text ready") : isError ? "Failed — retry" : conv.type === "video" ? "WaveSpeed" : "Gemini"}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {/* Show any generated video prominently */}
                  {Object.values(assetResults).some(r => r?.type === "video" && r.url) && (
                    <div style={{ marginTop: 12, padding: "10px 12px", background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 10, fontSize: 11, color: "rgba(255,255,255,0.5)" }}>
                      {type === "ads_creation"
                        ? <>✓ Generated video will be attached as your <strong style={{ color: "#4ade80" }}>video ad creative</strong> on the results page.</>
                        : <>✓ Generated videos will be posted as <strong style={{ color: "#4ade80" }}>video</strong> to Instagram, Facebook & LinkedIn. Photos post as <strong style={{ color: "#c8973e" }}>image</strong>.</>}
                    </div>
                  )}
                </div>
              )}
            </>
          )}


          {/* Publishing Settings — hidden for strategy/growth/calendar, all executive/CMO module types, and Package C ad types */}
          {type !== "growth_strategy" && type !== "growth_agent" && type !== "content_calendar" && type !== "ads_creation" && type !== "ads_manager" && type !== "target_audience" && type !== "email_drip" && type !== "analytics_report" && type !== "sales_enablement" && type !== "competitive_intel" && type !== "funnel_cro" && type !== "brand_strategy" && !EXEC_TYPES.includes(type) && (
            <>
          <div style={s.divider} />
          <p style={s.sectionTitle}>Publishing Settings</p>

          {/* ── Campaign Duration ── */}
          <label style={{ ...s.label, marginTop: "12px" }}>
            Campaign Duration <span style={s.req}>*</span>
          </label>
          <select
            value={form.campaignDays || 7}
            onChange={(e) => set("campaignDays", parseInt(e.target.value))}
            style={{
              width: "100%",
              padding: "10px 14px",
              background: "#1c1a13",
              border: "1px solid rgba(200,151,62,0.25)",
              borderRadius: "10px",
              color: "#f0ebe0",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "'Inter', sans-serif",
              outline: "none",
              transition: "border-color 0.2s",
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='%23c8973e' d='M1 1l5 5 5-5'/%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 12px center",
              paddingRight: "36px",
              appearance: "none",
            }}
            onFocus={(e) => e.target.style.borderColor = "#c8973e"}
            onBlur={(e) => e.target.style.borderColor = "rgba(200,151,62,0.25)"}
          >
            <option value="1">1 Day (Single post)</option>
            <option value="7">7 Days (1 week)</option>
            <option value="10">10 Days (Boost phase)</option>
            <option value="14">14 Days (2 weeks)</option>
            <option value="21">21 Days (3 weeks)</option>
            <option value="30">30 Days (Full month)</option>
            <option value="45">45 Days</option>
            <option value="60">60 Days</option>
            <option value="90">90 Days</option>
          </select>

          {form.campaignDays > 1 && (
            <div style={{ marginTop: "8px", padding: "10px 14px", background: `${meta.color}08`, border: `1px solid ${meta.color}25`, borderRadius: "10px", display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>
              <span style={{ color: meta.color, fontWeight: 700 }}>🗓 {form.campaignDays}-day campaign</span>
              · AI will generate unique content for every day · Auto-posts daily at your chosen time
            </div>
          )}

          {/* ── Posts per day ── */}
          <label style={{ ...s.label, marginTop: "12px" }}>Posts per Day</label>
          <div style={{ display: "flex", gap: "8px" }}>
            {[1, 2, 3].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setPostsPerDay(n)}
                style={{
                  flex: 1,
                  padding: "9px 0",
                  borderRadius: "10px",
                  border: (form.postsPerDay || 1) === n ? "1px solid #c8973e" : "1px solid rgba(200,151,62,0.2)",
                  background: (form.postsPerDay || 1) === n ? "rgba(200,151,62,0.14)" : "#1c1a13",
                  color: (form.postsPerDay || 1) === n ? "#f0ebe0" : "rgba(255,255,255,0.5)",
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                {n}
              </button>
            ))}
          </div>
          {(form.postsPerDay || 1) > 1 && (
            <div style={{ marginTop: "8px", padding: "10px 14px", background: `${meta.color}08`, border: `1px solid ${meta.color}25`, borderRadius: "10px", fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>
              AI will write <strong style={{ color: meta.color }}>{form.postsPerDay}</strong> distinct posts per day, one per time slot below.
            </div>
          )}

          {/* ── Schedule Date + Time(s) ── */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "16px",
              marginTop: "12px",
            }}
          >
            <div>
              <label style={{ ...s.label, marginTop: 0 }}>
                Schedule Date
                <span
                  style={{
                    color: "rgba(255,255,255,0.35)",
                    fontSize: "11px",
                    fontWeight: 400,
                    marginLeft: 6,
                  }}
                >
                  (defaults to today)
                </span>
              </label>
              <input
                type="date"
                value={form.postDate}
                onChange={(e) => set("postDate", e.target.value)}
                style={s.input}
              />
            </div>
            {(form.postsPerDay || 1) === 1 ? (
              <div>
                <label style={{ ...s.label, marginTop: 0 }}>Schedule Time</label>
                <input
                  type="time"
                  value={form.postTime}
                  onChange={(e) => { set("postTime", e.target.value); setPostTimeAt(0, e.target.value); }}
                  style={s.input}
                />
              </div>
            ) : (
              <div>
                <label style={{ ...s.label, marginTop: 0 }}>Post Times</label>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {Array.from({ length: form.postsPerDay }, (_, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", width: "44px", flexShrink: 0 }}>
                        Post {i + 1}
                      </span>
                      <input
                        type="time"
                        value={form.postTimes?.[i] || ""}
                        onChange={(e) => setPostTimeAt(i, e.target.value)}
                        style={s.input}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <label style={s.label}>Platforms to Post</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "4px" }}>
            {PLATFORM_OPTIONS.map((p) => {
              const active = form.platforms.includes(p.key);
              // Map platform key to connected accounts key
              const accountKey = p.key === "email" ? "gmail" : p.key;
              const isAlwaysOn = p.key === "whatsapp";
              const isConnected = isAlwaysOn || connectedAccounts[accountKey]?.connected;
              return (
                <button
                  key={p.key}
                  onClick={() => {
                    if (!isConnected && !isAlwaysOn) {
                      openConnectPopup(p.key === "email" ? "gmail" : p.key);
                    } else {
                      togglePlatform(p.key);
                    }
                  }}
                  title={isConnected ? (active ? `Remove ${p.label}` : `Add ${p.label}`) : `Connect ${p.label} to enable`}
                  style={{
                    display: "flex", flexDirection: "column", alignItems: "center",
                    gap: "4px", padding: "10px 14px", minWidth: "80px",
                    background: active && isConnected ? `${p.color}18` : "rgba(255,255,255,0.03)",
                    border: `1px solid ${active && isConnected ? p.color + "55" : "rgba(255,255,255,0.1)"}`,
                    borderRadius: "12px", cursor: "pointer",
                    opacity: !isConnected ? 0.55 : 1,
                    transition: "all 0.15s", position: "relative",
                  }}
                >
                  {/* connected dot */}
                  {isConnected && (
                    <span style={{ position: "absolute", top: 5, right: 5, width: 7, height: 7, borderRadius: "50%", background: "#10b981", boxShadow: "0 0 4px #10b981" }} />
                  )}
                  <span style={{ fontSize: "13px", fontWeight: 700, color: active && isConnected ? p.color : "rgba(255,255,255,0.7)" }}>
                    {active && isConnected && <Check size={10} style={{ display: "inline", marginRight: 3 }} />}
                    {p.label}
                  </span>
                  <span style={{ fontSize: "9px", fontWeight: 600, color: isConnected ? (isAlwaysOn ? "#10b981" : "#10b981") : "#f59e0b", letterSpacing: "0.03em" }}>
                    {isAlwaysOn ? "Always on" : isConnected ? "Connected" : "Tap to connect"}
                  </span>
                </button>
              );
            })}
          </div>
          <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", marginTop: "6px" }}>
            Green dot = connected. Tap an unconnected platform to link your account.
          </p>

            </>
          )} {/* end type !== "growth_strategy" publishing settings */}

          {/* â"€â"€ Error Banner â"€â"€ */}
          <AnimatePresence>
            {submitError && (
              <motion.div
                ref={errorRef}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                style={{
                  marginTop: "20px",
                  padding: "16px 18px",
                  background: "rgba(239,68,68,0.12)",
                  border: "1.5px solid rgba(239,68,68,0.5)",
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                  color: "#fca5a5",
                  fontSize: "14px",
                  fontWeight: 600,
                }}
              >
                <AlertCircle
                  size={18}
                  style={{ marginTop: 1, flexShrink: 0, color: "#f87171" }}
                />
                <div>
                  <div style={{ color: "#f87171", fontWeight: 700, marginBottom: 3 }}>Action needed</div>
                  {submitError}
                </div>
              </motion.div>
            )}
          </AnimatePresence>


          {/* â"€â"€ Submit â"€â"€ */}
          <button onClick={handleSubmit} style={s.submitBtn} disabled={loading}>
            {loading ? (
              <>
                <Loader2
                  size={18}
                  style={{ animation: "spin 1s linear infinite" }}
                />
                {loadingPhase === "uploading-image" && "Uploading image…"}
                {loadingPhase === "uploading-video" && `Uploading video… ${tiktokVideoUploadProgress}%`}
                {loadingPhase === "reading-website" && "Reading your website…"}
                {loadingPhase === "generating" && "Generating campaign content…"}
                {loadingPhase === "generating-schedule" && `Building ${form.campaignDays}-day schedule…`}
                {!loadingPhase && "Processing…"}
              </>
            ) : (
              <>
                {type === "growth_strategy" ? "Generate My Strategy" : "Generate Campaign"} <ArrowRight size={18} />
              </>
            )}
          </button>
          <p style={{ textAlign: "center", color: "rgba(255,255,255,0.35)", fontSize: "13px", marginTop: "12px" }}>
            {type === "growth_strategy"
              ? "Powered by AI · Full strategy document generated in seconds"
              : "Content generated by AI  ·  Posted instantly to all platforms"}
          </p>
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </motion.div>
      </div>
    </div>
  );
}

