import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../hooks/useAuth.js";
import { fetchRewardPoolEgtBalance } from "../lib/egtRewardPoolBalance";
import { formatEgtBalanceDisplay } from "../lib/formatEgtBalance";
import { readEvokeUserWalletAddressFromDocument } from "../lib/evokeUserCookie";

function useWalletFromCookie(isLoggedIn) {
  const [walletAddress, setWalletAddress] = useState(null);

  const refresh = useCallback(() => {
    if (!isLoggedIn) {
      setWalletAddress(null);
      return;
    }
    setWalletAddress(readEvokeUserWalletAddressFromDocument());
  }, [isLoggedIn]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!isLoggedIn) return;
    const onFocus = () => refresh();
    const onVis = () => {
      if (document.visibilityState === "visible") refresh();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [isLoggedIn, refresh]);

  return { walletAddress, refreshWallet: refresh };
}

function marketplaceGratitudeUrl() {
  const base = (
    import.meta?.env?.VITE_MARKETPLACE_URL || "https://www.evokemarketplace.com"
  ).replace(/\/$/, "");
  return `${base}/GratitudeToken`;
}

const pillStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  maxWidth: "11rem",
  padding: "6px 14px",
  borderRadius: 999,
  border: "1px solid rgba(177,134,54,0.5)",
  background: "#7B6742",
  color: "#fff",
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
  boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
  fontFamily: "'Inter', sans-serif",
  transition: "transform 0.15s, filter 0.15s",
};

export default function EgtWalletHeader() {
  const { user } = useAuth();
  const isLoggedIn = !!user;
  const { walletAddress, refreshWallet } = useWalletFromCookie(isLoggedIn);
  const [balance, setBalance] = useState(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [hoverTooltip, setHoverTooltip] = useState(false);
  const anchorRef = useRef(null);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!walletAddress) {
      setBalance(null);
      return;
    }
    let cancelled = false;
    setBalanceLoading(true);
    fetchRewardPoolEgtBalance(walletAddress)
      .then((b) => {
        if (!cancelled) setBalance(typeof b === "number" ? b : 0);
      })
      .catch(() => {
        if (!cancelled) setBalance(0);
      })
      .finally(() => {
        if (!cancelled) setBalanceLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [walletAddress]);

  useLayoutEffect(() => {
    if (!hoverTooltip || !anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    setTooltipPos({
      top: rect.bottom + 8,
      left: rect.left + rect.width / 2,
    });
  }, [hoverTooltip]);

  if (!isLoggedIn || !walletAddress) return null;

  const displayBalance =
    balanceLoading || balance === null ? "…" : formatEgtBalanceDisplay(balance);

  const formatAddr = (addr) => `${addr.slice(0, 10)}…${addr.slice(-10)}`;

  const copyAddress = () => {
    navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const refreshBalance = () => {
    refreshWallet();
    if (!walletAddress) return;
    setBalanceLoading(true);
    fetchRewardPoolEgtBalance(walletAddress)
      .then(setBalance)
      .catch(() => setBalance(0))
      .finally(() => setBalanceLoading(false));
  };

  return (
    <>
      <div
        ref={anchorRef}
        style={{ position: "relative" }}
        onMouseEnter={() => setHoverTooltip(true)}
        onMouseLeave={() => setHoverTooltip(false)}
      >
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          style={pillStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.03)";
            e.currentTarget.style.filter = "brightness(1.05)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.filter = "none";
          }}
        >
          <span className="egt-coin-3d-root" style={{ width: 20, height: 20 }} aria-hidden="true">
            <span className="egt-coin-flip">
              <img
                src="/gratitude-token.png"
                alt=""
                width={20}
                height={20}
                className="egt-coin-face"
                draggable={false}
              />
            </span>
          </span>
          <span style={{ fontVariantNumeric: "tabular-nums", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {displayBalance} EGT
          </span>
        </button>
      </div>

      {hoverTooltip && typeof document !== "undefined"
        ? createPortal(
            <div
              style={{
                position: "fixed",
                zIndex: 10000,
                width: 200,
                maxWidth: "90vw",
                top: tooltipPos.top,
                left: tooltipPos.left,
                transform: "translateX(-50%)",
                borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.95)",
                padding: "12px 16px",
                fontSize: 14,
                color: "#1e293b",
                boxShadow: "0 12px 32px rgba(0,0,0,0.25)",
              }}
            >
              <p style={{ margin: 0, lineHeight: 1.4 }}>Unlock exclusive rewards and experiences</p>
              <a
                href={marketplaceGratitudeUrl()}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: "inline-block", marginTop: 8, fontWeight: 500, color: "#2563eb" }}
              >
                Learn more
              </a>
            </div>,
            document.body,
          )
        : null}

      {modalOpen && typeof document !== "undefined"
        ? createPortal(
            <div
              role="presentation"
              onClick={() => setModalOpen(false)}
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 9999,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 16,
                background: "rgba(0,0,0,0.5)",
                backdropFilter: "blur(4px)",
              }}
            >
              <div
                role="dialog"
                aria-labelledby="egt-wallet-title"
                onClick={(e) => e.stopPropagation()}
                style={{
                  width: "100%",
                  maxWidth: 420,
                  borderRadius: 16,
                  background: "#fff",
                  color: "#0f172a",
                  boxShadow: "0 24px 64px rgba(0,0,0,0.35)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "16px 20px",
                    borderBottom: "1px solid #e2e8f0",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span className="egt-coin-3d-root egt-coin-3d-root--lg" style={{ width: 36, height: 36 }} aria-hidden>
                      <span className="egt-coin-flip egt-coin-flip--ring-bronze">
                        <img
                          src="/gratitude-token.png"
                          alt=""
                          width={36}
                          height={36}
                          className="egt-coin-face"
                          draggable={false}
                        />
                      </span>
                    </span>
                    <h2 id="egt-wallet-title" style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>
                      EVOKE Wallet
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    aria-label="Close"
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      border: "none",
                      background: "transparent",
                      fontSize: 24,
                      color: "#64748b",
                      cursor: "pointer",
                    }}
                  >
                    ×
                  </button>
                </div>

                <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                      padding: "12px 16px",
                      borderRadius: 12,
                      border: "1px solid #e2e8f0",
                      background: "#f8fafc",
                    }}
                  >
                    <span style={{ fontFamily: "monospace", fontSize: 13, color: "#334155" }}>
                      {formatAddr(walletAddress)}
                    </span>
                    <button
                      type="button"
                      onClick={copyAddress}
                      style={{
                        flexShrink: 0,
                        padding: "8px 12px",
                        borderRadius: 8,
                        border: "none",
                        background: "#1b3b45",
                        color: "#fff",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      {copied ? "Copied!" : "Copy"}
                    </button>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "12px 16px",
                      borderRadius: 12,
                      border: "1px solid #e2e8f0",
                      background: "#f8fafc",
                      fontSize: 14,
                      fontWeight: 500,
                    }}
                  >
                    <span>Balance</span>
                    <span style={{ fontVariantNumeric: "tabular-nums" }}>
                      {balanceLoading || balance === null ? "…" : formatEgtBalanceDisplay(balance)} EGT
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={refreshBalance}
                    style={{
                      width: "100%",
                      padding: 0,
                      border: "none",
                      background: "none",
                      color: "#2563eb",
                      fontSize: 14,
                      fontWeight: 500,
                      cursor: "pointer",
                      textAlign: "center",
                    }}
                  >
                    Refresh balance
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
