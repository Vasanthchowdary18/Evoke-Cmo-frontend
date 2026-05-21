import React, { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar, Package, Zap, ArrowRight, Upload, X, ChevronDown,
  Sparkles, RotateCcw, Check, Download, ImageIcon, Loader2,
  AlertCircle, Eye, ChevronUp, Key, MapPin, Link, Clock, Mail
} from 'lucide-react'
import Navbar from '../components/Navbar.jsx'
import { WEBHOOK_URL } from '../config.js'
import { auth } from '../firebase'
import { getUserData, deductToken } from '../services/userService'

async function convertToJpeg(file) {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      canvas.getContext('2d').drawImage(img, 0, 0)
      URL.revokeObjectURL(url)
      canvas.toBlob(blob => resolve(new File([blob], 'image.jpg', { type: 'image/jpeg' })), 'image/jpeg', 0.92)
    }
    img.src = url
  })
}

async function uploadToImgBB(file) {
  // Convert to JPEG — Instagram/Facebook API reject WEBP and other formats
  const jpeg = await convertToJpeg(file)
  const base64 = await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(jpeg)
  })
  const form = new FormData()
  form.append('key', '5bd861d246cfae2342a0b898282ab18e')
  form.append('image', base64)
  const res = await fetch('https://api.imgbb.com/1/upload', { method: 'POST', body: form })
  if (!res.ok) throw new Error('Image upload failed. Please try again.')
  const data = await res.json()
  return data.data.url
}

// ─── Groq campaign content generator (free tier) ────────────────────────────
async function generateCampaignContent(form, campaignType) {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY || ''
  if (!apiKey || apiKey === 'your_groq_api_key_here') {
    throw new Error('Groq API key not set. Add VITE_GROQ_API_KEY to your .env file. Get a free key at console.groq.com')
  }

  const isEvent   = campaignType === 'event'
  const isProduct = campaignType === 'product'

  const context = isEvent
    ? `Event Name: ${form.name}
Description: ${form.description}
Date: ${form.date || 'TBD'}  Time: ${form.time || 'TBD'}
Location: ${form.location || 'TBD'}
Event URL: ${form.eventUrl || ''}
Goal: ${form.goal}
Target Audience: ${form.targetAudience.join(', ')}
Post Date: ${form.postDate || 'ASAP'}`
    : isProduct
    ? `Product Name: ${form.name}
Brand: ${form.brandName}
Description: ${form.description}
Goal: ${form.goal}
Target Audience: ${form.targetAudience.join(', ')}
Website: ${form.website || ''}
Post Date: ${form.postDate || 'ASAP'}`
    : `Brand/Campaign: ${form.name}
Brand Name: ${form.brandName}
Description: ${form.description}
Goal: ${form.goal}
Target Audience: ${form.targetAudience.join(', ')}
Website: ${form.website || ''}
Post Date: ${form.postDate || 'ASAP'}`

  const prompt = `You are an expert AI CMO. Generate a complete multi-channel marketing campaign for the following ${campaignType}.

${context}

Return ONLY valid JSON with exactly these fields, no markdown, no explanation:
{
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
  "tiktokCaption": "short punchy TikTok caption with trending hashtags and a hook (50-80 words, energetic tone)",
  "campaignCalendar": "Day 1: [action]\\nDay 2: [action]\\nDay 3: [action]\\nDay 4: [action]\\nDay 5: [action]\\nDay 6: [action]\\nDay 7: [action]",
  "positioningStatement": "one strong brand/event positioning statement"
}`

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: 'You are an expert AI CMO. Always respond with only valid JSON, no markdown, no explanation.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 4096,
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message || `Groq API error ${res.status}`)
  }

  const data = await res.json()
  const text = data.choices?.[0]?.message?.content || ''
  const match = text.match(/```json\s*([\s\S]*?)```/) || text.match(/(\{[\s\S]*\})/)
  if (!match) throw new Error('Could not parse AI response. Please try again.')
  // Try parsing directly; if AI returned literal newlines/tabs inside string values,
  // fix them by escaping only within JSON strings, then retry.
  let raw = match[1]
  try { return JSON.parse(raw) } catch (_) {}
  // Escape literal \n \r \t that appear inside JSON string literals
  const fixed = raw.replace(/"(?:[^"\\]|\\.)*"/g, str =>
    str.replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t')
  )
  return JSON.parse(fixed)
}

// ─── Comprehensive product category list ────────────────────────────────────
const PRODUCT_CATEGORIES = [
  // Fashion & Accessories
  'Watch', 'Sunglasses', 'Handbag', 'Wallet', 'Belt', 'Jewellery', 'Ring', 'Necklace',
  'Bracelet', 'Earrings', 'Hat / Cap', 'Scarf', 'Tie', 'Shoes / Sneakers', 'Boots',
  'Sandals', 'Heels', 'Sports Shoes', 'T-Shirt', 'Jacket', 'Hoodie', 'Dress', 'Jeans',
  'Suit', 'Saree', 'Kurta / Ethnic Wear', 'Swimwear', 'Activewear / Gym Wear',
  // Electronics & Gadgets
  'Smartphone', 'Laptop', 'Tablet', 'Smartwatch', 'Wireless Earbuds / AirPods',
  'Headphones', 'Bluetooth Speaker', 'Camera', 'Action Camera (GoPro)', 'Drone',
  'Gaming Console', 'Gaming Controller', 'Monitor', 'Keyboard', 'Mouse', 'Hard Drive / SSD',
  'Power Bank', 'Charger / Cable', 'Smart Home Device', 'Robot Vacuum',
  // Beauty & Personal Care
  'Perfume / Fragrance', 'Lipstick', 'Foundation / BB Cream', 'Moisturizer / Serum',
  'Face Wash', 'Sunscreen', 'Hair Dryer', 'Straightener / Curler', 'Electric Shaver',
  'Trimmer', 'Nail Polish', 'Eye Shadow Palette', 'Mascara', 'Skincare Kit',
  // Home & Kitchen
  'Sofa / Couch', 'Dining Table', 'Bed Frame', 'Mattress', 'Pillow / Cushion',
  'Lamp / Light', 'Wall Art / Painting', 'Vase', 'Rug / Carpet', 'Curtains',
  'Air Purifier', 'Coffee Maker', 'Blender / Mixer', 'Microwave', 'Air Fryer',
  'Cookware Set', 'Knife Set', 'Water Bottle / Tumbler', 'Lunch Box', 'Toaster',
  // Sports & Fitness
  'Yoga Mat', 'Dumbbells / Weights', 'Resistance Bands', 'Treadmill', 'Cycle / Bike',
  'Football', 'Cricket Bat', 'Tennis Racket', 'Badminton Racket', 'Swimming Goggles',
  'Protein Powder / Supplement', 'Gym Bag', 'Fitness Tracker',
  // Food & Beverage
  'Coffee / Tea', 'Chocolate / Candy', 'Snack / Chips', 'Health Bar', 'Juice / Drink',
  'Wine / Beer', 'Packaged Food', 'Spices / Condiments', 'Bakery Product',
  // Toys & Baby
  'Action Figure', 'Board Game', 'Puzzle', 'LEGO Set', 'Remote Control Car',
  'Doll', 'Baby Clothing', 'Baby Stroller', 'Baby Monitor', 'Educational Toy',
  // Books & Stationery
  'Book', 'Notebook / Journal', 'Pen / Stationery Set', 'Planner',
  // Automotive
  'Car Accessory', 'Helmet', 'Tyre', 'Car Seat Cover', 'Dashcam',
  // Pet
  'Pet Food', 'Pet Toy', 'Pet Collar / Leash', 'Pet Bed',
  // Other
  'Backpack / Bag', 'Luggage / Suitcase', 'Umbrella', 'Candle', 'Gift Set', 'Other',
]

const ANGLE_OPTIONS = ['front', 'left', 'right', 'back', 'top', 'bottom']

const campaignMeta = {
  event:   { title: 'Event Campaign',   color: '#7c3aed', icon: <Calendar size={22} />, badge: 'STARTER'    },
  product: { title: 'Product Campaign', color: '#06b6d4', icon: <Package  size={22} />, badge: 'GROWTH'     },
  brand:   { title: 'Brand Campaign',   color: '#a855f7', icon: <Zap      size={22} />, badge: 'ENTERPRISE' },
}

// ─── Gemini image generation via API ────────────────────────────────────────
async function generateAnglesWithGemini(apiKey, imageFile, category, description, selectedAngles, genTypes) {
  // Convert file to base64
  const toBase64 = (file) => new Promise((res, rej) => {
    const r = new FileReader()
    r.onload = () => res(r.result.split(',')[1])
    r.onerror = rej
    r.readAsDataURL(file)
  })

  const base64Image = await toBase64(imageFile)
  const mimeType = imageFile.type || 'image/jpeg'

  const angleList = selectedAngles.join(', ')
  const typeList = genTypes.join(', ')

  const prompt = `You are a professional product photographer AI. 
I'm providing a product image of a "${category}"${description ? ` described as: "${description}"` : ''}.

Please generate ${selectedAngles.length} high-quality product photography variations showing these viewpoints/styles: ${angleList}${typeList ? `, ${typeList}` : ''}.

For each variation:
- Maintain the exact same product, colors, and design
- Use a clean white or neutral studio background
- Professional lighting, sharp focus
- E-commerce ready quality

Generate each image separately and clearly.`

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            {
              inline_data: {
                mime_type: mimeType,
                data: base64Image,
              }
            },
            { text: prompt }
          ]
        }],
        generationConfig: {
          responseModalities: ['TEXT', 'IMAGE'],
        }
      })
    }
  )

  if (!response.ok) {
    const err = await response.json()
    throw new Error(err?.error?.message || `API error ${response.status}`)
  }

  const data = await response.json()

  // Extract all generated images from response
  const images = []
  const parts = data?.candidates?.[0]?.content?.parts || []
  let angleIndex = 0

  for (const part of parts) {
    if (part.inline_data?.mime_type?.startsWith('image/')) {
      const label = selectedAngles[angleIndex] || genTypes[angleIndex - selectedAngles.length] || `View ${angleIndex + 1}`
      images.push({
        id: `gen-${angleIndex}`,
        label: label.charAt(0).toUpperCase() + label.slice(1),
        src: `data:${part.inline_data.mime_type};base64,${part.inline_data.data}`,
        blob: part.inline_data.data,
        mimeType: part.inline_data.mime_type,
      })
      angleIndex++
    }
  }

  if (images.length === 0) throw new Error('No images were generated. Try a clearer product photo.')
  return images
}

// ─── Download helper ─────────────────────────────────────────────────────────
function downloadImage(src, label) {
  const a = document.createElement('a')
  a.href = src
  a.download = `${label.replace(/\s+/g, '-').toLowerCase()}-angle.png`
  a.click()
}

// ─── Image → Angles sub-component ───────────────────────────────────────────
function ImageAnglesPanel({ onImageSelected, accentColor }) {
  const [apiKey, setApiKey]           = useState(() => localStorage.getItem('gemini_api_key') || '')
  const [showKey, setShowKey]         = useState(false)
  const [category, setCategory]       = useState('')
  const [categorySearch, setCategorySearch] = useState('')
  const [showDropdown, setShowDropdown]     = useState(false)
  const [imageFile, setImageFile]     = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [description, setDescription] = useState('')
  const [selectedAngles, setSelectedAngles] = useState(['front', 'left', 'right'])
  const [genTypes, setGenTypes]       = useState({ multiAngles: true, stillLifestyle: false, lifestyle: false })
  const [model, setModel]             = useState('gemini-2.0-flash-preview-image-generation')
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState('')
  const [generatedImages, setGeneratedImages] = useState([])
  const [selectedImage, setSelectedImage] = useState(null)
  const dropRef = useRef()

  const filteredCategories = PRODUCT_CATEGORIES.filter(c =>
    c.toLowerCase().includes(categorySearch.toLowerCase())
  )

  const handleFileChange = (file) => {
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const toggleAngle = (angle) => {
    setSelectedAngles(prev =>
      prev.includes(angle) ? prev.filter(a => a !== angle) : [...prev, angle]
    )
  }

  const handleGenerate = async () => {
    if (!apiKey.trim()) return setError('Please enter your Gemini API key.')
    if (!category)      return setError('Please select a product category.')
    if (!imageFile)     return setError('Please upload a product image.')
    if (selectedAngles.length === 0 && !genTypes.stillLifestyle && !genTypes.lifestyle)
      return setError('Please select at least one angle or generation type.')

    setError('')
    setLoading(true)
    setGeneratedImages([])
    setSelectedImage(null)
    localStorage.setItem('gemini_api_key', apiKey)

    const activeAngles = genTypes.multiAngles ? selectedAngles : []
    const activeTypes  = [
      ...(genTypes.stillLifestyle ? ['still lifestyle'] : []),
      ...(genTypes.lifestyle      ? ['lifestyle']       : []),
    ]

    try {
      const images = await generateAnglesWithGemini(
        apiKey, imageFile, category, description, activeAngles, activeTypes
      )
      setGeneratedImages(images)
    } catch (e) {
      setError(e.message || 'Generation failed. Check your API key and try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectImage = (img) => {
    setSelectedImage(img.id)
    // Convert base64 to File object and pass up to parent form
    fetch(img.src)
      .then(r => r.blob())
      .then(blob => {
        const file = new File([blob], `${img.label}-angle.png`, { type: img.mimeType })
        onImageSelected(file, img.src)
      })
  }

  const s = {
    panel: {
      marginTop: '32px',
      background: 'rgba(6,182,212,0.04)',
      border: '1px solid rgba(6,182,212,0.18)',
      borderRadius: '16px',
      overflow: 'hidden',
    },
    header: {
      padding: '20px 24px',
      background: 'rgba(6,182,212,0.07)',
      borderBottom: '1px solid rgba(6,182,212,0.12)',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
    },
    body: { padding: '24px' },
    label: {
      display: 'block',
      fontSize: '11px',
      fontWeight: 700,
      letterSpacing: '0.08em',
      color: 'rgba(255,255,255,0.5)',
      marginBottom: '8px',
      marginTop: '18px',
      textTransform: 'uppercase',
    },
    input: {
      width: '100%',
      padding: '11px 14px',
      background: 'rgba(255,255,255,0.05)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '10px',
      color: '#fff',
      fontSize: '14px',
      boxSizing: 'border-box',
      outline: 'none',
    },
    select: {
      width: '100%',
      padding: '11px 14px',
      background: 'rgba(255,255,255,0.05)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '10px',
      color: '#fff',
      fontSize: '14px',
      boxSizing: 'border-box',
      outline: 'none',
      appearance: 'none',
      cursor: 'pointer',
    },
    checkGroup: {
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '10px',
      padding: '14px',
      marginTop: '8px',
    },
    checkRow: {
      display: 'flex', alignItems: 'center', gap: '10px',
      cursor: 'pointer', fontSize: '14px', color: 'rgba(255,255,255,0.8)',
    },
    anglesGrid: {
      display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px',
      marginTop: '10px', paddingLeft: '4px',
    },
    angleBtn: (active) => ({
      display: 'flex', alignItems: 'center', gap: '6px',
      padding: '8px 12px',
      background: active ? 'rgba(6,182,212,0.15)' : 'rgba(255,255,255,0.03)',
      border: `1px solid ${active ? 'rgba(6,182,212,0.4)' : 'rgba(255,255,255,0.08)'}`,
      borderRadius: '8px',
      cursor: 'pointer', fontSize: '13px',
      color: active ? '#06b6d4' : 'rgba(255,255,255,0.5)',
      transition: 'all 0.15s',
    }),
    dropZone: {
      border: '2px dashed rgba(255,255,255,0.12)',
      borderRadius: '12px',
      padding: '28px 20px',
      textAlign: 'center',
      cursor: 'pointer',
      color: 'rgba(255,255,255,0.4)',
      fontSize: '14px',
      transition: 'border-color 0.2s',
      position: 'relative',
    },
    generateBtn: {
      width: '100%',
      marginTop: '20px',
      padding: '14px',
      background: loading
        ? 'rgba(6,182,212,0.3)'
        : 'linear-gradient(135deg, #06b6d4, #0891b2)',
      border: 'none',
      borderRadius: '11px',
      color: loading ? 'rgba(255,255,255,0.5)' : '#fff',
      fontSize: '15px',
      fontWeight: 700,
      cursor: loading ? 'not-allowed' : 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
    },
  }

  return (
    <div style={s.panel}>
      {/* Header */}
      <div style={s.header}>
        <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#06b6d4' }}>
          <RotateCcw size={16} />
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: '15px' }}>Image → New Angles <span style={{ fontSize: '11px', background: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.3)', borderRadius: '100px', padding: '2px 8px', color: '#06b6d4', fontWeight: 700, letterSpacing: '0.05em', marginLeft: '6px' }}>AI TOOL</span></div>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>Generate multiple product viewpoints — select one to use in your campaign</div>
        </div>
      </div>

      <div style={s.body}>

        {/* API Key */}
        <label style={s.label}><Key size={11} style={{ display: 'inline', marginRight: 4 }} />Gemini API Key</label>
        <div style={{ position: 'relative' }}>
          <input
            type={showKey ? 'text' : 'password'}
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            placeholder="AIza..."
            style={{ ...s.input, paddingRight: '44px' }}
          />
          <button onClick={() => setShowKey(v => !v)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)' }}>
            <Eye size={15} />
          </button>
        </div>
        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '5px' }}>
          Get your key at <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" style={{ color: '#06b6d4' }}>aistudio.google.com</a> · Saved locally in your browser
        </p>

        {/* Category dropdown with search */}
        <label style={s.label}>Product Category *</label>
        <div style={{ position: 'relative' }} ref={dropRef}>
          <button
            onClick={() => setShowDropdown(v => !v)}
            style={{ ...s.select, textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.05)' }}
          >
            <span style={{ color: category ? '#fff' : 'rgba(255,255,255,0.3)' }}>{category || '— select category —'}</span>
            <ChevronDown size={14} style={{ color: 'rgba(255,255,255,0.4)', flexShrink: 0 }} />
          </button>
          <AnimatePresence>
            {showDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                style={{
                  position: 'absolute', top: '110%', left: 0, right: 0, zIndex: 100,
                  background: '#1a1a2e', border: '1px solid rgba(6,182,212,0.25)',
                  borderRadius: '12px', overflow: 'hidden', boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
                }}
              >
                <div style={{ padding: '10px' }}>
                  <input
                    autoFocus
                    value={categorySearch}
                    onChange={e => setCategorySearch(e.target.value)}
                    placeholder="Search categories..."
                    style={{ ...s.input, margin: 0, fontSize: '13px' }}
                  />
                </div>
                <div style={{ maxHeight: '220px', overflowY: 'auto' }}>
                  {filteredCategories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => { setCategory(cat); setShowDropdown(false); setCategorySearch('') }}
                      style={{
                        width: '100%', padding: '10px 16px', background: category === cat ? 'rgba(6,182,212,0.12)' : 'none',
                        border: 'none', cursor: 'pointer', color: category === cat ? '#06b6d4' : 'rgba(255,255,255,0.7)',
                        fontSize: '13px', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px',
                        transition: 'background 0.1s',
                      }}
                      onMouseEnter={e => { if (category !== cat) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                      onMouseLeave={e => { if (category !== cat) e.currentTarget.style.background = 'none' }}
                    >
                      {category === cat && <Check size={12} />}{cat}
                    </button>
                  ))}
                  {filteredCategories.length === 0 && (
                    <div style={{ padding: '16px', color: 'rgba(255,255,255,0.3)', fontSize: '13px', textAlign: 'center' }}>No results</div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Image upload */}
        <label style={s.label}>Product Image *</label>
        <div
          style={{ ...s.dropZone, borderColor: imageFile ? 'rgba(6,182,212,0.4)' : 'rgba(255,255,255,0.12)' }}
          onClick={() => document.getElementById('ai-file-input').click()}
          onDrop={e => { e.preventDefault(); handleFileChange(e.dataTransfer.files[0]) }}
          onDragOver={e => e.preventDefault()}
        >
          {imagePreview ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <img src={imagePreview} alt="preview" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: '8px', border: '1px solid rgba(6,182,212,0.3)' }} />
              <div style={{ textAlign: 'left' }}>
                <div style={{ color: '#06b6d4', fontWeight: 600, fontSize: '13px' }}>{imageFile.name}</div>
                <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px' }}>{(imageFile.size / 1024).toFixed(0)} KB · Click to change</div>
              </div>
            </div>
          ) : (
            <>
              <Upload size={24} style={{ color: 'rgba(255,255,255,0.25)', marginBottom: '8px' }} />
              <div>Drag & drop or <span style={{ color: '#06b6d4' }}>click to upload</span></div>
              <div style={{ fontSize: '12px', marginTop: '4px' }}>PNG, JPG, WEBP — max 10MB</div>
            </>
          )}
          <input id="ai-file-input" type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleFileChange(e.target.files[0])} />
        </div>

        {/* Description */}
        <label style={s.label}>Product Description (optional)</label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="e.g. Rose gold watch with leather strap, minimalist dial..."
          style={{ ...s.input, minHeight: '72px', resize: 'vertical' }}
        />

        {/* Generation Type */}
        <label style={s.label}>Generation Type</label>

        {/* Multi Angles */}
        <div style={s.checkGroup}>
          <label style={s.checkRow}>
            <input type="checkbox" checked={genTypes.multiAngles} onChange={() => setGenTypes(p => ({ ...p, multiAngles: !p.multiAngles }))}
              style={{ accentColor: '#06b6d4', width: 15, height: 15 }} />
            <span style={{ fontWeight: 600 }}>Multi Angles</span>
          </label>
          <AnimatePresence>
            {genTypes.multiAngles && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                <div style={s.anglesGrid}>
                  {ANGLE_OPTIONS.map(angle => (
                    <button
                      key={angle}
                      onClick={() => toggleAngle(angle)}
                      style={s.angleBtn(selectedAngles.includes(angle))}
                    >
                      {selectedAngles.includes(angle) && <Check size={11} />}
                      {angle.charAt(0).toUpperCase() + angle.slice(1)}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div style={{ ...s.checkGroup, marginTop: '8px' }}>
          <label style={s.checkRow}>
            <input type="checkbox" checked={genTypes.stillLifestyle} onChange={() => setGenTypes(p => ({ ...p, stillLifestyle: !p.stillLifestyle }))}
              style={{ accentColor: '#06b6d4', width: 15, height: 15 }} />
            <span style={{ fontWeight: 600 }}>Still Lifestyle</span>
            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px' }}>Product in a styled scene</span>
          </label>
        </div>

        <div style={{ ...s.checkGroup, marginTop: '8px' }}>
          <label style={s.checkRow}>
            <input type="checkbox" checked={genTypes.lifestyle} onChange={() => setGenTypes(p => ({ ...p, lifestyle: !p.lifestyle }))}
              style={{ accentColor: '#06b6d4', width: 15, height: 15 }} />
            <span style={{ fontWeight: 600 }}>Lifestyle</span>
            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px' }}>Product in real-world use</span>
          </label>
        </div>

        {/* Model & Resolution */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '18px' }}>
          <div>
            <label style={{ ...s.label, marginTop: 0 }}>Model</label>
            <select value={model} onChange={e => setModel(e.target.value)} style={s.select}>
              <option value="gemini-2.0-flash-preview-image-generation">Gemini 2.0 Flash (Image Gen)</option>
              <option value="gemini-2.0-flash-exp-image-generation">Gemini 2.0 Flash (Experimental)</option>
              <option value="gemini-2.5-flash-preview-04-17">Gemini 2.5 Flash</option>
            </select>
          </div>
          <div>
            <label style={{ ...s.label, marginTop: 0 }}>Quality</label>
            <select style={s.select}>
              <option>Standard (default)</option>
              <option>High</option>
            </select>
          </div>
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{ marginTop: '14px', padding: '12px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '10px', display: 'flex', alignItems: 'flex-start', gap: '8px', color: '#f87171', fontSize: '13px' }}
            >
              <AlertCircle size={15} style={{ marginTop: 1, flexShrink: 0 }} />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Generate Button */}
        <button onClick={handleGenerate} disabled={loading} style={s.generateBtn}>
          {loading
            ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Generating with Gemini...</>
            : <><Sparkles size={16} /> Generate Angles</>
          }
        </button>

        {loading && (
          <p style={{ textAlign: 'center', fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginTop: '10px' }}>
            This may take 15–30 seconds · Gemini is rendering your product...
          </p>
        )}

        {/* Generated Images Gallery */}
        <AnimatePresence>
          {generatedImages.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ fontWeight: 700, fontSize: '14px', color: 'rgba(255,255,255,0.8)' }}>
                  <Check size={14} style={{ color: '#10b981', display: 'inline', marginRight: 6 }} />
                  {generatedImages.length} angles generated — tap to select for your campaign
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px' }}>
                {generatedImages.map((img) => {
                  const isSelected = selectedImage === img.id
                  return (
                    <motion.div
                      key={img.id}
                      whileHover={{ scale: 1.03 }}
                      style={{
                        position: 'relative',
                        border: `2px solid ${isSelected ? '#06b6d4' : 'rgba(255,255,255,0.08)'}`,
                        borderRadius: '12px', overflow: 'hidden',
                        cursor: 'pointer',
                        background: 'rgba(255,255,255,0.03)',
                        boxShadow: isSelected ? '0 0 0 3px rgba(6,182,212,0.2)' : 'none',
                        transition: 'all 0.2s',
                      }}
                    >
                      <img
                        src={img.src}
                        alt={img.label}
                        style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }}
                        onClick={() => handleSelectImage(img)}
                      />
                      {isSelected && (
                        <div style={{ position: 'absolute', top: 8, right: 8, width: 22, height: 22, borderRadius: '50%', background: '#06b6d4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Check size={12} color="#fff" />
                        </div>
                      )}
                      <div style={{ padding: '6px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: isSelected ? '#06b6d4' : 'rgba(255,255,255,0.5)' }}>
                          {img.label}
                        </span>
                        <button
                          onClick={() => downloadImage(img.src, img.label)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', padding: 0, display: 'flex' }}
                          title="Download"
                        >
                          <Download size={12} />
                        </button>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
              {selectedImage && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  style={{ marginTop: '12px', padding: '12px 16px', background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.25)', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#06b6d4' }}
                >
                  <Check size={14} />
                  <strong>Image selected!</strong> It has been added to the Product Image field above.
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

// ─── Main CampaignForm component ─────────────────────────────────────────────
export default function CampaignForm() {
  const { type } = useParams()
  const navigate = useNavigate()
  const meta = campaignMeta[type] || campaignMeta.product

  const INDIAN_CITIES = [
    'Online / Virtual',
    // ── India ──
    'Mumbai, India', 'Delhi, India', 'Bengaluru, India', 'Hyderabad, India', 'Chennai, India',
    'Kolkata, India', 'Pune, India', 'Ahmedabad, India', 'Jaipur, India', 'Surat, India',
    'Lucknow, India', 'Kanpur, India', 'Nagpur, India', 'Indore, India', 'Thane, India',
    'Bhopal, India', 'Visakhapatnam, India', 'Patna, India', 'Vadodara, India',
    'Coimbatore, India', 'Agra, India', 'Madurai, India', 'Nashik, India',
    'Faridabad, India', 'Meerut, India', 'Rajkot, India', 'Varanasi, India',
    'Srinagar, India', 'Aurangabad, India', 'Amritsar, India', 'Navi Mumbai, India',
    'Ranchi, India', 'Howrah, India', 'Ghaziabad, India', 'Chandigarh, India',
    'Jodhpur, India', 'Ludhiana, India', 'Mysore, India', 'Kochi, India',
    'Guwahati, India', 'Bhubaneswar, India', 'Thiruvananthapuram, India',
    'Noida, India', 'Gurugram, India',
    // ── United States ──
    'New York, USA', 'Los Angeles, USA', 'Chicago, USA', 'Houston, USA', 'Phoenix, USA',
    'Philadelphia, USA', 'San Antonio, USA', 'San Diego, USA', 'Dallas, USA', 'San Jose, USA',
    'Austin, USA', 'Jacksonville, USA', 'Fort Worth, USA', 'Columbus, USA', 'Charlotte, USA',
    'Indianapolis, USA', 'San Francisco, USA', 'Seattle, USA', 'Denver, USA', 'Nashville, USA',
    'Las Vegas, USA', 'Portland, USA', 'Memphis, USA', 'Atlanta, USA', 'Boston, USA',
    'Miami, USA', 'Minneapolis, USA', 'New Orleans, USA', 'Washington DC, USA',
    // ── United Kingdom ──
    'London, UK', 'Manchester, UK', 'Birmingham, UK', 'Leeds, UK', 'Glasgow, UK',
    'Sheffield, UK', 'Bradford, UK', 'Edinburgh, UK', 'Liverpool, UK', 'Bristol, UK',
    'Cardiff, UK', 'Belfast, UK', 'Leicester, UK', 'Nottingham, UK', 'Newcastle, UK',
    // ── Germany ──
    'Berlin, Germany', 'Hamburg, Germany', 'Munich, Germany', 'Cologne, Germany',
    'Frankfurt, Germany', 'Stuttgart, Germany', 'Düsseldorf, Germany', 'Leipzig, Germany',
    'Dortmund, Germany', 'Essen, Germany', 'Bremen, Germany', 'Dresden, Germany',
    // ── France ──
    'Paris, France', 'Marseille, France', 'Lyon, France', 'Toulouse, France',
    'Nice, France', 'Nantes, France', 'Strasbourg, France', 'Bordeaux, France',
    'Lille, France', 'Rennes, France',
    // ── UAE ──
    'Dubai, UAE', 'Abu Dhabi, UAE', 'Sharjah, UAE', 'Ajman, UAE', 'Ras Al Khaimah, UAE',
    // ── Saudi Arabia ──
    'Riyadh, Saudi Arabia', 'Jeddah, Saudi Arabia', 'Mecca, Saudi Arabia',
    'Medina, Saudi Arabia', 'Dammam, Saudi Arabia',
    // ── Australia ──
    'Sydney, Australia', 'Melbourne, Australia', 'Brisbane, Australia', 'Perth, Australia',
    'Adelaide, Australia', 'Gold Coast, Australia', 'Canberra, Australia', 'Hobart, Australia',
    // ── Canada ──
    'Toronto, Canada', 'Vancouver, Canada', 'Montreal, Canada', 'Calgary, Canada',
    'Edmonton, Canada', 'Ottawa, Canada', 'Winnipeg, Canada', 'Quebec City, Canada',
    // ── Singapore ──
    'Singapore',
    // ── Japan ──
    'Tokyo, Japan', 'Osaka, Japan', 'Yokohama, Japan', 'Nagoya, Japan', 'Sapporo, Japan',
    'Fukuoka, Japan', 'Kobe, Japan', 'Kyoto, Japan',
    // ── China ──
    'Beijing, China', 'Shanghai, China', 'Guangzhou, China', 'Shenzhen, China',
    'Chengdu, China', 'Hangzhou, China', 'Wuhan, China', 'Xi\'an, China',
    // ── South Korea ──
    'Seoul, South Korea', 'Busan, South Korea', 'Incheon, South Korea', 'Daegu, South Korea',
    // ── Netherlands ──
    'Amsterdam, Netherlands', 'Rotterdam, Netherlands', 'The Hague, Netherlands',
    'Utrecht, Netherlands', 'Eindhoven, Netherlands',
    // ── Spain ──
    'Madrid, Spain', 'Barcelona, Spain', 'Valencia, Spain', 'Seville, Spain',
    'Bilbao, Spain', 'Málaga, Spain', 'Zaragoza, Spain',
    // ── Italy ──
    'Rome, Italy', 'Milan, Italy', 'Naples, Italy', 'Turin, Italy', 'Florence, Italy',
    'Venice, Italy', 'Bologna, Italy', 'Genoa, Italy',
    // ── Brazil ──
    'São Paulo, Brazil', 'Rio de Janeiro, Brazil', 'Brasília, Brazil', 'Salvador, Brazil',
    'Fortaleza, Brazil', 'Belo Horizonte, Brazil', 'Manaus, Brazil',
    // ── Mexico ──
    'Mexico City, Mexico', 'Guadalajara, Mexico', 'Monterrey, Mexico', 'Cancún, Mexico',
    'Tijuana, Mexico', 'Puebla, Mexico',
    // ── South Africa ──
    'Johannesburg, South Africa', 'Cape Town, South Africa', 'Durban, South Africa',
    'Pretoria, South Africa', 'Port Elizabeth, South Africa',
    // ── Nigeria ──
    'Lagos, Nigeria', 'Abuja, Nigeria', 'Kano, Nigeria', 'Ibadan, Nigeria',
    // ── Kenya ──
    'Nairobi, Kenya', 'Mombasa, Kenya',
    // ── Egypt ──
    'Cairo, Egypt', 'Alexandria, Egypt', 'Giza, Egypt',
    // ── Pakistan ──
    'Karachi, Pakistan', 'Lahore, Pakistan', 'Islamabad, Pakistan', 'Rawalpindi, Pakistan',
    // ── Bangladesh ──
    'Dhaka, Bangladesh', 'Chittagong, Bangladesh',
    // ── Sri Lanka ──
    'Colombo, Sri Lanka', 'Kandy, Sri Lanka',
    // ── Nepal ──
    'Kathmandu, Nepal',
    // ── Malaysia ──
    'Kuala Lumpur, Malaysia', 'George Town, Malaysia', 'Johor Bahru, Malaysia',
    // ── Indonesia ──
    'Jakarta, Indonesia', 'Surabaya, Indonesia', 'Bandung, Indonesia', 'Bali, Indonesia',
    // ── Philippines ──
    'Manila, Philippines', 'Cebu, Philippines', 'Davao, Philippines',
    // ── Thailand ──
    'Bangkok, Thailand', 'Chiang Mai, Thailand', 'Phuket, Thailand',
    // ── Vietnam ──
    'Ho Chi Minh City, Vietnam', 'Hanoi, Vietnam', 'Da Nang, Vietnam',
    // ── Russia ──
    'Moscow, Russia', 'Saint Petersburg, Russia', 'Novosibirsk, Russia',
    // ── Turkey ──
    'Istanbul, Turkey', 'Ankara, Turkey', 'Izmir, Turkey',
    // ── Switzerland ──
    'Zurich, Switzerland', 'Geneva, Switzerland', 'Basel, Switzerland',
    // ── Sweden ──
    'Stockholm, Sweden', 'Gothenburg, Sweden', 'Malmö, Sweden',
    // ── Norway ──
    'Oslo, Norway', 'Bergen, Norway',
    // ── Denmark ──
    'Copenhagen, Denmark', 'Aarhus, Denmark',
    // ── Finland ──
    'Helsinki, Finland', 'Tampere, Finland',
    // ── Belgium ──
    'Brussels, Belgium', 'Antwerp, Belgium', 'Ghent, Belgium',
    // ── Austria ──
    'Vienna, Austria', 'Graz, Austria', 'Salzburg, Austria',
    // ── Portugal ──
    'Lisbon, Portugal', 'Porto, Portugal',
    // ── Greece ──
    'Athens, Greece', 'Thessaloniki, Greece',
    // ── Poland ──
    'Warsaw, Poland', 'Kraków, Poland', 'Wrocław, Poland', 'Gdańsk, Poland',
    // ── Israel ──
    'Tel Aviv, Israel', 'Jerusalem, Israel', 'Haifa, Israel',
    // ── Qatar ──
    'Doha, Qatar',
    // ── Kuwait ──
    'Kuwait City, Kuwait',
    // ── Bahrain ──
    'Manama, Bahrain',
    // ── Oman ──
    'Muscat, Oman',
    // ── New Zealand ──
    'Auckland, New Zealand', 'Wellington, New Zealand', 'Christchurch, New Zealand',
    // ── Argentina ──
    'Buenos Aires, Argentina', 'Córdoba, Argentina', 'Rosario, Argentina',
    // ── Chile ──
    'Santiago, Chile',
    // ── Colombia ──
    'Bogotá, Colombia', 'Medellín, Colombia',
    // ── Peru ──
    'Lima, Peru',
    // ── Ireland ──
    'Dublin, Ireland', 'Cork, Ireland',
    // ── Czech Republic ──
    'Prague, Czech Republic', 'Brno, Czech Republic',
    // ── Hungary ──
    'Budapest, Hungary',
    // ── Romania ──
    'Bucharest, Romania',
    // ── Ukraine ──
    'Kyiv, Ukraine', 'Lviv, Ukraine',
  ]

  const PLATFORM_OPTIONS = [
    { key: 'linkedin',  label: 'LinkedIn',  color: '#0a66c2' },
    { key: 'instagram', label: 'Instagram', color: '#e1306c' },
    { key: 'facebook',  label: 'Facebook',  color: '#1877f2' },
    { key: 'tiktok',    label: 'TikTok',    color: '#ff0050' },
    { key: 'whatsapp',  label: 'WhatsApp',  color: '#25d366' },
    { key: 'email',     label: 'Email',     color: '#7c3aed' },
  ]

  const [form, setForm] = useState({
    name: '', description: '', imageFile: null, imagePreview: null,
    // event-specific
    date: '', time: '', location: '', eventUrl: '', imageUrl: '',
    // product/brand
    website: '',
    // all
    price: '', targetAudience: [], goal: '',
    brandName: '', contactName: '', contactEmail: '', contactPhone: '',
    postDate: '', postTime: '09:00',
    platforms: ['linkedin', 'instagram', 'facebook', 'email'],
    whatsappRecipients: '',
  })
  const [audienceOpen, setAudienceOpen] = useState(false)
  const [locationOpen, setLocationOpen] = useState(false)
  const [locationSearch, setLocationSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingPhase, setLoadingPhase] = useState('') // 'generating' | 'posting'
  const [submitError, setSubmitError] = useState('')
  const [eventImageFile, setEventImageFile] = useState(null)
  const [eventImagePreview, setEventImagePreview] = useState(null)
  const [eventImageUploading, setEventImageUploading] = useState(false)
  const [eventImageUploadProgress, setEventImageUploadProgress] = useState(0)
  const [postNow, setPostNow] = useState(true)

  const audienceOptions = [
    'Gen Z (18–24)', 'Millennials (25–40)', 'Gen X (41–56)', 'Professionals / B2B',
    'Parents', 'Students', 'Fitness Enthusiasts', 'Tech Enthusiasts', 'Fashion & Lifestyle',
    'Home & Family', 'Small Business Owners', 'Entrepreneurs', 'Luxury Buyers',
  ]

  const set = (key, val) => setForm(p => ({ ...p, [key]: val }))

  const handleImageFile = (file) => {
    if (!file) return
    set('imageFile', file)
    set('imagePreview', URL.createObjectURL(file))
  }

  const handleAIImageSelected = (file, previewSrc) => {
    set('imageFile', file)
    set('imagePreview', previewSrc)
    document.getElementById('product-image-field')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  const toggleAudience = (opt) => {
    set('targetAudience',
      form.targetAudience.includes(opt)
        ? form.targetAudience.filter(a => a !== opt)
        : [...form.targetAudience, opt]
    )
  }

  const togglePlatform = (key) => {
    set('platforms',
      form.platforms.includes(key)
        ? form.platforms.filter(p => p !== key)
        : [...form.platforms, key]
    )
  }

  const handleSubmit = async () => {
    setSubmitError('')
    if (!form.name.trim())        return setSubmitError('Please enter a name.')
    if (!form.description.trim()) return setSubmitError('Please enter a description.')
    if (!form.goal.trim())        return setSubmitError('Please enter a campaign goal.')
    if (type !== 'event' && !form.brandName.trim()) return setSubmitError('Please enter a brand name.')
    if (!form.contactEmail.trim()) return setSubmitError('Please enter a contact email.')
    if (form.targetAudience.length === 0) return setSubmitError('Please select at least one target audience.')

    setLoading(true)
    setLoadingPhase('generating')
    try {
      // Upload image to ImgBB if provided (events and products)
      let resolvedImageUrl = form.imageUrl || ''
      if (type === 'event' && eventImageFile) {
        setEventImageUploading(true)
        setEventImageUploadProgress(0)
        resolvedImageUrl = await uploadToImgBB(eventImageFile)
        setEventImageUploadProgress(100)
        setEventImageUploading(false)
      } else if (type === 'product' && form.imageFile) {
        resolvedImageUrl = await uploadToImgBB(form.imageFile)
      }

      // Generate content directly via Groq from the browser
      const campaignData = await generateCampaignContent(form, type)

      // Fire n8n in background for social media posting (don't wait for it)
      const payload = {
        campaignType: type,
        name: form.name,
        description: form.description,

        price: form.price,
        targetAudience: form.targetAudience.join(', '),
        goal: form.goal,
        brandName: form.brandName,
        contactName: form.contactName,
        contactEmail: form.contactEmail,
        contactPhone: form.contactPhone,
        adminEmail: 'vasanthchowdarythumati@gmail.com',
        website: form.website,
        postDate: postNow ? new Date().toISOString().split('T')[0] : form.postDate,
        postTime: postNow ? new Date().toTimeString().slice(0, 5) : (form.postTime || '09:00'),
        platforms: form.platforms.join(','),
        imageUrl: resolvedImageUrl,
        ...(type === 'event' && {
          date: form.date,
          time: form.time,
          location: form.location,
          eventUrl: form.eventUrl,
        }),
        // Pass generated content so n8n can post it without re-generating
        emailSubject: campaignData.emailSubject || '',
        emailBody: campaignData.emailBody || '',
        linkedinPost: campaignData.linkedinPost || '',
        instagramCaption: campaignData.instagramCaption || '',
        facebookPost: campaignData.facebookPost || '',
        tiktokCaption: campaignData.tiktokCaption || '',
        whatsappMessage: campaignData.whatsappMessage || '',
        whatsappRecipients: form.whatsappRecipients || '',
        adHeadline: campaignData.adHeadline || '',
        adBody: campaignData.adBody || '',
      }

      // Load user's own social media credentials from Firestore
      const currentUser = auth.currentUser
      if (currentUser) {
        const userData = await getUserData(currentUser.uid)
        if (userData?.socialAccounts) {
          const sa = userData.socialAccounts
          payload.userCredentials = {
            facebook:  sa.facebook?.connected  ? { pageId: sa.facebook.pageId,  pageAccessToken: sa.facebook.pageAccessToken }  : null,
            instagram: sa.instagram?.connected ? { businessAccountId: sa.instagram.businessAccountId, pageAccessToken: sa.instagram.pageAccessToken } : null,
            linkedin:  sa.linkedin?.connected  ? { personUrn: sa.linkedin.personUrn, accessToken: sa.linkedin.accessToken }  : null,
            gmail:     sa.gmail?.connected     ? { email: sa.gmail.email, accessToken: sa.gmail.accessToken, refreshToken: sa.gmail.refreshToken } : null,
            tiktok:    sa.tiktok?.connected    ? { accessToken: sa.tiktok.accessToken, openId: sa.tiktok.openId } : null,
          }
        }
      }

      // Phase 2 — send to n8n for posting
      setLoadingPhase('posting')
      let webhookStatus = 'pending'
      try {
        const webhookRes = await Promise.race([
          fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 30000)),
        ])
        webhookStatus = webhookRes.ok ? 'success' : 'failed'
        // Deduct 1 token on successful submission
        if (webhookRes.ok && currentUser) {
          try { await deductToken(currentUser.uid) } catch (_) {}
        }
      } catch {
        webhookStatus = 'failed'
      }

      sessionStorage.setItem('campaignResult', JSON.stringify(campaignData))
      sessionStorage.setItem('campaignType', type)
      sessionStorage.setItem('campaignMeta', JSON.stringify({ name: form.name, brandName: form.brandName }))
      sessionStorage.setItem('webhookStatus', webhookStatus)
      sessionStorage.setItem('webhookPayload', JSON.stringify(payload))
      navigate('/results')
    } catch (err) {
      setEventImageUploading(false)
      setSubmitError(err.message || 'Failed to generate campaign. Please try again.')
    } finally {
      setLoading(false)
      setLoadingPhase('')
    }
  }

  // Dynamic labels based on type
  const nameLabel     = type === 'event' ? 'Event Name' : type === 'brand' ? 'Campaign Name' : 'Product Name'
  const namePlaceholder = type === 'event' ? 'Enter event name' : type === 'brand' ? 'Enter campaign name' : 'Enter product name'
  const descLabel     = type === 'event' ? 'Event Description' : type === 'brand' ? 'Brand Description' : 'Product Description'

  const s = {
    page: { minHeight: '100vh', background: '#0a0a0a', color: '#fff' },
    container: { maxWidth: 720, margin: '0 auto', padding: '108px 24px 80px', position: 'relative', zIndex: 1 },
    card: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '36px' },
    label: { display: 'block', fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: '8px', marginTop: '22px' },
    req: { color: meta.color, marginLeft: '2px' },
    input: {
      width: '100%', padding: '12px 16px',
      background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '12px', color: '#fff', fontSize: '14px', boxSizing: 'border-box',
      outline: 'none', transition: 'border-color 0.2s',
    },
    textarea: {
      width: '100%', padding: '12px 16px', minHeight: '100px', resize: 'vertical',
      background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '12px', color: '#fff', fontSize: '14px', boxSizing: 'border-box',
      outline: 'none',
    },
    dropZone: {
      border: `2px dashed rgba(255,255,255,0.1)`,
      borderRadius: '14px', padding: '32px 20px', textAlign: 'center',
      cursor: 'pointer', color: 'rgba(255,255,255,0.4)', fontSize: '14px',
    },
    divider: {
      height: '1px', background: 'rgba(255,255,255,0.07)', margin: '28px 0',
    },
    sectionTitle: {
      fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em',
      color: `${meta.color}`, textTransform: 'uppercase', marginBottom: '4px',
    },
    submitBtn: {
      width: '100%', marginTop: '28px', padding: '16px',
      background: loading
        ? 'rgba(255,255,255,0.08)'
        : `linear-gradient(135deg, ${meta.color}, ${meta.color}bb)`,
      border: 'none', borderRadius: '14px', color: loading ? 'rgba(255,255,255,0.4)' : '#fff',
      fontSize: '16px', fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
      letterSpacing: '-0.01em',
    },
  }

  return (
    <div style={s.page}>
      <Navbar />
      <div className="glow-orb glow-cyan" style={{ width: 500, height: 500, top: -80, right: -80, opacity: 0.12 }} />

      <div style={s.container}>
        {/* Back */}
        <button onClick={() => navigate('/dashboard')} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.45)', fontSize: '14px', cursor: 'pointer', marginBottom: '32px', padding: 0 }}>
          ← Back to Dashboard
        </button>

        {/* Title */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '32px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', background: `${meta.color}18`, border: `1px solid ${meta.color}30`, borderRadius: '100px', fontSize: '11px', fontWeight: 700, color: meta.color, letterSpacing: '0.07em', marginBottom: '14px' }}>
            {meta.icon} {meta.badge}
          </div>
          <h1 style={{ fontSize: '36px', fontWeight: 900, letterSpacing: '-0.025em', marginBottom: '8px' }}>
            {meta.title}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '15px' }}>
            Fill in the details below and your AI CMO will generate a complete, multi-channel marketing campaign in seconds.
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={s.card}>

          {/* ── Campaign Info ── */}
          <p style={s.sectionTitle}>Campaign Details</p>

          {/* Name */}
          <label style={{ ...s.label, marginTop: '12px' }}>{nameLabel} <span style={s.req}>*</span></label>
          <input value={form.name} onChange={e => set('name', e.target.value)} placeholder={namePlaceholder} style={s.input} />

          {/* Description */}
          <label style={s.label}>{descLabel} <span style={s.req}>*</span></label>
          <textarea value={form.description} onChange={e => set('description', e.target.value)} placeholder="Describe in detail..." style={s.textarea} />

          {/* ── Event-specific fields ── */}
          {type === 'event' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={s.label}>Event Date <span style={s.req}>*</span></label>
                  <input type="date" value={form.date} onChange={e => set('date', e.target.value)} style={s.input} />
                </div>
                <div>
                  <label style={s.label}>Event Time <span style={s.req}>*</span></label>
                  <input type="time" value={form.time} onChange={e => set('time', e.target.value)} style={s.input} />
                </div>
              </div>

              {/* Location — searchable dropdown */}
              <label style={s.label}>Location <span style={s.req}>*</span></label>
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setLocationOpen(v => !v)}
                  style={{ ...s.input, textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: form.location ? '#fff' : 'rgba(255,255,255,0.3)' }}>
                    <MapPin size={14} style={{ color: 'rgba(255,255,255,0.3)', flexShrink: 0 }} />
                    {form.location || 'Search city or venue…'}
                  </span>
                  <ChevronDown size={14} style={{ color: 'rgba(255,255,255,0.4)', flexShrink: 0 }} />
                </button>
                <AnimatePresence>
                  {locationOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                      style={{ position: 'absolute', top: '110%', left: 0, right: 0, zIndex: 60, background: '#1a1a2e', border: `1px solid ${meta.color}30`, borderRadius: '12px', overflow: 'hidden', boxShadow: '0 16px 40px rgba(0,0,0,0.6)' }}
                    >
                      <div style={{ padding: '10px' }}>
                        <input
                          autoFocus
                          value={locationSearch}
                          onChange={e => setLocationSearch(e.target.value)}
                          placeholder="Search city or type custom venue…"
                          style={{ ...s.input, margin: 0, fontSize: '13px' }}
                        />
                      </div>
                      <div style={{ maxHeight: '220px', overflowY: 'auto' }}>
                        {/* Custom entry if typed something not in list */}
                        {locationSearch.trim() && !INDIAN_CITIES.some(c => c.toLowerCase() === locationSearch.trim().toLowerCase()) && (
                          <button
                            onClick={() => { set('location', locationSearch.trim()); setLocationOpen(false); setLocationSearch('') }}
                            style={{ width: '100%', padding: '10px 16px', background: `${meta.color}12`, border: 'none', cursor: 'pointer', color: meta.color, fontSize: '13px', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px' }}
                          >
                            <MapPin size={12} /> Use "{locationSearch.trim()}"
                          </button>
                        )}
                        {INDIAN_CITIES.filter(c => c.toLowerCase().includes(locationSearch.toLowerCase())).map(city => (
                          <button
                            key={city}
                            onClick={() => { set('location', city); setLocationOpen(false); setLocationSearch('') }}
                            style={{ width: '100%', padding: '10px 16px', background: form.location === city ? `${meta.color}12` : 'none', border: 'none', cursor: 'pointer', color: form.location === city ? meta.color : 'rgba(255,255,255,0.7)', fontSize: '13px', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px', transition: 'background 0.1s' }}
                            onMouseEnter={e => { if (form.location !== city) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                            onMouseLeave={e => { if (form.location !== city) e.currentTarget.style.background = 'none' }}
                          >
                            {form.location === city && <Check size={12} />}
                            <MapPin size={11} style={{ color: 'rgba(255,255,255,0.25)', flexShrink: 0 }} />
                            {city}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <label style={s.label}>Event URL <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', fontWeight: 400 }}>(optional)</span></label>
              <div style={{ position: 'relative' }}>
                <Link size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                <input value={form.eventUrl} onChange={e => set('eventUrl', e.target.value)} placeholder="https://eventbrite.com/your-event" style={{ ...s.input, paddingLeft: '36px' }} />
              </div>

              <label style={s.label}>
                Event Image <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', fontWeight: 400 }}>(optional — posted to Instagram, Facebook &amp; LinkedIn)</span>
              </label>
              <div
                style={{
                  border: `2px dashed ${eventImageFile ? 'rgba(124,58,237,0.5)' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: '14px', padding: '28px 20px', textAlign: 'center',
                  cursor: 'pointer', color: 'rgba(255,255,255,0.4)', fontSize: '14px',
                  background: eventImageFile ? 'rgba(124,58,237,0.04)' : 'transparent',
                  transition: 'all 0.2s',
                }}
                onClick={() => document.getElementById('event-image-input').click()}
                onDrop={e => {
                  e.preventDefault()
                  const file = e.dataTransfer.files[0]
                  if (file && file.type.startsWith('image/')) {
                    setEventImageFile(file)
                    setEventImagePreview(URL.createObjectURL(file))
                  }
                }}
                onDragOver={e => e.preventDefault()}
              >
                {eventImagePreview ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <img src={eventImagePreview} alt="preview" style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: '10px', border: '1px solid rgba(124,58,237,0.4)' }} />
                    <div style={{ textAlign: 'left', flex: 1 }}>
                      <div style={{ color: meta.color, fontWeight: 600, fontSize: '13px' }}>{eventImageFile.name}</div>
                      <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', marginTop: '2px' }}>{(eventImageFile.size / 1024).toFixed(0)} KB · Click to change</div>
                      <button
                        onClick={e => { e.stopPropagation(); setEventImageFile(null); setEventImagePreview(null) }}
                        style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '12px', padding: 0 }}
                      >
                        <X size={12} /> Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <Upload size={26} style={{ color: 'rgba(255,255,255,0.2)', marginBottom: '8px' }} />
                    <div>Drag &amp; drop or <span style={{ color: meta.color }}>click to upload</span></div>
                    <div style={{ fontSize: '12px', marginTop: '4px' }}>PNG, JPG, WEBP — max 10MB</div>
                  </>
                )}
                <input
                  id="event-image-input"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  style={{ display: 'none' }}
                  onChange={e => {
                    const file = e.target.files[0]
                    if (file) { setEventImageFile(file); setEventImagePreview(URL.createObjectURL(file)) }
                  }}
                />
              </div>
              {eventImageUploading && (
                <div style={{ marginTop: '8px', fontSize: '12px', color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
                  Uploading image… {eventImageUploadProgress}%
                </div>
              )}
            </>
          )}

          {/* Website — product & brand */}
          {(type === 'product' || type === 'brand') && (
            <>
              <label style={s.label}>{type === 'product' ? 'Product URL' : 'Website'} <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', fontWeight: 400 }}>(optional)</span></label>
              <div style={{ position: 'relative' }}>
                <Link size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                <input value={form.website} onChange={e => set('website', e.target.value)} placeholder="https://your-website.com" style={{ ...s.input, paddingLeft: '36px' }} />
              </div>
            </>
          )}


          {/* Price — product & brand only */}
          {type !== 'event' && (
            <>
              <label style={s.label}>Price / Pricing Info <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', fontWeight: 400 }}>(optional)</span></label>
              <input value={form.price} onChange={e => set('price', e.target.value)} placeholder="e.g. ₹1,999 / $29.99 / Free" style={s.input} />
            </>
          )}

          {/* Target Audience */}
          <label style={s.label}>Target Audience <span style={s.req}>*</span></label>
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setAudienceOpen(v => !v)}
              style={{ ...s.input, textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
            >
              <span style={{ color: form.targetAudience.length > 0 ? '#fff' : 'rgba(255,255,255,0.3)' }}>
                {form.targetAudience.length > 0 ? form.targetAudience.join(', ') : 'Select target audience(s)'}
              </span>
              <ChevronDown size={14} style={{ color: 'rgba(255,255,255,0.4)', flexShrink: 0 }} />
            </button>
            <AnimatePresence>
              {audienceOpen && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  style={{ position: 'absolute', top: '110%', left: 0, right: 0, zIndex: 50, background: '#1a1a2e', border: `1px solid ${meta.color}30`, borderRadius: '12px', overflow: 'hidden', boxShadow: '0 16px 40px rgba(0,0,0,0.5)' }}
                >
                  {audienceOptions.map(opt => {
                    const active = form.targetAudience.includes(opt)
                    return (
                      <button key={opt} onClick={() => toggleAudience(opt)}
                        style={{ width: '100%', padding: '10px 16px', background: active ? `${meta.color}12` : 'none', border: 'none', cursor: 'pointer', color: active ? meta.color : 'rgba(255,255,255,0.7)', fontSize: '13px', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px' }}
                      >
                        {active && <Check size={12} />}{opt}
                      </button>
                    )
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Campaign Goal */}
          <label style={s.label}>Campaign Goal <span style={s.req}>*</span></label>
          <textarea value={form.goal} onChange={e => set('goal', e.target.value)} placeholder="Describe your campaign goal..." style={s.textarea} />

          {/* Brand Name — not shown for events */}
          {type !== 'event' && (
            <>
              <label style={s.label}>Brand Name <span style={s.req}>*</span></label>
              <input value={form.brandName} onChange={e => set('brandName', e.target.value)} placeholder="Your brand or company name" style={s.input} />
            </>
          )}

          {/* ── Product Image ── */}
          {(type === 'product') && (
            <>
              <div style={s.divider} />
              <p style={s.sectionTitle}>Product Image</p>

              <label style={{ ...s.label, marginTop: '12px' }} id="product-image-field">
                Product Image <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', fontWeight: 400 }}>(optional)</span>
              </label>
              <div
                style={{ ...s.dropZone, borderColor: form.imagePreview ? `${meta.color}50` : 'rgba(255,255,255,0.1)' }}
                onClick={() => document.getElementById('main-image-input').click()}
                onDrop={e => { e.preventDefault(); handleImageFile(e.dataTransfer.files[0]) }}
                onDragOver={e => e.preventDefault()}
              >
                {form.imagePreview ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <img src={form.imagePreview} alt="preview" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: '10px', border: `1px solid ${meta.color}40` }} />
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ color: meta.color, fontWeight: 600, fontSize: '14px' }}>{form.imageFile?.name || 'AI Generated Image'}</div>
                      <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', marginTop: '4px' }}>Click to change image</div>
                      <button onClick={e => { e.stopPropagation(); set('imageFile', null); set('imagePreview', null) }}
                        style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '12px', padding: 0 }}>
                        <X size={12} /> Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <Upload size={28} style={{ color: 'rgba(255,255,255,0.2)', marginBottom: '10px' }} />
                    <div><span style={{ color: meta.color }}>Click to upload</span> or drag and drop</div>
                    <div style={{ fontSize: '12px', marginTop: '4px' }}>PNG, JPG, WEBP — max 100MB</div>
                  </>
                )}
                <input id="main-image-input" type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleImageFile(e.target.files[0])} />
              </div>

            </>
          )}

          {/* ── Contact Info ── */}
          <div style={s.divider} />
          <p style={s.sectionTitle}>Contact Info</p>

          <label style={{ ...s.label, marginTop: '12px' }}>Contact Name <span style={s.req}>*</span></label>
          <input value={form.contactName} onChange={e => set('contactName', e.target.value)} placeholder="Your full name" style={s.input} />

          <label style={s.label}>Contact Email <span style={s.req}>*</span></label>
          <input type="email" value={form.contactEmail} onChange={e => set('contactEmail', e.target.value)} placeholder="Your email address" style={s.input} />

          <label style={s.label}>Contact Phone <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', fontWeight: 400 }}>(optional)</span></label>
          <input value={form.contactPhone} onChange={e => set('contactPhone', e.target.value)} placeholder="Your phone number" style={s.input} />

          {/* ── Publishing Settings ── */}
          <div style={s.divider} />
          <p style={s.sectionTitle}>Publishing Settings</p>

          {/* Post Now / Schedule toggle */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
            <button
              type="button"
              onClick={() => setPostNow(true)}
              style={{
                padding: '14px',
                background: postNow ? `${meta.color}18` : 'rgba(255,255,255,0.03)',
                border: `2px solid ${postNow ? meta.color : 'rgba(255,255,255,0.1)'}`,
                borderRadius: '12px', cursor: 'pointer',
                color: postNow ? meta.color : 'rgba(255,255,255,0.5)',
                fontSize: '14px', fontWeight: 700, transition: 'all 0.15s',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
              }}
            >
              <span style={{ fontSize: '20px' }}>⚡</span>
              Post Now
              <span style={{ fontSize: '11px', fontWeight: 400, color: 'inherit', opacity: 0.7 }}>Posts immediately</span>
            </button>
            <button
              type="button"
              onClick={() => setPostNow(false)}
              style={{
                padding: '14px',
                background: !postNow ? `${meta.color}18` : 'rgba(255,255,255,0.03)',
                border: `2px solid ${!postNow ? meta.color : 'rgba(255,255,255,0.1)'}`,
                borderRadius: '12px', cursor: 'pointer',
                color: !postNow ? meta.color : 'rgba(255,255,255,0.5)',
                fontSize: '14px', fontWeight: 700, transition: 'all 0.15s',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
              }}
            >
              <span style={{ fontSize: '20px' }}>🗓️</span>
              Schedule
              <span style={{ fontSize: '11px', fontWeight: 400, color: 'inherit', opacity: 0.7 }}>Pick date &amp; time</span>
            </button>
          </div>

          {!postNow && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '12px' }}>
              <div>
                <label style={{ ...s.label, marginTop: 0 }}>Schedule Date</label>
                <input type="date" value={form.postDate} onChange={e => set('postDate', e.target.value)} style={s.input} />
              </div>
              <div>
                <label style={{ ...s.label, marginTop: 0 }}>Schedule Time</label>
                <input type="time" value={form.postTime} onChange={e => set('postTime', e.target.value)} style={s.input} />
              </div>
            </div>
          )}

          {/* Platforms */}
          <label style={s.label}>Platforms to Post</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '4px' }}>
            {PLATFORM_OPTIONS.map(p => {
              const active = form.platforms.includes(p.key)
              return (
                <button
                  key={p.key}
                  onClick={() => togglePlatform(p.key)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '7px',
                    padding: '9px 16px',
                    background: active ? `${p.color}18` : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${active ? p.color + '55' : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: '10px', cursor: 'pointer',
                    color: active ? p.color : 'rgba(255,255,255,0.5)',
                    fontSize: '13px', fontWeight: 600,
                    transition: 'all 0.15s',
                  }}
                >
                  {active && <Check size={12} />}
                  {p.label}
                </button>
              )
            })}
          </div>

          {/* WhatsApp Recipients — shown only when WhatsApp platform is selected */}
          {form.platforms.includes('whatsapp') && (
            <div style={{ marginTop: 16, padding: '16px 20px', background: 'rgba(37,211,102,0.06)', border: '1px solid rgba(37,211,102,0.2)', borderRadius: 12 }}>
              <label style={{ ...s.label, color: '#25d366', marginTop: 0 }}>
                📱 WhatsApp Invitation Recipients
              </label>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginBottom: 8, marginTop: 2 }}>
                Paste phone numbers with country code, separated by commas.<br />
                Example: +919876543210, +918123456789, +971501234567
              </p>
              <textarea
                placeholder="+919876543210, +918123456789, +971501234567"
                value={form.whatsappRecipients}
                onChange={e => set('whatsappRecipients', e.target.value)}
                rows={3}
                style={{ ...s.input, resize: 'vertical', fontFamily: 'monospace', fontSize: 13 }}
              />
              <p style={{ color: 'rgba(37,211,102,0.6)', fontSize: 11, marginTop: 4 }}>
                ✓ Platform WhatsApp Business API will send invitation messages to each number
              </p>
            </div>
          )}

          {/* Error Banner */}
          <AnimatePresence>
            {submitError && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                style={{ marginTop: '20px', padding: '14px 16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '12px', display: 'flex', alignItems: 'flex-start', gap: '10px', color: '#f87171', fontSize: '14px' }}
              >
                <AlertCircle size={16} style={{ marginTop: 1, flexShrink: 0 }} />
                {submitError}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit */}
          <button onClick={handleSubmit} style={s.submitBtn} disabled={loading}>
            {loadingPhase === 'generating'
              ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Generating campaign content…</>
              : loadingPhase === 'posting'
              ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Sending to all platforms…</>
              : <>Generate &amp; Post Campaign <ArrowRight size={18} /></>
            }
          </button>
          <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: '13px', marginTop: '12px' }}>
            {postNow
              ? 'Content generated by AI · Posted instantly to all platforms via n8n'
              : 'Content generated by AI · Scheduled via n8n at your chosen date & time'}
          </p>
        </motion.div>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}