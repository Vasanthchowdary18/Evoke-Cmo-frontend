import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { auth, googleProvider, facebookProvider, signInWithPopup } from "../firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { getOrCreateUser } from "../services/userService";

const friendlyError = (code) => {
  const map = {
    "auth/email-already-in-use": "An account with this email already exists.",
    "auth/invalid-email": "Please enter a valid email address.",
    "auth/user-not-found": "No account found with this email.",
    "auth/wrong-password": "Incorrect password. Please try again.",
    "auth/weak-password": "Password must be at least 6 characters.",
    "auth/popup-closed-by-user": "Sign-in popup was closed. Please try again.",
    "auth/popup-blocked":
      "Popup was blocked. Please allow popups for this site.",
    "auth/account-exists-with-different-credential":
      "An account already exists with this email using a different method.",
    "auth/cancelled-popup-request": "",
    "auth/network-request-failed":
      "Network error. Check your connection and try again.",
    "auth/unauthorized-domain":
      "This domain is not authorised. Add it in Firebase Console → Authentication → Settings.",
    "auth/internal-error": "Authentication error. Please try again.",
  };
  return map[code] || `Something went wrong (${code}). Please try again.`;
};

export default function SignIn() {
  const [mode, setMode] = useState("signin");
  const [form, setForm] = useState({ fullName: "", email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState(null);
  const [authError, setAuthError] = useState("");
  const navigate = useNavigate();
  const isSignUp = mode === "signup";

  const validate = () => {
    const e = {};
    if (isSignUp && !form.fullName.trim()) e.fullName = "Full name is required";
    if (!form.email) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email))
      e.email = "Enter a valid email address";
    if (!form.password) e.password = "Password is required";
    else if (form.password.length < 6)
      e.password = "Password must be at least 6 characters";
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setAuthError("");
    setLoading(true);
    try {
      if (isSignUp) {
        const cred = await createUserWithEmailAndPassword(
          auth,
          form.email,
          form.password,
        );
        await updateProfile(cred.user, { displayName: form.fullName.trim() });
        await getOrCreateUser(cred.user.uid, form.fullName.trim(), form.email);
        navigate("/agents-hub");
      } else {
        const cred2 = await signInWithEmailAndPassword(auth, form.email, form.password);
        await getOrCreateUser(cred2.user.uid, cred2.user.displayName, cred2.user.email);
        navigate("/agents-hub");
      }
    } catch (err) {
      setAuthError(friendlyError(err.code));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setAuthError("");
    setSocialLoading("google");
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const u = result.user;
      await getOrCreateUser(u.uid, u.displayName, u.email);
      navigate("/agents-hub");
    } catch (err) {
      const msg = friendlyError(err.code);
      if (msg) setAuthError(msg);
    } finally {
      setSocialLoading(null);
    }
  };

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    if (errors[e.target.name])
      setErrors((er) => ({ ...er, [e.target.name]: "" }));
    if (authError) setAuthError("");
  };

  const handleFacebook = async () => {
    setAuthError("");
    setSocialLoading("facebook");
    try {
      const result = await signInWithPopup(auth, facebookProvider);
      const u = result.user;
      const data = await getOrCreateUser(u.uid, u.displayName, u.email);
      navigate(data.onboardingComplete ? "/dashboard" : "/");
    } catch (err) {
      const msg = friendlyError(err.code);
      if (msg) setAuthError(msg);
    } finally {
      setSocialLoading(null);
    }
  };

  const switchMode = (next) => {
    setMode(next);
    setForm({ fullName: "", email: "", password: "" });
    setErrors({});
    setAuthError("");
    setShowPass(false);
  };

  const labelStyle = { color: "rgba(255,255,255,0.55)", fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 };
  const inputStyle = { width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "11px 12px", color: "white", fontSize: 13, outline: "none" };
  const iconStyle = { position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)", pointerEvents: "none" };
  const errStyle = { color: "#fca5a5", fontSize: 11, marginTop: 4, display: "block" };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0e0c09",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "32px 24px",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Background glows */}
      <div style={{ position: "absolute", top: -200, left: "50%", transform: "translateX(-50%)", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(200,151,62,0.13) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: -150, right: -100, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(200,151,62,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)",
        backgroundSize: "60px 60px",
        maskImage: "radial-gradient(ellipse 80% 80% at 50% 40%, black 20%, transparent 100%)",
        pointerEvents: "none",
      }} />

      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 460 }}>
        {/* Logo */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          style={{ textAlign: "center", marginBottom: 36 }}
        >
          <Link to="/" style={{ textDecoration: "none", display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <img src="/evoke-logo.png" alt="EVOKE" style={{ height: 30, width: 'auto', objectFit: 'contain', display: 'block' }} />
              <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 11px 5px 8px", background: "#0a0805", border: "1px solid rgba(200,151,62,0.32)", borderRadius: 100, boxShadow: '0 0 0 1px rgba(0,0,0,0.6) inset' }}>
                <Zap size={11} color="#c8973e" fill="#c8973e" />
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.09em", color: "#c8973e" }}>CMO</span>
              </div>
            </div>
          </Link>
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 14, marginTop: 8 }}>Your AI-powered Chief Marketing Officer</p>
        </motion.div>

        {/* Card */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.1 }}
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.09)",
            borderRadius: 24, padding: 40,
            backdropFilter: "blur(24px)",
            boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
          }}
        >
          {/* Mode toggle */}
          <div style={{ display: "flex", background: "rgba(255,255,255,0.05)", borderRadius: 14, padding: 4, marginBottom: 28 }}>
            {["signin", "signup"].map((m) => (
              <button key={m} type="button" onClick={() => switchMode(m)} style={{
                flex: 1, padding: 11, borderRadius: 11, border: "none", cursor: "pointer",
                fontSize: 14, fontWeight: 600, transition: "all 0.25s",
                background: mode === m ? "linear-gradient(135deg, #d4a853, #b8803a)" : "transparent",
                color: mode === m ? "white" : "rgba(255,255,255,0.4)",
                boxShadow: mode === m ? "0 2px 14px rgba(200,151,62,0.4)" : "none",
              }}>
                {m === "signin" ? "Sign In" : "Create Account"}
              </button>
            ))}
          </div>

          {/* Heading */}
          <AnimatePresence mode="wait">
            <motion.div key={mode} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }} style={{ marginBottom: 24 }}
            >
              <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.025em", color: "white", marginBottom: 6 }}>
                {isSignUp ? "Create your account" : "Welcome back"}
              </h1>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>
                {isSignUp ? "Start generating AI-powered campaigns today" : "Sign in to continue to your dashboard"}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Auth error */}
          <AnimatePresence>
            {authError && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
                  borderRadius: 12, padding: "12px 16px", marginBottom: 20,
                  color: "#fca5a5", fontSize: 13,
                }}
              >
                <AlertCircle size={15} style={{ flexShrink: 0 }} /> {authError}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Social buttons */}
          <div style={{ display: "flex", gap: 10, marginBottom: 22 }}>
            <button type="button" onClick={handleGoogle} disabled={!!socialLoading || loading}
              style={{
                flex: 1, padding: "12px 16px", display: "flex", alignItems: "center",
                justifyContent: "center", gap: 9,
                background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 12, cursor: "pointer", color: "white",
                fontSize: 14, fontWeight: 500, transition: "all 0.2s",
                opacity: (socialLoading === "facebook" || loading) ? 0.5 : 1,
              }}
              onMouseEnter={e => { if (!socialLoading && !loading) e.currentTarget.style.background = "rgba(255,255,255,0.1)" }}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
            >
              {socialLoading === "google"
                ? <div style={{ width: 18, height: 18, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "signinSpin 0.8s linear infinite" }} />
                : <svg width="18" height="18" viewBox="0 0 18 18">
                    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
                    <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                  </svg>
              }
              {socialLoading === "google" ? "Connecting..." : "Google"}
            </button>

            <button type="button" onClick={handleFacebook} disabled={!!socialLoading || loading}
              style={{
                flex: 1, padding: "12px 16px", display: "flex", alignItems: "center",
                justifyContent: "center", gap: 9,
                background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 12, cursor: "pointer", color: "white",
                fontSize: 14, fontWeight: 500, transition: "all 0.2s",
                opacity: (socialLoading === "google" || loading) ? 0.5 : 1,
              }}
              onMouseEnter={e => { if (!socialLoading && !loading) e.currentTarget.style.background = "rgba(255,255,255,0.1)" }}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
            >
              {socialLoading === "facebook"
                ? <div style={{ width: 18, height: 18, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "signinSpin 0.8s linear infinite" }} />
                : <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2">
                    <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
                  </svg>
              }
              {socialLoading === "facebook" ? "Connecting..." : "Facebook"}
            </button>
          </div>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22 }}>
            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", whiteSpace: "nowrap" }}>or continue with email</span>
            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <AnimatePresence>
              {isSignUp && (
                <motion.div key="fullName" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.22 }}
                  style={{ overflow: "hidden" }}
                >
                  <label style={labelStyle}>Full name *</label>
                  <div style={{ position: "relative" }}>
                    <User size={15} style={iconStyle} />
                    <input type="text" name="fullName" value={form.fullName} onChange={handleChange}
                      placeholder="Your full name" autoComplete="name"
                      style={{ ...inputStyle, paddingLeft: 40, borderColor: errors.fullName ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)" }} />
                  </div>
                  {errors.fullName && <span style={errStyle}>{errors.fullName}</span>}
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label style={labelStyle}>Email address *</label>
              <div style={{ position: "relative" }}>
                <Mail size={15} style={iconStyle} />
                <input type="email" name="email" value={form.email} onChange={handleChange}
                  placeholder="you@company.com" autoComplete="email"
                  style={{ ...inputStyle, paddingLeft: 40, borderColor: errors.email ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)" }} />
              </div>
              {errors.email && <span style={errStyle}>{errors.email}</span>}
            </div>

            <div>
              <label style={labelStyle}>Password *</label>
              <div style={{ position: "relative" }}>
                <Lock size={15} style={iconStyle} />
                <input type={showPass ? "text" : "password"} name="password" value={form.password} onChange={handleChange}
                  placeholder={isSignUp ? "Create a password (min 6 chars)" : "Your password"}
                  autoComplete={isSignUp ? "new-password" : "current-password"}
                  style={{ ...inputStyle, paddingLeft: 40, paddingRight: 44, borderColor: errors.password ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)" }} />
                <button type="button" onClick={() => setShowPass(s => !s)} style={{ position: "absolute", right: 13, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)", padding: 0 }}>
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && <span style={errStyle}>{errors.password}</span>}
            </div>

            <button type="submit" disabled={loading || !!socialLoading}
              style={{
                width: "100%", padding: 15,
                background: "linear-gradient(135deg, #d4a853, #b8803a)",
                color: "white", border: "none", borderRadius: 12,
                fontSize: 15, fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                marginTop: 4, opacity: loading ? 0.7 : 1,
                boxShadow: "0 4px 18px rgba(200,151,62,0.4)",
                transition: "opacity 0.2s",
              }}
            >
              {loading
                ? <><div style={{ width: 18, height: 18, border: "2px solid rgba(255,255,255,0.35)", borderTopColor: "white", borderRadius: "50%", animation: "signinSpin 0.8s linear infinite" }} />{isSignUp ? "Creating account..." : "Signing in..."}</>
                : <>{isSignUp ? "Create Account" : "Sign In"} <ArrowRight size={15} /></>
              }
            </button>
          </form>

          <div style={{ marginTop: 22, paddingTop: 20, borderTop: "1px solid rgba(255,255,255,0.07)", textAlign: "center" }}>
            <p style={{ color: "rgba(255,255,255,0.38)", fontSize: 14 }}>
              {isSignUp ? "Already have an account? " : "Don't have an account? "}
              <button type="button" onClick={() => switchMode(isSignUp ? "signin" : "signup")} style={{ background: "none", border: "none", cursor: "pointer", color: "#e8c47a", fontWeight: 600, fontSize: 14, padding: 0 }}>
                {isSignUp ? "Sign in instead" : "Create an account"}
              </button>
            </p>
          </div>
        </motion.div>

        {/* Back link */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}
          style={{ textAlign: "center", marginTop: 24 }}
        >
          <Link to="/" style={{ color: "rgba(255,255,255,0.3)", textDecoration: "none", fontSize: 14, transition: "color 0.2s" }}
            onMouseEnter={e => e.target.style.color = "rgba(255,255,255,0.7)"}
            onMouseLeave={e => e.target.style.color = "rgba(255,255,255,0.3)"}
          >
            ← Back to homepage
          </Link>
        </motion.div>
      </div>

      <style>{`@keyframes signinSpin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
