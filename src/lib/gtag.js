// Google Ads conversion tracking helpers
// Replace AW-XXXXXXXXXX with your Google Ads Conversion ID (from Google Ads → Tools → Conversions)

const GA_ID = import.meta.env.VITE_GOOGLE_ADS_ID || 'AW-XXXXXXXXXX'

export function gtagEvent(eventName, params = {}) {
  if (typeof window === 'undefined' || !window.gtag) return
  window.gtag('event', eventName, params)
}

// Fire this when a user completes a purchase (token buy)
export function trackPurchase({ value, currency = 'INR', transactionId }) {
  gtagEvent('conversion', {
    send_to: `${GA_ID}/${import.meta.env.VITE_GOOGLE_ADS_PURCHASE_LABEL || 'PURCHASE_LABEL'}`,
    value,
    currency,
    transaction_id: transactionId,
  })
}

// Fire this when a user signs up for the first time
export function trackSignup() {
  gtagEvent('conversion', {
    send_to: `${GA_ID}/${import.meta.env.VITE_GOOGLE_ADS_SIGNUP_LABEL || 'SIGNUP_LABEL'}`,
  })
}
