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
import { getEvokeUserProfile } from "../lib/session";
import { profileToUser } from "../lib/authUtils";
import { getUserData } from "../services/userService";
import { buildEventSlug, saveEventPage, downloadEventHtml } from "../services/eventService";

const CLOUDINARY_CLOUD = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "dxbn3vyig";
const CLOUDINARY_PRESET = "tiktok_videos"; // Unsigned preset in Cloudinary
const WS_KEY  = import.meta.env.VITE_WAVESPEED_API_KEY || "";
const GEM_KEY = import.meta.env.VITE_GEMINI_API_KEY   || "";

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
  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 3000));
    const r = await fetch(getUrl, { headers: { Authorization: `Bearer ${WS_KEY}` } });
    if (!r.ok) continue;
    const d = await r.json();
    if (d?.data?.status === "completed") return d.data.outputs?.[0] || null;
    if (d?.data?.status === "failed") throw new Error("WaveSpeed generation failed.");
  }
  throw new Error("Timed out waiting for video.");
}

/* ── Gemini text ── */
async function gemText(prompt) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEM_KEY}`,
    { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }) }
  );
  if (!res.ok) throw new Error(`Gemini ${res.status}`);
  const d = await res.json();
  return d?.candidates?.[0]?.content?.parts?.[0]?.text || "";
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
  fd.append("key", "5bd861d246cfae2342a0b898282ab18e");
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
        websiteContent = raw.slice(0, 4000); // cap at 4k chars to stay within token limits
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
  "emailSubject": "compelling email subject line",
  "emailBody": "full professional email body (3-4 paragraphs)",
  "linkedinPost": "professional LinkedIn post with relevant hashtags (150-300 words)",
  "instagramCaption": "engaging Instagram caption with emojis and hashtags (100-150 words)",
  "facebookPost": "friendly Facebook post with call to action (100-200 words)",
  "whatsappMessage": "short WhatsApp message (50-80 words, conversational tone)",
  "smsMessage": "short SMS under 160 characters",
  "seoTitle": "SEO page title (50-60 chars)",
  "seoDescription": "meta description (150-160 chars)",
  "adHeadline": "Google/social ad headline (30 chars max)",
  "adBody": "ad body copy (90 chars max)",
  "tiktokCaption": "short punchy TikTok caption with trending hashtags and a hook",
  "campaignCalendar": "${Array.from({length: form.campaignDays||7},(_,i)=>'Day '+(i+1)+': [action]').join('\\n')}",
  "positioningStatement": "one strong brand/event positioning statement"
}`;

    const schemas = {
      growth_strategy: `{
  "campaignName": "${form.name}",
  "executiveSummary": "3-paragraph executive growth strategy summary covering current position, core opportunity, and recommended strategic direction",
  "growthOpportunities": "5 specific revenue and market opportunities with estimated impact — numbered list, each with a short rationale",
  "gtmPlan": "Full go-to-market plan as plain text: describe each phase (Phase 1, Phase 2, Phase 3) with timelines and specific tactics on separate lines",
  "revenueProjection": "12-month revenue forecast as plain text: describe Month 1-3, Month 4-6, Month 7-9, Month 10-12 milestones on separate lines with realistic figures",
  "partnershipIdeas": "5 strategic partnership recommendations with partner type, value exchange, and how to approach them",
  "expansionRoadmap": "Quarter-by-quarter expansion roadmap as plain text: Q1, Q2, Q3, Q4 goals and key actions on separate lines",
  "competitorGaps": "Key competitor gaps to exploit — 4-5 specific weaknesses in the market with a recommended counter-move for each"
}`,
      growth_agent: `{
  "campaignName": "${form.name}",
  "executiveSummary": "3-paragraph client acquisition summary: ideal client profile, biggest pain point you solve, and why they choose you over competitors",
  "growthOpportunities": "5 specific client acquisition channels with estimated monthly lead volume and cost — numbered list with short rationale for each",
  "gtmPlan": "Lead generation plan as plain text: Phase 1 (outreach setup & quick wins in 30 days), Phase 2 (scale what works in 60-90 days), Phase 3 (retention & referral system). Each phase on separate lines with specific daily/weekly actions",
  "revenueProjection": "12-month new client revenue forecast as plain text: Month 1-3 (initial pipeline), Month 4-6 (conversion ramp), Month 7-9 (recurring revenue), Month 10-12 (scale target). Include realistic client numbers and deal sizes",
  "partnershipIdeas": "5 referral or partnership channels to generate clients — partner type, how many leads per month expected, and exact outreach script or approach",
  "expansionRoadmap": "Quarter-by-quarter new client roadmap as plain text: Q1 (foundation), Q2 (momentum), Q3 (scale), Q4 (optimise). Each quarter on separate lines with client targets and key actions",
  "competitorGaps": "4-5 reasons why clients leave your competitors and come to you — specific pain points, your counter-positioning for each, and the one-liner pitch to use"
}`,
      competitive_intel: `{
  "campaignName": "${form.name}",
  "competitorAnalysis": "In-depth competitor analysis (3-4 paragraphs)",
  "swotAnalysis": "Full SWOT analysis with bullet points for each quadrant",
  "marketPositioning": "How to position against competitors",
  "differentiators": "5 unique differentiators to exploit",
  "counterStrategies": "5 counter-strategies against key competitors",
  "marketTrends": "Top 5 market trends to capitalize on",
  "pricingIntel": "Pricing strategy recommendations",
  "emailSubject": "competitive briefing email subject",
  "emailBody": "competitive intelligence report email",
  "linkedinPost": "industry insights LinkedIn post (thought leadership)",
  "positioningStatement": "differentiated positioning statement",
  "campaignCalendar": "${Array.from({length:form.campaignDays||7},(_,i)=>'Day '+(i+1)+': [action]').join('\\n')}"
}`,
      content_calendar: `{
  "campaignName": "${form.name}",
  "executiveSummary": "3-paragraph content strategy overview: brand position, content opportunity, and core message framework${form.toneOfVoice ? ` — use a ${form.toneOfVoice} tone throughout` : ""}",
  "growthOpportunities": "5 specific content channels and formats that will drive the most growth — numbered list with rationale and estimated reach for each",
  "gtmPlan": "30-day content launch plan as plain text: Week 1 (foundation & first posts), Week 2 (build momentum), Week 3 (engage & amplify), Week 4 (review & optimise). Each week on separate lines with specific content actions",
  "revenueProjection": "Content ROI forecast as plain text: Month 1 (awareness metrics), Month 2-3 (engagement growth), Month 4-6 (lead gen from content), Month 7-12 (content driving revenue). Realistic numbers per phase on separate lines",
  "partnershipIdeas": "5 content collaboration and cross-promotion ideas — collaborator type, what content to create together, and expected audience reach",
  "expansionRoadmap": "Quarter-by-quarter content expansion plan as plain text: Q1 (establish core channels), Q2 (add video/short-form), Q3 (community & UGC), Q4 (paid amplification). Each quarter with specific content milestones",
  "competitorGaps": "4-5 content gaps in your competitors — what topics they miss, what formats they ignore, and exactly what content you should create to own that space"
}`,
      seo_blog: `{
  "campaignName": "${form.name}",
  "blogTitle": "SEO-optimized blog post title",
  "blogOutline": "Complete blog post outline (H2, H3 structure)",
  "blogIntro": "Compelling 150-word blog introduction",
  "blogContent": "Full 800-word blog post body",
  "blogConclusion": "Compelling 100-word conclusion with CTA",
  "primaryKeyword": "main target keyword",
  "secondaryKeywords": "5 secondary keywords (comma-separated)",
  "seoTitle": "SEO meta title (50-60 chars)",
  "seoDescription": "SEO meta description (150-160 chars)",
  "internalLinks": "5 suggested internal linking topics",
  "emailSubject": "blog promotion email subject",
  "emailBody": "blog promotion email with summary",
  "linkedinPost": "LinkedIn post promoting the blog with insights",
  "tiktokCaption": "TikTok hook from blog key insight",
  "campaignCalendar": "${Array.from({length:form.campaignDays||7},(_,i)=>'Day '+(i+1)+': [action]').join('\\n')}",
  "positioningStatement": "blog/content brand positioning"
}`,
      email_drip: `{
  "campaignName": "${form.name}",
  "email1Subject": "Email 1 subject line (Welcome/Awareness)",
  "email1Body": "Email 1 full body - Welcome & introduce value (200-250 words)",
  "email2Subject": "Email 2 subject line (Education)",
  "email2Body": "Email 2 full body - Educate & build trust (200-250 words)",
  "email3Subject": "Email 3 subject line (Social Proof)",
  "email3Body": "Email 3 full body - Social proof & case studies (200-250 words)",
  "email4Subject": "Email 4 subject line (Offer/Urgency)",
  "email4Body": "Email 4 full body - Make the offer with urgency (200-250 words)",
  "email5Subject": "Email 5 subject line (Final CTA)",
  "email5Body": "Email 5 full body - Final call to action (200-250 words)",
  "segmentStrategy": "Audience segmentation strategy for this drip",
  "linkedinPost": "LinkedIn post about the value this email series delivers",
  "campaignCalendar": "${Array.from({length:form.campaignDays||7},(_,i)=>'Day '+(i+1)+': [action]').join('\\n')}",
  "positioningStatement": "email funnel value proposition"
}`,
      influencer: `{
  "campaignName": "${form.name}",
  "influencerBrief": "Complete influencer campaign brief (objectives, tone, key messages)",
  "contentGuidelines": "Detailed content guidelines and do's/don'ts",
  "outreachTemplate": "Professional influencer outreach email template",
  "hashtags": "15 campaign hashtags (mix of branded, niche, trending)",
  "campaignGoals": "5 measurable influencer campaign KPIs",
  "pressRelease": "Full press release (headline, subheadline, body, quote, boilerplate)",
  "prPitch": "Media pitch email to journalists (150 words)",
  "influencerTiers": "Recommended influencer tiers (Nano/Micro/Macro) with rationale",
  "emailSubject": "influencer/PR campaign announcement email subject",
  "emailBody": "influencer campaign launch email",
  "linkedinPost": "PR announcement LinkedIn post",
  "instagramCaption": "Sample influencer Instagram caption template",
  "campaignCalendar": "${Array.from({length:form.campaignDays||7},(_,i)=>'Day '+(i+1)+': [action]').join('\\n')}",
  "positioningStatement": "influencer campaign positioning statement"
}`,
      analytics_report: `{
  "campaignName": "${form.name}",
  "executiveSummary": "Executive marketing performance summary (3 paragraphs)",
  "kpiDashboard": "Full KPI dashboard with metrics: ROAS, CAC, LTV, Conversion Rate, CTR, Engagement Rate, Revenue, ROI",
  "channelPerformance": "Channel-by-channel performance breakdown",
  "topInsights": "5 key marketing insights from the analysis",
  "growthOpportunities": "5 actionable growth opportunities identified",
  "recommendations": "5 strategic recommendations with priority levels",
  "nextSteps": "30-day action plan based on data",
  "emailSubject": "marketing report email subject",
  "emailBody": "marketing performance report email to stakeholders",
  "linkedinPost": "LinkedIn post sharing marketing insights",
  "campaignCalendar": "${Array.from({length:form.campaignDays||7},(_,i)=>'Day '+(i+1)+': [action]').join('\\n')}",
  "positioningStatement": "data-driven marketing positioning statement"
}`,
      sales_enablement: `{
  "campaignName": "${form.name}",
  "elevatorPitch": "30-second elevator pitch (75 words)",
  "salesDeckOutline": "Complete sales deck structure (10-12 slides with content for each)",
  "coldCallScript": "Full cold call script with opener, discovery questions, and close",
  "emailSequence": "3-email cold outreach sequence (subject + body for each)",
  "objectionGuide": "Top 7 objections with word-for-word responses",
  "closingStrategies": "5 proven closing techniques tailored to this offer",
  "valueProposition": "One-line value proposition + 3 proof points",
  "emailSubject": "sales outreach email subject line",
  "emailBody": "sales enablement announcement email to team",
  "linkedinPost": "LinkedIn outreach message template",
  "campaignCalendar": "${Array.from({length:form.campaignDays||7},(_,i)=>'Day '+(i+1)+': [action]').join('\\n')}",
  "positioningStatement": "sales positioning statement"
}`,
      event_full: `{
  "campaignName": "${form.name}",
  "emailSubject": "event announcement email subject",
  "emailBody": "full event announcement email (3-4 paragraphs)",
  "countdownEmail7": "7-days-to-go countdown email",
  "countdownEmail3": "3-days-to-go urgency email",
  "countdownEmail1": "Day-before final reminder email",
  "speakerBio": "Professional speaker/host bio template",
  "speakerLinkedin": "Speaker promotional LinkedIn post",
  "attendeeWelcome": "Welcome email for registered attendees",
  "postEventRecap": "Post-event recap email with highlights",
  "linkedinPost": "professional LinkedIn event announcement",
  "instagramCaption": "Instagram event promo caption with emojis",
  "facebookPost": "Facebook event promotion post",
  "whatsappMessage": "WhatsApp event reminder message",
  "tiktokCaption": "TikTok event hype caption",
  "adHeadline": "event ad headline",
  "adBody": "event ad body copy",
  "seoTitle": "event SEO page title",
  "seoDescription": "event SEO meta description",
  "campaignCalendar": "${Array.from({length:form.campaignDays||7},(_,i)=>'Day '+(i+1)+': [action]').join('\\n')}",
  "positioningStatement": "event positioning statement"
}`,
      marketplace: `{
  "campaignName": "${form.name}",
  "vendorOnboardingEmail": "Vendor welcome & onboarding email",
  "productListingCopy": "Optimized product listing title, description, and bullets",
  "seasonalCampaign": "Seasonal/holiday promotion campaign plan",
  "buyerEmailSubject": "buyer retention email subject",
  "buyerEmailBody": "buyer retention/re-engagement email",
  "vendorGrowthPlan": "5-step vendor growth strategy",
  "marketplaceSEO": "Marketplace SEO keywords and listing optimization tips",
  "linkedinPost": "LinkedIn post about marketplace value for vendors",
  "instagramCaption": "Instagram post promoting marketplace products",
  "facebookPost": "Facebook marketplace promotion post",
  "adHeadline": "marketplace ad headline",
  "adBody": "marketplace ad body copy",
  "campaignCalendar": "${Array.from({length:form.campaignDays||7},(_,i)=>'Day '+(i+1)+': [action]').join('\\n')}",
  "positioningStatement": "marketplace positioning statement"
}`,
      brand_strategy: `{
  "campaignName": "${form.name}",
  "brandIdentity": "Complete brand identity definition (mission, vision, values)",
  "toneOfVoice": "Detailed tone of voice guide with examples",
  "messagingFramework": "Brand messaging framework (core message + 5 pillars)",
  "storytellingStrategy": "Brand storytelling approach and narrative arc",
  "brandGuidelines": "Key brand guidelines (visual, verbal, behavioral)",
  "tagline": "3 brand tagline options with rationale",
  "emailSubject": "brand launch announcement email subject",
  "emailBody": "brand strategy launch email to stakeholders",
  "linkedinPost": "brand identity LinkedIn announcement",
  "instagramCaption": "brand launch Instagram post",
  "adHeadline": "brand awareness ad headline",
  "adBody": "brand awareness ad body",
  "campaignCalendar": "${Array.from({length:form.campaignDays||7},(_,i)=>'Day '+(i+1)+': [action]').join('\\n')}",
  "positioningStatement": "core brand positioning statement"
}`,
      funnel_cro: `{
  "campaignName": "${form.name}",
  "funnelAudit": "Complete funnel audit with drop-off points identified",
  "funnelStages": "Optimized funnel stages (Awareness â†' Interest â†' Desire â†' Action)",
  "abTestVariants": "5 A/B test ideas with control vs variant for each",
  "ctaOptimizations": "10 high-converting CTA copy variants",
  "landingPageCopy": "High-converting landing page headline, subheadline, bullets, and CTA",
  "conversionTips": "7 conversion rate optimization quick wins",
  "heatmapInsights": "Where to add CTAs and reduce friction (UX recommendations)",
  "emailSubject": "CRO insights email subject",
  "emailBody": "conversion optimization recommendations email",
  "linkedinPost": "LinkedIn post about conversion optimization insights",
  "campaignCalendar": "Week 1: Audit\\nWeek 2: Test 1\\nWeek 3: Test 2\\nWeek 4: Analyze\\nMonth 2: Scale\\nMonth 3: Optimize\\nMonth 4: Report",
  "positioningStatement": "conversion-optimized value proposition"
}`,
      pr_reputation: `{
  "campaignName": "${form.name}",
  "reputationAudit": "Current brand reputation audit covering online sentiment, review scores, and key perception gaps (3 paragraphs)",
  "crisisPlaybook": "Step-by-step PR crisis response playbook with 5 escalation stages, response scripts, and spokesperson guidelines",
  "pressRelease": "Full professional press release: headline, subheadline, 3-paragraph body, executive quote, and company boilerplate",
  "mediaPitch": "150-word media pitch email to journalists with story angle and why it matters now",
  "reviewResponseTemplates": "10 professional review response templates: 5 for positive reviews and 5 for negative/critical reviews",
  "reputationBuildingPlan": "30-day online reputation improvement plan: Week 1 audit, Week 2 outreach, Week 3 content, Week 4 monitoring",
  "prCalendar": "12-month PR and thought leadership calendar with quarterly themes and key media moments",
  "linkedinPost": "Thought leadership LinkedIn post to strengthen brand authority and public trust",
  "emailSubject": "PR and reputation briefing email subject",
  "emailBody": "Stakeholder communication email about brand reputation strategy and actions",
  "campaignCalendar": "${Array.from({length: form.campaignDays||7},(_,i)=>'Day '+(i+1)+': [action]').join('\\n')}",
  "positioningStatement": "Brand reputation positioning statement"
}`,
      crm_lifecycle: `{
  "campaignName": "${form.name}",
  "customerSegments": "5 customer segments with personas, behavior patterns, LTV estimates, and tailored messaging for each",
  "leadScoringModel": "Lead scoring framework: criteria list, point values per action, threshold for sales handoff, and scoring reset rules",
  "onboardingSequence": "5-email new customer onboarding sequence (subject + full body for each: Welcome, Quick Win, Feature Deep-Dive, Social Proof, Check-In)",
  "winBackCampaign": "Re-engagement campaign for dormant customers: 3 emails (We Miss You / Incentive / Final Chance) + 1 SMS with full copy",
  "retentionPlan": "90-day customer retention plan: Month 1 engagement, Month 2 loyalty rewards, Month 3 referral activation with specific tactics per month",
  "lifetimeValueStrategy": "5 tactics to increase customer LTV: upsell paths, cross-sell triggers, subscription nudges, loyalty tiers, and referral incentives",
  "churnPrevention": "Early churn warning signals and 3 automated intervention sequences to recover at-risk customers before they leave",
  "emailSubject": "CRM lifecycle campaign email subject",
  "emailBody": "Customer lifecycle strategy briefing email to stakeholders",
  "linkedinPost": "LinkedIn post on customer success and relationship-driven growth",
  "campaignCalendar": "${Array.from({length: form.campaignDays||7},(_,i)=>'Day '+(i+1)+': [action]').join('\\n')}",
  "positioningStatement": "Customer-centric value proposition statement"
}`,
      ads_creation: `{
  "campaignName": "${form.name}",
  "adStrategy": "2-3 sentence creative strategy: the core hook/angle, why it fits this audience and objective, and how budget and landing page should shape the creative",
  "staticAdVariants": [
    { "headline": "punchy headline, 40 chars max", "primaryText": "direct-response primary text with a strong hook, 125 chars max", "description": "supporting line, 25 chars max", "cta": "Shop Now | Learn More | Sign Up | Get Offer (pick the best fit)" },
    { "headline": "second distinct angle headline, 40 chars max", "primaryText": "direct-response primary text, different angle than variant 1, 125 chars max", "description": "supporting line, 25 chars max", "cta": "best-fit CTA" },
    { "headline": "third distinct angle headline, 40 chars max", "primaryText": "direct-response primary text, different angle than variants 1 and 2, 125 chars max", "description": "supporting line, 25 chars max", "cta": "best-fit CTA" }
  ],
  "carouselAdVariant": {
    "headline": "overall carousel ad headline",
    "slides": [
      { "title": "slide 1 title", "text": "slide 1 supporting text" },
      { "title": "slide 2 title", "text": "slide 2 supporting text" },
      { "title": "slide 3 title", "text": "slide 3 supporting text" },
      { "title": "slide 4 title", "text": "slide 4 supporting text" }
    ],
    "cta": "best-fit CTA"
  },
  "videoStillAdVariant": {
    "hook": "first 3-second hook line for the video/reel",
    "script": "15-30 second script broken into short beats/lines",
    "caption": "social caption to pair with the video ad",
    "cta": "best-fit CTA"
  },
  "adHeadlineVariants": ["alt headline 1", "alt headline 2", "alt headline 3", "alt headline 4", "alt headline 5"],
  "landingPageTips": "3 short, specific conversion-rate tips for the landing page given the objective and budget"
}`,
      paid_advertising: `{
  "campaignName": "${form.name}",
  "adStrategy": "Full paid media strategy: platform selection rationale, total budget split, targeting philosophy, and expected ROAS per platform",
  "metaAdsCopy": "3 Meta (Facebook/Instagram) ad variants each with: Primary Text (125 chars), Headline (40 chars), Description (25 chars), CTA button, and audience note",
  "googleAdsCopy": "3 Google Search ad variants each with: 3 Headlines (30 chars each), 2 Descriptions (90 chars each), Display URL path, and match type recommendation",
  "tiktokAdsCopy": "2 TikTok ad scripts: one 15-second hook-driven and one 30-second story-format with captions and trending audio suggestions",
  "linkedinAdsCopy": "2 LinkedIn Sponsored Content ads each with: Intro text (150 chars), Headline (70 chars), CTA, and targeting persona",
  "audienceTargeting": "Detailed audience targeting strategy per platform: demographics, interests, behaviors, lookalike seeds, and exclusions for each",
  "budgetAllocation": "Monthly budget breakdown by platform (Meta / Google / TikTok / LinkedIn) with expected impressions, clicks, conversions, and ROAS per channel",
  "abTestPlan": "5 A/B test ideas with control vs variant copy, creative direction, and success metric for each",
  "emailSubject": "Paid advertising campaign launch email subject",
  "emailBody": "Paid media campaign brief and launch announcement email to stakeholders",
  "campaignCalendar": "${Array.from({length: form.campaignDays||7},(_,i)=>'Day '+(i+1)+': [action]').join('\\n')}",
  "positioningStatement": "Paid advertising value proposition and campaign hook"
}`,
      ai_cfo: `{
  "campaignName": "${form.name}",
  "financialForecast": "12-month revenue and marketing expense forecast with growth assumptions broken into quarters with realistic milestones",
  "budgetAllocation": "Marketing budget allocation across all channels with ROI expectations, payback period, and reallocation triggers per channel",
  "unitEconomics": "Unit economics analysis: CAC by channel, LTV, LTV:CAC ratio, gross margin, and payback period with improvement targets",
  "cashFlowProjection": "Quarterly cash flow projection showing marketing spend timing, revenue lag, and break-even milestones",
  "investmentPriorities": "Top 5 marketing investment priorities ranked by expected ROI with rationale, risk level, and recommended spend level",
  "costReductionOpportunities": "5 cost optimization opportunities: what to cut, consolidate, and renegotiate without sacrificing growth",
  "kpiDashboard": "CFO-level KPI dashboard: Monthly Revenue, Burn Rate, CAC, LTV, ROAS, Gross Margin, Marketing ROI, Payback Period with targets and red flags",
  "emailSubject": "Financial performance briefing email subject",
  "emailBody": "CFO executive financial summary and marketing investment recommendation email",
  "linkedinPost": "Thought leadership LinkedIn post on financial efficiency and marketing ROI",
  "campaignCalendar": "${Array.from({length: form.campaignDays||7},(_,i)=>'Day '+(i+1)+': [action]').join('\\n')}",
  "positioningStatement": "Financial strategy and efficiency positioning statement"
}`,
      ai_cto: `{
  "campaignName": "${form.name}",
  "techStackAudit": "Current marketing tech stack audit: what to keep, replace, and add with cost and integration complexity per tool",
  "aiIntegrationPlan": "AI tools implementation roadmap: 30-day quick wins, 60-day integrations, 90-day full automation with specific tools and setup steps per phase",
  "automationBlueprint": "Marketing automation architecture: triggers, workflows, branching logic, and tool connections across email, CRM, ads, and social",
  "dataInfrastructure": "Customer data platform recommendations: data sources to connect, segmentation logic, and real-time personalization architecture",
  "performanceOptimization": "Website and campaign performance technical audit: Core Web Vitals, load speed, tag management, tracking setup, and conversion pixel strategy",
  "integrationMap": "Full system integration map: CRM to Email to Ads to Analytics to Social with data flow and tool recommendations",
  "securityCompliance": "Marketing tech security checklist: data encryption, access controls, GDPR compliance, API key management, and audit log requirements",
  "emailSubject": "Technology infrastructure briefing email subject",
  "emailBody": "CTO technology strategy and AI integration email to stakeholders",
  "linkedinPost": "Thought leadership LinkedIn post on AI-powered marketing infrastructure",
  "campaignCalendar": "${Array.from({length: form.campaignDays||7},(_,i)=>'Day '+(i+1)+': [action]').join('\\n')}",
  "positioningStatement": "Technology-driven marketing differentiation statement"
}`,
      ai_cro_exec: `{
  "campaignName": "${form.name}",
  "revenueStrategy": "12-month revenue growth strategy with quarterly targets, primary growth levers, and success metrics per initiative",
  "partnershipPlan": "5 high-value strategic partnership opportunities: partner profile, value exchange, revenue impact estimate, and outreach approach for each",
  "salesEnablementKit": "Complete sales enablement kit: 30-second pitch, top 7 objections with responses, 3-email outreach sequence, and 5 closing techniques",
  "monetizationModels": "3 alternative monetization models to diversify revenue: model description, target customer, pricing structure, and 90-day launch plan",
  "revenueLevers": "Top 7 revenue levers ranked by impact and execution speed: new sales, upsell, cross-sell, retention, pricing, channel expansion, partnerships",
  "clientAcquisitionPlan": "90-day new client acquisition sprint: Week 1-2 setup, Week 3-4 outreach, Month 2 pipeline build, Month 3 conversion with daily actions",
  "upsellCrossSellStrategy": "Upsell and cross-sell playbook: trigger events, offer sequences, pricing anchors, and scripts for each upgrade path",
  "emailSubject": "Revenue strategy briefing email subject",
  "emailBody": "CRO executive revenue growth plan and partnership opportunity email",
  "linkedinPost": "Revenue growth and partnership thought leadership LinkedIn post",
  "campaignCalendar": "${Array.from({length: form.campaignDays||7},(_,i)=>'Day '+(i+1)+': [action]').join('\\n')}",
  "positioningStatement": "Revenue-driven company positioning statement"
}`,
      ai_ceo: `{
  "campaignName": "${form.name}",
  "visionStatement": "Compelling 3-year company vision and mission statement with core values and the change you are creating in the market",
  "strategicPriorities": "Top 5 strategic priorities for the next 12 months: what, why, how, who owns it, and success metric for each",
  "marketOpportunities": "3 high-potential untapped market opportunities with TAM estimate, time-to-capture, competitive risk, and recommended entry strategy",
  "competitiveAdvantage": "Sustainable competitive advantages and moats to build: product, brand, data, network effects, and switching costs with a 12-month build plan",
  "ecosystemStrategy": "Platform, partner, and ecosystem strategy to accelerate growth: which ecosystems to join or build and how to become indispensable",
  "executiveSummary": "Board-ready executive summary: company position, key metrics, growth trajectory, risks, and strategic ask formatted for board presentation",
  "pivotScenarios": "2 strategic pivot scenarios if current trajectory changes: triggers to watch for, decision criteria, and fast-pivot action plan",
  "emailSubject": "CEO strategic briefing email subject",
  "emailBody": "CEO strategic direction and growth priorities email to leadership team",
  "linkedinPost": "CEO thought leadership LinkedIn post on vision, innovation, and market direction",
  "campaignCalendar": "${Array.from({length: form.campaignDays||7},(_,i)=>'Day '+(i+1)+': [action]').join('\\n')}",
  "positioningStatement": "Executive-level company positioning and category narrative"
}`,
      ai_compliance: `{
  "campaignName": "${form.name}",
  "complianceAudit": "Full marketing compliance audit across GDPR, CCPA, CAN-SPAM, CASL, and platform advertising policies with pass/fail per area and remediation steps",
  "privacyPolicy": "Marketing privacy policy framework: data collection disclosure, consent requirements, cookie policy, opt-out mechanisms, and data retention rules",
  "advertisingCompliance": "Platform-specific advertising compliance checklist for Meta, Google, LinkedIn, TikTok, and email with prohibited content and disclosure requirements",
  "aiContentGuidance": "AI-generated content governance: disclosure requirements, human review checkpoints, bias mitigation, and AI usage policy for marketing",
  "dataGovernance": "Customer data governance framework: data classification, access controls, retention schedules, breach response plan, and third-party data sharing rules",
  "riskMatrix": "Marketing risk assessment matrix: 7 key risks with likelihood, business impact, current controls, and recommended mitigation for each",
  "complianceCalendar": "Annual compliance review calendar: quarterly audits, renewal dates, training schedules, policy review cycles, and regulatory update monitoring",
  "emailSubject": "Compliance briefing email subject",
  "emailBody": "Compliance status report and risk mitigation recommendation email to stakeholders",
  "linkedinPost": "Thought leadership LinkedIn post on marketing compliance, trust, and responsible AI",
  "campaignCalendar": "${Array.from({length: form.campaignDays||7},(_,i)=>'Day '+(i+1)+': [action]').join('\\n')}",
  "positioningStatement": "Compliance-first and trust-driven brand positioning statement"
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

  // Call Groq directly if key is available, otherwise use Vercel proxy
  const requestBody = JSON.stringify({
    model: "llama-3.1-8b-instant",
    messages: [
      {
        role: "system",
        content: "You are an expert AI CMO. Always respond with only valid JSON, no markdown, no explanation.",
      },
      { role: "user", content: prompt },
    ],
    temperature: 0.7,
    max_tokens: isNewType ? 4000 : 2000,
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
  const match =
    text.match(/```json\s*([\s\S]*?)```/) || text.match(/(\{[\s\S]*\})/);
  if (!match) throw new Error("Could not parse AI response. Please try again.");
  // Try parsing directly; if AI returned literal newlines/tabs inside string values,
  // fix them by escaping only within JSON strings, then retry.
  let raw = match[1];
  try {
    return JSON.parse(raw);
  } catch (_) {}
  // Escape literal \n \r \t that appear inside JSON string literals
  const fixed = raw.replace(/"(?:[^"\\]|\\.)*"/g, (str) =>
    str.replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\t/g, "\\t"),
  );
  return JSON.parse(fixed);
}

// â"€â"€â"€ Generate N-day daily schedule (unique content per day) â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
async function generateDailySchedule(form, campaignType, days) {
  if (days <= 1) return [];
  const apiKey = import.meta.env.VITE_GROQ_API_KEY || "";
  if (!apiKey) return [];

  // For large calendars (>14 days) use compact per-day schema to stay within token limits
  const compact = days > 14
  const daySchema = compact
    ? `{ "day": 1, "theme": "one-sentence theme", "focus": "Awareness|Education|Engagement|Conversion|Retention", "linkedinPost": "60-word LinkedIn post + 3 hashtags", "instagramCaption": "50-word caption + emojis + 3 hashtags", "contentIdea": "one actionable content idea for any platform" }`
    : `{ "day": 1, "theme": "one-sentence theme for this day", "focus": "Awareness | Education | Engagement | Conversion | Retention", "linkedinPost": "unique LinkedIn post (100-200 words with hashtags)", "instagramCaption": "unique Instagram caption (80-120 words with emojis and hashtags)", "facebookPost": "unique Facebook post (80-150 words)", "whatsappMessage": "unique WhatsApp message (40-60 words)", "emailSubject": "email subject line for this day", "emailBody": "short email body (2 paragraphs)" }`

  const prompt = `You are an AI CMO generating a ${days}-day social media campaign schedule.

Campaign: ${form.name}
Type: ${campaignType}
Description: ${form.description}
Goal: ${form.goal}
Target Audience: ${(form.targetAudience || []).join(", ")}
Brand: ${form.brandName || form.name}

Generate a ${days}-day campaign schedule. Return ONLY a valid JSON array with exactly ${days} objects:
[
  ${daySchema}
]`

  const tokenBudget = compact ? Math.min(4000, days * 80 + 400) : Math.min(4000, days * 200 + 500)

  try {
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: "You are an AI CMO. Respond ONLY with a valid JSON array, no markdown, no explanation." },
          { role: "user", content: prompt },
        ],
        temperature: 0.8,
        max_tokens: tokenBudget,
      }),
    });
    if (!res.ok) return [];
    const data = await res.json();
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
    color: "#10b981",
    icon: <Zap size={22} />,
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

// â"€â"€â"€ Main CampaignForm component â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
export default function CampaignForm() {
  const { type } = useParams();
  const navigate  = useNavigate();
  const location  = useLocation();
  const backPath  = location.state?.from || "/cmo";
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
    description: "",
    imageFile: null,
    imagePreview: null,
    date: "",
    time: "",
    location: "",
    eventLocations: [],
    eventUrl: "",
    website: "",
    price: "",
    targetAudience: [],
    goal: "",
    goalType: "",
    endDate: "",
    eventUrlMode: "manual",
    brandName: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    postDate: "",
    postTime: "09:00",
    campaignDays: 7,
    platforms: ["linkedin", "instagram", "facebook", "email", "whatsapp"],
    whatsappRecipients: "",
    emailRecipients: "",
    // New fields for extended CMO types
    competitorUrl: "",
    industry: "",
    budget: "",
    keywords: "",
    reportPeriod: "",
    funnelStage: "",
    toneOfVoice: "",
    socialPlatforms: [],
    contentTypes: [],
    postingFrequency: "",
  });
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
    const currentUser = profileToUser(profile);
    if (currentUser) {
      setForm(f => ({
        ...f,
        contactEmail: currentUser.email || f.contactEmail,
        contactName: currentUser.displayName || f.contactName,
      }));
    }
  }, []);

  // 30-Day Content Calendar defaults
  useEffect(() => {
    if (type === 'content_calendar') {
      setForm(f => ({ ...f, campaignDays: 30 }))
    }
  }, [type])

  // Load connected social accounts for social platform selector
  const loadConnectedAccounts = useCallback(() => {
    const profile = getEvokeUserProfile()
    const currentUser = profileToUser(profile)
    if (!currentUser) return
    getUserData(currentUser.uid).then(data => {
      if (!data?.socialAccounts) return
      const sa = data.socialAccounts
      setConnectedAccounts(sa)
      if (fromPackageA) {
        const platforms = []
        if (sa.linkedin?.connected)  platforms.push('linkedin')
        if (sa.instagram?.connected) platforms.push('instagram')
        if (sa.facebook?.connected)  platforms.push('facebook')
        if (sa.gmail?.connected)     platforms.push('email')
        platforms.push('whatsapp')
        setForm(prev => ({ ...prev, platforms }))
      }
    }).catch(() => {})
  }, [fromPackageA]) // eslint-disable-line

  useEffect(() => {
    loadConnectedAccounts()
  }, [type, fromPackageA, loadConnectedAccounts])

  // Open /connect-accounts as popup so the form isn't left
  const openConnectPopup = useCallback((platformKey) => {
    const popup = window.open(
      `/connect-accounts?platform=${platformKey}&popup=1`,
      'evoke_connect',
      'width=620,height=720,left=200,top=100,resizable=yes,scrollbars=yes'
    )
    if (!popup) {
      // Popup blocked — fall back to navigation
      navigate('/connect-accounts', { state: { from: backPath } })
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
      const campaignData = await generateCampaignContent({ ...form, goal: combinedGoal || form.goal }, type, form.campaignDays);

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
      let dailySchedule = [];
      if (!isAdTool && (form.campaignDays || 7) > 1) {
        setLoadingPhase("generating-schedule");
        dailySchedule = await generateDailySchedule(form, type, form.campaignDays || 7);
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
      const currentUser = profileToUser(getEvokeUserProfile());
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
      setTiktokVideoUploading(false);
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
    email_drip:       { name: "Campaign / Product",    namePh: "What this email series is for",     desc: "Funnel Goal & Audience Segment"           },
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
          onClick={() => navigate(backPath)}
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

              {/* ── Event Image (above URL) ── */}
              <label style={s.label}>
                Event Image{" "}
                <span style={{ color: "rgba(255,255,255,0.35)", fontSize: "12px", fontWeight: 400 }}>
                  (optional — AI auto-generates a poster if you skip this)
                </span>
              </label>
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={async () => {
                  if (!form.name.trim()) { setSubmitError("Enter an event name first to generate the poster."); return; }
                  setSubmitError("");
                  setPosterGenerating(true);
                  try {
                    const { file, preview } = await generateEventPoster({ ...form, campaignType: type });
                    setEventImageFile(file);
                    setEventImagePreview(preview);
                  } catch (e) {
                    setSubmitError("Poster generation failed. Please try again.");
                  } finally {
                    setPosterGenerating(false);
                  }
                }}
                disabled={posterGenerating}
                style={{
                  width: "100%", marginBottom: "12px", padding: "14px 20px",
                  background: posterGenerating ? "rgba(255,255,255,0.05)" : "linear-gradient(135deg, rgba(200,151,62,0.13), rgba(200,151,62,0.12))",
                  border: "1px solid rgba(200,151,62,0.4)", borderRadius: "14px",
                  color: posterGenerating ? "rgba(255,255,255,0.4)" : "#f0d080",
                  fontSize: "15px", fontWeight: 700, cursor: posterGenerating ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
                  transition: "all 0.2s",
                }}
              >
                {posterGenerating
                  ? <><Loader2 size={17} style={{ animation: "spin 1s linear infinite" }} /> Generating Poster...</>
                  : <><span style={{ fontSize: "18px" }}>🎨</span> Auto-Generate Event Poster from Details</>
                }
              </motion.button>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(124,58,237,0.07)", border: "1px solid rgba(124,58,237,0.2)", borderRadius: "10px", padding: "9px 14px", marginBottom: "10px", fontSize: "12px", color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>
                <span style={{ fontSize: "15px" }}>✨</span>
                <span>Click above to auto-generate a poster with your event name, date, time &amp; location — or upload your own image below.</span>
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

              {/* ── Event URL ── */}
              <label style={{ ...s.label, marginTop: 24 }}>
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

          {type !== "event" && type !== "growth_strategy" && type !== "growth_agent" && type !== "content_calendar" && type !== "ads_creation" && type !== "ads_manager" && type !== "target_audience" && !EXEC_TYPES.includes(type) && (
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
              <input
                value={form.price}
                onChange={(e) => set("price", e.target.value)}
                placeholder="e.g. Rs.1,999 / $29.99 / Free"
                style={s.input}
              />
            </>
          )}

          <label style={s.label}>
            Target Audience <span style={s.req}>*</span>
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
              <label style={s.label}>
                Campaign Goal <span style={s.req}>*</span>
              </label>
              <select
                value={form.goalType}
                onChange={(e) => set("goalType", e.target.value)}
                style={{ ...s.input, cursor: "pointer", colorScheme: "dark", marginBottom: "8px" }}
              >
                {[
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
                ].filter(v => v !== null).map((v) => (
                  <option key={v} value={v} style={{ background: "#1c1a13", color: v ? "#f0ebe0" : "rgba(240,235,224,0.4)" }}>
                    {v || "Select campaign goal..."}
                  </option>
                ))}
              </select>
              <textarea
                value={form.goal}
                onChange={(e) => set("goal", e.target.value)}
                placeholder="Describe your goal in more detail... (optional)"
                style={{ ...s.textarea, minHeight: "80px" }}
              />
            </>
          )}

          {type !== "event" && type !== "growth_strategy" && type !== "growth_agent" && type !== "content_calendar" && (
            <>
              <label style={s.label}>
                Brand Name <span style={s.req}>*</span>
              </label>
              <input
                value={form.brandName}
                onChange={(e) => set("brandName", e.target.value)}
                placeholder="Your brand or company name"
                style={s.input}
              />
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
          {type !== "growth_strategy" && type !== "growth_agent" && type !== "content_calendar" && type !== "ads_creation" && type !== "ads_manager" && type !== "target_audience" && !EXEC_TYPES.includes(type) && (
            <>
          <div style={s.divider} />
          <p style={s.sectionTitle}>Publishing Settings</p>

          {/* ── Campaign Duration ── */}
          <label style={{ ...s.label, marginTop: "12px" }}>
            Campaign Duration <span style={s.req}>*</span>
          </label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "4px" }}>
            {[
              { days: 1,  label: "1 Day",     sub: "Single post"   },
              { days: 7,  label: "7 Days",    sub: "1 week"        },
              { days: 10, label: "10 Days",   sub: "Boost phase"   },
              { days: 14, label: "14 Days",   sub: "2 weeks"       },
              { days: 21, label: "21 Days",   sub: "3 weeks"       },
              { days: 30, label: "30 Days",   sub: "Full month"    },
            ].map(({ days, label, sub }) => {
              const active = form.campaignDays === days;
              return (
                <button
                  key={days}
                  type="button"
                  onClick={() => set("campaignDays", days)}
                  style={{
                    display: "flex", flexDirection: "column", alignItems: "center",
                    padding: "10px 18px", minWidth: "80px",
                    background: active ? `${meta.color}12` : "#f8fafc",
                    border: `1.5px solid ${active ? meta.color : "rgba(245,240,232,0.15)"}`,
                    borderRadius: "12px", cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  <span style={{ fontSize: "14px", fontWeight: 800, color: active ? meta.color : "#0f172a" }}>{label}</span>
                  <span style={{ fontSize: "10px", color: active ? meta.color : "#94a3b8", fontWeight: 500, marginTop: "2px" }}>{sub}</span>
                </button>
              );
            })}

            {/* Custom input */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "10px 14px", background: "#211f17", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }}>
              <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>Custom:</span>
              <input
                type="number"
                min="1"
                max="90"
                value={![1,7,10,14,21,30].includes(form.campaignDays) ? form.campaignDays : ""}
                placeholder="days"
                onChange={e => { const v = parseInt(e.target.value); if (v >= 1 && v <= 90) set("campaignDays", v); }}
                style={{ width: "52px", background: "#1c1a13", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "6px", padding: "4px 8px", fontSize: "13px", color: "#ffffff", outline: "none" }}
              />
            </div>
          </div>

          {form.campaignDays > 1 && (
            <div style={{ marginTop: "8px", padding: "10px 14px", background: `${meta.color}08`, border: `1px solid ${meta.color}25`, borderRadius: "10px", display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>
              <span style={{ color: meta.color, fontWeight: 700 }}>🗓 {form.campaignDays}-day campaign</span>
              · AI will generate unique content for every day · Auto-posts daily at your chosen time
            </div>
          )}

          {/* ── Schedule Date + Time ── */}
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
            <div>
              <label style={{ ...s.label, marginTop: 0 }}>Schedule Time</label>
              <input
                type="time"
                value={form.postTime}
                onChange={(e) => set("postTime", e.target.value)}
                style={s.input}
              />
            </div>
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

          {/* ── WhatsApp Recipients ── */}
          {form.platforms.includes("whatsapp") && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              style={{ marginTop: "16px", padding: "18px", background: "rgba(37,211,102,0.06)", border: "1px solid rgba(37,211,102,0.2)", borderRadius: "14px" }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                <div style={{ fontWeight: 700, fontSize: "14px", color: "#25d366" }}>WhatsApp Recipients</div>
                <label style={{
                  display: "flex", alignItems: "center", gap: "6px", cursor: "pointer",
                  fontSize: "12px", fontWeight: 700, color: "#25d366",
                  background: "rgba(37,211,102,0.1)", border: "1px solid rgba(37,211,102,0.3)",
                  borderRadius: "8px", padding: "5px 12px",
                }}>
                  <Upload size={12} /> Upload CSV
                  <input type="file" accept=".csv,.txt" style={{ display: "none" }} onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      const text = ev.target.result;
                      const phones = text.split(/[\n,;]+/).map(s => s.trim()).filter(s => s.match(/^\+?\d[\d\s\-]{6,}/));
                      if (phones.length) set("whatsappRecipients", (form.whatsappRecipients ? form.whatsappRecipients + ", " : "") + phones.join(", "));
                    };
                    reader.readAsText(file);
                    e.target.value = "";
                  }} />
                </label>
              </div>
              <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", marginBottom: "10px" }}>
                Paste numbers with country code or upload a CSV — separated by commas.<br />
                <span style={{ color: "rgba(255,255,255,0.35)" }}>Example: +919876543210, +918123456789</span>
              </div>
              <textarea
                value={form.whatsappRecipients}
                onChange={(e) => set("whatsappRecipients", e.target.value)}
                placeholder="+919876543210, +918123456789, +971501234567"
                style={{ ...s.textarea, minHeight: "80px", borderColor: "rgba(37,211,102,0.25)" }}
              />
              <div style={{ fontSize: "11px", color: "rgba(37,211,102,0.6)", marginTop: "6px" }}>
                WhatsApp Business API will send messages to each number
              </div>
            </motion.div>
          )}

          {/* ── Email Recipients ── */}
          {form.platforms.includes("email") && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              style={{ marginTop: "16px", padding: "18px", background: "rgba(212,168,83,0.05)", border: "1px solid rgba(124,58,237,0.2)", borderRadius: "14px" }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                <div style={{ fontWeight: 700, fontSize: "14px", color: "#c8973e" }}>Email Recipients</div>
                <label style={{
                  display: "flex", alignItems: "center", gap: "6px", cursor: "pointer",
                  fontSize: "12px", fontWeight: 700, color: "#c8973e",
                  background: "rgba(200,151,62,0.1)", border: "1px solid rgba(200,151,62,0.3)",
                  borderRadius: "8px", padding: "5px 12px",
                }}>
                  <Upload size={12} /> Upload CSV
                  <input type="file" accept=".csv,.txt" style={{ display: "none" }} onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      const text = ev.target.result;
                      const emails = text.split(/[\n,;]+/).map(s => s.trim()).filter(s => s.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/));
                      if (emails.length) set("emailRecipients", (form.emailRecipients ? form.emailRecipients + ", " : "") + emails.join(", "));
                    };
                    reader.readAsText(file);
                    e.target.value = "";
                  }} />
                </label>
              </div>
              <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", marginBottom: "10px" }}>
                Paste addresses or upload a CSV — separated by commas.<br />
                <span style={{ color: "rgba(255,255,255,0.35)" }}>Example: john@example.com, team@company.com</span>
              </div>
              <textarea
                value={form.emailRecipients}
                onChange={(e) => set("emailRecipients", e.target.value)}
                placeholder="john@example.com, team@company.com, leads@business.com"
                style={{ ...s.textarea, minHeight: "80px", borderColor: "rgba(124,58,237,0.25)" }}
              />
              <div style={{ fontSize: "11px", color: "rgba(124,58,237,0.6)", marginTop: "6px" }}>
                AI-generated email content will be sent to each address via Gmail
              </div>
            </motion.div>
          )}

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

