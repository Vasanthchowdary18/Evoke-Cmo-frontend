/** BSC testnet reward pool — same as evoke_events / evoke_frontend */
const DEFAULT_REWARD_POOL = "0x079Cd37c9939049b0EA13Bc0f39E241a09e489A4";
const DEFAULT_RPC = "https://data-seed-prebsc-1-s1.binance.org:8545";
const CUSTOMERS_SELECTOR = "0x336989ae";

function encodeCustomersCall(walletAddress) {
  const addr = walletAddress.trim().toLowerCase().replace(/^0x/, "");
  return `${CUSTOMERS_SELECTOR}${addr.padStart(64, "0")}`;
}

/**
 * EGT balance for a wallet from the on-chain reward pool `customers` mapping.
 * Uses JSON-RPC `eth_call` (no web3 dependency).
 * @param {string} walletAddress
 * @returns {Promise<number>}
 */
export async function fetchRewardPoolEgtBalance(walletAddress) {
  if (!walletAddress || typeof walletAddress !== "string") return 0;
  if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress.trim())) return 0;

  const rpc =
    String(import.meta?.env?.VITE_EGT_RPC_URL || "").trim() || DEFAULT_RPC;
  const pool =
    String(import.meta?.env?.VITE_EGT_REWARD_POOL_ADDRESS || "").trim() ||
    DEFAULT_REWARD_POOL;

  const res = await fetch(rpc, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "eth_call",
      params: [
        {
          to: pool,
          data: encodeCustomersCall(walletAddress),
        },
        "latest",
      ],
    }),
  });

  if (!res.ok) return 0;

  const json = await res.json();
  const hex = json?.result;
  if (!hex || typeof hex !== "string" || hex === "0x") return 0;

  // `customers(address)` returns (uint256 balance, bool canWithdraw) — two 32-byte
  // words. We must read only the first word; parsing the full hex combines balance
  // with canWithdraw and produces wildly incorrect values.
  const body = hex.startsWith("0x") ? hex.slice(2) : hex;
  if (body.length < 64) return 0;

  const balanceWord = body.slice(0, 64);
  const raw = BigInt(`0x${balanceWord}`);
  const n = Number(raw) / 1e18;
  return Number.isFinite(n) && n >= 0 ? n : 0;
}
