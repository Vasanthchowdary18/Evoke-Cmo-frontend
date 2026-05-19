import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, FileText, Sparkles, ChevronDown, Check, Copy, AlertCircle, Loader2, Key, Eye, EyeOff } from 'lucide-react'
import Navbar from '../components/Navbar.jsx'

const PRODUCT_CATEGORIES = [
  'Watch','Sunglasses','Handbag','Wallet','Belt','Jewellery','Ring','Necklace','Bracelet','Earrings',
  'Hat / Cap','Scarf','Shoes / Sneakers','Boots','T-Shirt','Jacket','Hoodie','Dress','Jeans','Saree','Kurta / Ethnic Wear',
  'Smartphone','Laptop','Tablet','Smartwatch','Wireless Earbuds / AirPods','Headphones','Bluetooth Speaker','Camera','Power Bank',
  'Perfume / Fragrance','Lipstick','Moisturizer / Serum','Face Wash','Sunscreen','Hair Dryer','Skincare Kit',
  'Sofa / Couch','Coffee Maker','Blender / Mixer','Air Fryer','Cookware Set','Water Bottle / Tumbler',
  'Yoga Mat','Dumbbells / Weights','Cricket Bat','Fitness Tracker','Protein Powder / Supplement',
  'Coffee / Tea','Chocolate / Candy','Snack / Chips','Wine / Beer','Packaged Food',
  'Backpack / Bag','Luggage / Suitcase','Candle','Gift Set','Book','Notebook / Journal','Other',
]

const GEMINI_TEXT_MODEL = 'gemini-2.0-flash'

async function generateDescription(apiKey, { name, category, features, price, audience, brand }) {
  const prompt = `You are an expert ecommerce copywriter. Generate complete product listing copy for this product:

Product Name: ${name}
Category: ${category}
Brand: ${brand || 'N/A'}
Price: ${price || 'N/A'}
Key Features: ${features}
Target Audience: ${audience || 'General consumers'}

Return ONLY valid JSON in this exact structure:
{
  "productTitle": "SEO-optimized product title (60-80 chars)",
  "marketingTagline": "Short punchy tagline (max 12 words)",
  "shortDescription": "2-3 sentence product summary for search results",
  "fullDescription": "Detailed 150-200 word marketing description",
  "bulletPoints": ["feature 1", "feature 2", "feature 3", "feature 4", "feature 5", "feature 6"],
  "altText": "Image alt text for accessibility and SEO (max 125 chars)",
  "metaTitle": "SEO meta title (max 60 chars)",
  "metaDescription": "SEO meta description (max 160 chars)",
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"]
}`

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_TEXT_MODEL}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    }
  )
  if (!res.ok) { const e = await res.json(); throw new Error(e?.error?.message || `API error ${res.status}`) }
  const data = await res.json()
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
  const clean = text.replace(/```json/gi,'').replace(/```/g,'').trim()
  const start = clean.indexOf('{'); const end = clean.lastIndexOf('}')
  if (start===-1||end===-1) throw new Error('Invalid response from AI. Please try again.')
  return JSON.parse(clean.slice(start, end+1))
}

function useCopy() {
  const [copied, setCopied] = useState(null)
  const copy = (text, id) => {
    navigator.clipboard.writeText(text).then(() => { setCopied(id); setTimeout(() => setCopied(null), 2000) })
  }
  return { copied, copy }
}

const S = {
  label: { display:'block', fontSize:'10px', color:'rgba(255,255,255,0.4)', marginTop:'18px', marginBottom:'7px', letterSpacing:'1px', fontWeight:700, textTransform:'uppercase' },
  input: { width:'100%', padding:'11px 14px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'10px', color:'#fff', fontSize:'13px', boxSizing:'border-box', outline:'none' },
}
const C = '#06b6d4'

function OutputCard({ title, value, id, copied, copy, children }) {
  if (!value && !children) return null
  return (
    <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'12px',overflow:'hidden',marginBottom:'12px'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 16px',borderBottom:'1px solid rgba(255,255,255,0.06)',background:'rgba(255,255,255,0.02)'}}>
        <span style={{fontSize:'12px',fontWeight:700,color:'rgba(255,255,255,0.5)',letterSpacing:'0.05em',textTransform:'uppercase'}}>{title}</span>
        {value&&<button onClick={()=>copy(value,id)} style={{display:'flex',alignItems:'center',gap:'5px',padding:'5px 10px',background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'6px',color:copied===id?'#4ade80':'rgba(255,255,255,0.5)',fontSize:'11px',cursor:'pointer',fontWeight:600}}>
          <Copy size={11}/>{copied===id?'Copied!':'Copy'}
        </button>}
      </div>
      <div style={{padding:'14px 16px'}}>
        {children||<p style={{color:'rgba(255,255,255,0.75)',fontSize:'14px',lineHeight:1.75,whiteSpace:'pre-wrap',margin:0}}>{value}</p>}
      </div>
    </div>
  )
}

export default function ProductDescription() {
  const navigate = useNavigate()
  const { copied, copy } = useCopy()
  const [apiKey, setApiKey]       = useState(() => localStorage.getItem('gemini_api_key') || import.meta.env.VITE_GEMINI_API_KEY || '')
  const [showKey, setShowKey]     = useState(false)
  const [category, setCategory]   = useState('')
  const [catSearch, setCatSearch] = useState('')
  const [catOpen, setCatOpen]     = useState(false)
  const [form, setForm]           = useState({ name:'', features:'', price:'', audience:'', brand:'' })
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [result, setResult]       = useState(null)

  const set = (k,v) => setForm(p=>({...p,[k]:v}))
  const filtered = PRODUCT_CATEGORIES.filter(c => c.toLowerCase().includes(catSearch.toLowerCase()))

  const handleGenerate = async () => {
    setError('')
    if (!apiKey.trim())       return setError('Enter your Gemini API key.')
    if (!form.name.trim())    return setError('Enter the product name.')
    if (!category)            return setError('Select a product category.')
    if (!form.features.trim()) return setError('Enter at least one key feature.')
    localStorage.setItem('gemini_api_key', apiKey)
    setLoading(true); setResult(null)
    try {
      const r = await generateDescription(apiKey, { ...form, category })
      setResult(r)
    } catch(e) { setError(e.message) }
    finally { setLoading(false) }
  }

  return (
    <div style={{minHeight:'100vh',background:'#0a0a0a',color:'#fff'}}>
      <Navbar/>
      <div style={{maxWidth:1200,margin:'0 auto',padding:'108px 24px 80px'}}>
        <button onClick={()=>navigate('/products')} style={{display:'flex',alignItems:'center',gap:'6px',background:'none',border:'none',color:'rgba(255,255,255,0.45)',fontSize:'14px',cursor:'pointer',marginBottom:'32px',padding:0}}>
          <ArrowLeft size={15}/> Back to Products
        </button>

        <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} style={{marginBottom:'36px'}}>
          <div style={{display:'inline-flex',alignItems:'center',gap:'6px',padding:'4px 12px',background:`${C}18`,border:`1px solid ${C}30`,borderRadius:'100px',fontSize:'11px',fontWeight:700,color:C,letterSpacing:'0.06em',marginBottom:'14px'}}>
            <Sparkles size={11}/> AI COPY TOOL
          </div>
          <h1 style={{fontSize:'clamp(24px,4vw,38px)',fontWeight:900,letterSpacing:'-0.025em',marginBottom:'8px'}}>
            Product Description → <span style={{color:C}}>Ecommerce Copy</span>
          </h1>
          <p style={{color:'rgba(255,255,255,0.45)',fontSize:'15px'}}>Generate titles, descriptions, bullet points, SEO tags and more from your product details</p>
        </motion.div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'24px',alignItems:'start'}}>
          {/* LEFT */}
          <motion.div initial={{opacity:0,x:-20}} animate={{opacity:1,x:0}} transition={{delay:0.1}}
            style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'18px',padding:'28px'}}>

            <label style={{...S.label,marginTop:0}}><Key size={10} style={{display:'inline',marginRight:4}}/>Gemini API Key</label>
            <div style={{position:'relative'}}>
              <input type={showKey?'text':'password'} value={apiKey} onChange={e=>setApiKey(e.target.value)} placeholder="AIza..." style={{...S.input,paddingRight:'40px'}}/>
              <button onClick={()=>setShowKey(v=>!v)} style={{position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'rgba(255,255,255,0.4)',display:'flex'}}>
                {showKey?<EyeOff size={14}/>:<Eye size={14}/>}
              </button>
            </div>

            <label style={S.label}>Product Name *</label>
            <input value={form.name} onChange={e=>set('name',e.target.value)} placeholder="e.g. ProGrip X1 Wireless Earbuds" style={S.input}/>

            <label style={S.label}>Category *</label>
            <div style={{position:'relative'}}>
              <button onClick={()=>setCatOpen(v=>!v)} style={{...S.input,textAlign:'left',display:'flex',alignItems:'center',justifyContent:'space-between',cursor:'pointer',background:'rgba(255,255,255,0.05)'}}>
                <span style={{color:category?'#fff':'rgba(255,255,255,0.3)'}}>{category||'— select category —'}</span>
                <ChevronDown size={14} style={{color:'rgba(255,255,255,0.4)',flexShrink:0}}/>
              </button>
              <AnimatePresence>
                {catOpen&&(
                  <motion.div initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}}
                    style={{position:'absolute',top:'110%',left:0,right:0,zIndex:100,background:'#1a1a2e',border:`1px solid ${C}25`,borderRadius:'12px',overflow:'hidden',boxShadow:'0 16px 40px rgba(0,0,0,0.6)'}}>
                    <div style={{padding:'10px'}}>
                      <input autoFocus value={catSearch} onChange={e=>setCatSearch(e.target.value)} placeholder="Search…" style={{...S.input,margin:0,fontSize:'13px'}}/>
                    </div>
                    <div style={{maxHeight:'200px',overflowY:'auto'}}>
                      {filtered.map(cat=>(
                        <button key={cat} onClick={()=>{setCategory(cat);setCatOpen(false);setCatSearch('')}}
                          style={{width:'100%',padding:'10px 16px',background:category===cat?`${C}12`:'none',border:'none',cursor:'pointer',color:category===cat?C:'rgba(255,255,255,0.7)',fontSize:'13px',textAlign:'left',display:'flex',alignItems:'center',gap:'8px'}}
                          onMouseEnter={e=>{if(category!==cat)e.currentTarget.style.background='rgba(255,255,255,0.05)'}}
                          onMouseLeave={e=>{if(category!==cat)e.currentTarget.style.background='none'}}>
                          {category===cat&&<Check size={12}/>}{cat}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <label style={S.label}>Brand Name</label>
            <input value={form.brand} onChange={e=>set('brand',e.target.value)} placeholder="e.g. Sony, Nike, local brand…" style={S.input}/>

            <label style={S.label}>Key Features *</label>
            <textarea value={form.features} onChange={e=>set('features',e.target.value)} placeholder="List the main features, materials, specs…" style={{...S.input,minHeight:'90px',resize:'vertical'}}/>

            <label style={S.label}>Price</label>
            <input value={form.price} onChange={e=>set('price',e.target.value)} placeholder="e.g. ₹2,499 / $29.99" style={S.input}/>

            <label style={S.label}>Target Audience</label>
            <input value={form.audience} onChange={e=>set('audience',e.target.value)} placeholder="e.g. Fitness enthusiasts, college students…" style={S.input}/>

            <AnimatePresence>
              {error&&<motion.div initial={{opacity:0,y:-6}} animate={{opacity:1,y:0}} exit={{opacity:0}} style={{marginTop:'14px',padding:'12px 14px',background:'rgba(239,68,68,0.08)',border:'1px solid rgba(239,68,68,0.25)',borderRadius:'10px',display:'flex',gap:'8px',color:'#f87171',fontSize:'13px'}}>
                <AlertCircle size={14} style={{marginTop:1,flexShrink:0}}/>{error}
              </motion.div>}
            </AnimatePresence>

            <button onClick={handleGenerate} disabled={loading} style={{width:'100%',marginTop:'20px',padding:'14px',background:loading?`${C}25`:`linear-gradient(135deg,${C},#0891b2)`,border:'none',borderRadius:'12px',color:loading?'rgba(255,255,255,0.4)':'#fff',fontSize:'15px',fontWeight:700,cursor:loading?'not-allowed':'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:'8px'}}>
              {loading?<><Loader2 size={16} style={{animation:'spin 1s linear infinite'}}/> Generating copy…</>:<><FileText size={16}/> Generate Ecommerce Copy</>}
            </button>
          </motion.div>

          {/* RIGHT */}
          <motion.div initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} transition={{delay:0.15}}
            style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'18px',padding:'28px'}}>

            <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'22px'}}>
              <div style={{width:36,height:36,borderRadius:'10px',background:`${C}15`,border:`1px solid ${C}30`,display:'flex',alignItems:'center',justifyContent:'center'}}>
                <FileText size={16} style={{color:C}}/>
              </div>
              <div>
                <h3 style={{fontSize:'16px',fontWeight:700,margin:0}}>Generated Copy</h3>
                <p style={{color:'rgba(255,255,255,0.35)',fontSize:'12px',margin:0}}>{result?'Ready to use':'Fill the form and generate'}</p>
              </div>
            </div>

            {!result&&!loading&&(
              <div style={{padding:'60px 20px',textAlign:'center',border:'1px dashed rgba(255,255,255,0.07)',borderRadius:'12px'}}>
                <FileText size={32} style={{color:'rgba(255,255,255,0.1)',marginBottom:'12px'}}/>
                <p style={{color:'rgba(255,255,255,0.25)',fontSize:'14px'}}>Your ecommerce copy will appear here</p>
              </div>
            )}
            {loading&&(
              <div style={{padding:'60px 20px',textAlign:'center',border:`1px dashed ${C}25`,borderRadius:'12px'}}>
                <Loader2 size={32} style={{color:C,marginBottom:'12px',animation:'spin 1s linear infinite'}}/>
                <p style={{color:C,fontSize:'14px',fontWeight:600}}>Writing your product copy…</p>
              </div>
            )}

            {result&&(
              <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}}>
                <OutputCard title="Product Title" value={result.productTitle} id="title" copied={copied} copy={copy}/>
                <OutputCard title="Marketing Tagline" value={result.marketingTagline} id="tagline" copied={copied} copy={copy}/>
                <OutputCard title="Short Description" value={result.shortDescription} id="short" copied={copied} copy={copy}/>
                <OutputCard title="Full Description" value={result.fullDescription} id="full" copied={copied} copy={copy}/>
                <OutputCard title="Bullet Points" id="bullets" copied={copied} copy={copy} value={result.bulletPoints?.join('\n• ')}>
                  <ul style={{margin:0,padding:'0 0 0 16px'}}>
                    {result.bulletPoints?.map((b,i)=>(
                      <li key={i} style={{color:'rgba(255,255,255,0.75)',fontSize:'14px',lineHeight:1.8,marginBottom:'4px'}}>{b}</li>
                    ))}
                  </ul>
                </OutputCard>
                <OutputCard title="Image Alt Text" value={result.altText} id="alt" copied={copied} copy={copy}/>
                <OutputCard title="Meta Title" value={result.metaTitle} id="metaTitle" copied={copied} copy={copy}/>
                <OutputCard title="Meta Description" value={result.metaDescription} id="metaDesc" copied={copied} copy={copy}/>
                <OutputCard title="Keywords" id="keywords" copied={copied} copy={copy} value={result.keywords?.join(', ')}>
                  <div style={{display:'flex',flexWrap:'wrap',gap:'6px'}}>
                    {result.keywords?.map((k,i)=>(
                      <span key={i} style={{padding:'4px 10px',background:`${C}12`,border:`1px solid ${C}25`,borderRadius:'100px',fontSize:'12px',color:C,fontWeight:600}}>{k}</span>
                    ))}
                  </div>
                </OutputCard>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
