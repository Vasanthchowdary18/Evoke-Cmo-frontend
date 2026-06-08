/** Client-side wallet address from the shared SSO `evoke_user` cookie. */

const COOKIE_NAME = "evoke_user";

/**
 * @returns {string|null} hex wallet from `data.walletAddress`, or null.
 */
export function readEvokeUserWalletAddressFromDocument() {
  if (typeof document === "undefined") return null;
  const row = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${COOKIE_NAME}=`));
  if (!row) return null;
  const raw = row.slice(COOKIE_NAME.length + 1);
  try {
    const parsed = JSON.parse(decodeURIComponent(raw));
    const data =
      parsed?.data && typeof parsed.data === "object" ? parsed.data : parsed;
    const w = data?.walletAddress ?? data?.WalletAddress;
    if (typeof w !== "string") return null;
    const trimmed = w.trim();
    if (!/^0x[a-fA-F0-9]{40}$/.test(trimmed)) return null;
    return trimmed;
  } catch {
    try {
      const parsed = JSON.parse(raw);
      const data =
        parsed?.data && typeof parsed.data === "object" ? parsed.data : parsed;
      const w = data?.walletAddress ?? data?.WalletAddress;
      if (typeof w !== "string") return null;
      const trimmed = w.trim();
      if (!/^0x[a-fA-F0-9]{40}$/.test(trimmed)) return null;
      return trimmed;
    } catch {
      return null;
    }
  }
}
