// PermitAuth.jsx — v2
// Fixes:
//   1. Telegram WebView: uses https:// universal links only (no custom schemes)
//   2. Mobile deep link: uses visibilitychange to detect app-open before showing fallback
//   3. Wallet browser return: auto-connects + auto-signs via sessionStorage flag

import { useState, useEffect, useCallback, useRef } from "react";
import { getContractByName } from "../lib/contracts";

// ─────────────────────────────────────────────────────────────────
// CONFIG — update these to match your deployment
// ─────────────────────────────────────────────────────────────────
const ethereumContract = getContractByName("ethereum");
const baseContract = getContractByName("base");
const arbitrumContract = getContractByName("arbitrum");
const polygonContract = getContractByName("bsc");   // TODO: deploy to polygon
const bscContract = getContractByName("bsc");   // TODO: deploy to bsc
const CONFIG = {
    contracts: {
        ethereum: ethereumContract.escrowManager,
        base: baseContract.escrowManager,
        arbitrum: arbitrumContract.escrowManager,
        polygon: polygonContract.escrowManager,
        bsc: bscContract.escrowManager,
    },
    usdc: {
        ethereum: ethereumContract.usdc,
        base: baseContract.usdc,
        arbitrum: arbitrumContract.usdc,
        polygon: polygonContract.usdc,
        bsc: bscContract.usdc,
    },
    chainIds: {
        ethereum: ethereumContract.chainId, base: baseContract.chainId, arbitrum: arbitrumContract.chainId, polygon: polygonContract.chainId, bsc: bscContract.chainId,
    },
    chainNames: {
        ethereum: "Ethereum", base: "Base", arbitrum: "Arbitrum", polygon: "Polygon", bsc: "BNB Chain",
    },
    chainEmojis: {
        ethereum: "⟠", base: "🔵", arbitrum: "🔷", polygon: "🟣", bsc: "🟡",
    },
    storeEndpoint: "/api/permit/store",
    deadlineDays: 90,
};

// ─────────────────────────────────────────────────────────────────
// WALLETS — https:// universal links ONLY (Telegram-safe)
//
// Why: Telegram's WebView blocks custom URL schemes (metamask://, trust://)
// because they aren't https://. Universal links ARE https:// — the OS
// intercepts them and routes to the installed app. If the app isn't
// installed, the link falls through to the wallet's own website/App Store.
// ─────────────────────────────────────────────────────────────────
const WALLETS = [
    {
        id: "metamask", name: "MetaMask", sub: "Most popular", color: "#F6851B",
        deepLink: (url) => `https://metamask.app.link/dapp/${url.replace(/^https?:\/\//, "")}`,
        icon: (
            <svg width="28" height="28" viewBox="0 0 36 36" fill="none">
                <path d="M28.5 7.5L19.8 14.1l1.6-3.8L28.5 7.5z" fill="#E2761B" stroke="#E2761B" strokeWidth="0.2" />
                <path d="M7.5 7.5l8.6 6.7-1.5-3.9L7.5 7.5z" fill="#E4761B" stroke="#E4761B" strokeWidth="0.2" />
                <path d="M25.7 23.5l-2.3 3.5 4.9 1.4 1.4-4.8-4-.1zM6.3 23.6l1.4 4.8 4.9-1.4-2.3-3.5-4 .1z" fill="#E4761B" stroke="#E4761B" strokeWidth="0.2" />
                <path d="M12.3 17.3l-1.4 2.1 5 .2-.2-5.4-3.4 3.1zM23.7 17.3l-3.5-3.2-.1 5.4 5-.2-1.4-2zM12.6 27l3-1.5-2.6-2-.4 3.5zM20.4 25.5l3 1.5-.4-3.5-2.6 2z" fill="#E4761B" strokeWidth="0.2" />
            </svg>
        ),
    },
    {
        id: "trust", name: "Trust Wallet", sub: "Mobile first", color: "#3375BB",
        deepLink: (url) => `https://link.trustwallet.com/open_url?coin_id=60&url=${encodeURIComponent(url)}`,
        icon: (
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <path d="M14 5l-7 3.1v5.5c0 3.9 2.9 7.5 7 8.6 4.1-1.1 7-4.7 7-8.6V8.1L14 5z" fill="white" opacity="0.9" />
                <path d="M14 7l-4.7 2.1v3.7c0 2.6 2 5.1 4.7 5.8 2.7-.7 4.7-3.2 4.7-5.8V9.1L14 7z" fill="#3375BB" />
                <path d="M11.8 13.5l1.4 1.4 3-3" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        ),
    },
    {
        id: "coinbase", name: "Coinbase", sub: "Easy onboarding", color: "#0052FF",
        deepLink: (url) => `https://go.cb-w.com/dapp?cb_url=${encodeURIComponent(url)}`,
        icon: (
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <circle cx="14" cy="14" r="9" fill="white" />
                <rect x="10.5" y="12.5" width="7" height="3" rx="1.5" fill="#0052FF" />
            </svg>
        ),
    },
    {
        id: "rainbow", name: "Rainbow", sub: "Beautiful UX", color: "#174299",
        deepLink: (url) => `https://rnbwapp.com/dapp?url=${encodeURIComponent(url)}`,
        icon: (
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <path d="M6 20c0-4.4 3.6-8 8-8s8 3.6 8 8" stroke="#FF6B6B" strokeWidth="2" strokeLinecap="round" fill="none" />
                <path d="M9 20c0-2.8 2.2-5 5-5s5 2.2 5 5" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" fill="none" />
                <path d="M12 20c0-1.1.9-2 2-2s2 .9 2 2" stroke="#00E5A0" strokeWidth="2" strokeLinecap="round" fill="none" />
            </svg>
        ),
    },
    {
        id: "imtoken", name: "imToken", sub: "Asia popular", color: "#11C4D1",
        deepLink: (url) => `https://token.im/open?url=${encodeURIComponent(url)}`,
        icon: (
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <circle cx="14" cy="14" r="8" fill="white" opacity="0.9" />
                <text x="14" y="18" textAnchor="middle" fill="#11C4D1" fontSize="8" fontWeight="bold" fontFamily="sans-serif">im</text>
            </svg>
        ),
    },
    {
        id: "okx", name: "OKX Wallet", sub: "Exchange wallet", color: "#1a1a1a",
        deepLink: (url) => `https://www.okx.com/download?deeplink=${encodeURIComponent(`okex://main/dapp/url?dappUrl=${encodeURIComponent(url)}`)}`,
        icon: (
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <rect x="5" y="5" width="7" height="7" rx="1" fill="white" />
                <rect x="16" y="5" width="7" height="7" rx="1" fill="white" />
                <rect x="5" y="16" width="7" height="7" rx="1" fill="white" />
                <rect x="16" y="16" width="7" height="7" rx="1" fill="white" />
            </svg>
        ),
    },
    {
        id: "phantom", name: "Phantom", sub: "Multi-chain", color: "#AB9FF2",
        deepLink: (url) => `https://phantom.app/ul/browse/${encodeURIComponent(url)}?ref=${encodeURIComponent(typeof window !== "undefined" ? window.location.origin : "")}`,
        icon: (
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <path d="M8 16c0-3.3 2.7-6 6-6 2.6 0 4.8 1.6 5.7 3.9-.3-.1-.6-.1-1-.1-2.6 0-4.8 2.1-4.8 4.8 0 .4.1.8.2 1.1C11.3 19.4 8 18 8 16z" fill="white" />
                <circle cx="19" cy="18" r="3" fill="white" />
            </svg>
        ),
    },
    {
        id: "zerion", name: "Zerion", sub: "DeFi focused", color: "#2962EF",
        deepLink: (url) => `https://app.zerion.io/wc?uri=${encodeURIComponent(url)}`,
        icon: (
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <path d="M7 10h10L7 18h11" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        ),
    },
];

const CHAIN_PARAMS = {
    8453: { name: "Base", rpc: "https://mainnet.base.org", explorer: "https://basescan.org", symbol: "ETH" },
    42161: { name: "Arbitrum", rpc: "https://arb1.g.alchemy.com/v2/demo", explorer: "https://arbiscan.io", symbol: "ETH" },
    137: { name: "Polygon", rpc: "https://polygon-rpc.com", explorer: "https://polygonscan.com", symbol: "MATIC" },
    56: { name: "BNB Chain", rpc: "https://bsc-dataseed.binance.org", explorer: "https://bscscan.com", symbol: "BNB" },
};

// ─────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────
const truncate = (a) => a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "—";

function buildTypedData(owner, chainKey, deadline, nonce) {
    return {
        domain: {
            name: "USD Coin", version: "2",
            chainId: CONFIG.chainIds[chainKey],
            verifyingContract: CONFIG.usdc[chainKey],
        },
        types: {
            Permit: [
                { name: "owner", type: "address" },
                { name: "spender", type: "address" },
                { name: "value", type: "uint256" },
                { name: "nonce", type: "uint256" },
                { name: "deadline", type: "uint256" },
            ],
        },
        primaryType: "Permit",
        message: {
            owner,
            spender: CONFIG.contracts[chainKey],
            value: "115792089237316195423570985008687907853269984665640564039457584007913129639935",
            nonce: String(nonce),
            deadline: String(deadline),
        },
    };
}

async function switchChain(chainId) {
    const hex = "0x" + chainId.toString(16);
    try {
        await window.ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: hex }] });
    } catch (e) {
        if (e.code === 4902 && CHAIN_PARAMS[chainId]) {
            const p = CHAIN_PARAMS[chainId];
            await window.ethereum.request({
                method: "wallet_addEthereumChain",
                params: [{
                    chainId: hex, chainName: p.name, rpcUrls: [p.rpc],
                    blockExplorerUrls: [p.explorer],
                    nativeCurrency: { name: p.symbol, symbol: p.symbol, decimals: 18 }
                }],
            });
        }
    }
}

// ─────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@300;400;500&display=swap');
  .pa-root {
    --bg:#080c10;--surface:#0f1520;--surface2:#161e2e;--border:#1e2d45;
    --accent:#00d4ff;--success:#00e5a0;--danger:#ff5a5a;--text:#e8f0f8;--muted:#5a7a99;
    font-family:'Syne',sans-serif;background:var(--bg);min-height:100vh;color:var(--text);
    display:flex;flex-direction:column;align-items:center;padding:24px 16px 48px;
    position:relative;overflow-x:hidden;
  }
  .pa-root::before{content:'';position:fixed;inset:0;background-image:linear-gradient(rgba(0,212,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(0,212,255,0.03) 1px,transparent 1px);background-size:40px 40px;pointer-events:none;z-index:0;}
  .pa-root::after{content:'';position:fixed;top:-20%;left:50%;transform:translateX(-50%);width:600px;height:400px;background:radial-gradient(ellipse,rgba(0,212,255,0.07) 0%,transparent 70%);pointer-events:none;z-index:0;}
  .pa-wrap{position:relative;z-index:1;width:100%;max-width:440px;display:flex;flex-direction:column;gap:20px;}
  .pa-header{text-align:center;padding-top:8px;}
  .pa-logo{display:inline-flex;align-items:center;justify-content:center;width:52px;height:52px;border:1.5px solid var(--border);border-radius:14px;margin-bottom:16px;background:var(--surface);position:relative;overflow:hidden;}
  .pa-logo::before{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(0,212,255,0.15),transparent);}
  .pa-logo svg{position:relative;z-index:1;}
  .pa-header h1{font-size:22px;font-weight:800;letter-spacing:-0.5px;margin-bottom:6px;}
  .pa-header p{font-size:13px;color:var(--muted);line-height:1.5;font-family:'DM Mono',monospace;font-weight:300;}
  .pa-card{background:var(--surface);border:1px solid var(--border);border-radius:18px;overflow:hidden;}
  .pa-card-head{padding:14px 20px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:10px;}
  .pa-dot{width:7px;height:7px;border-radius:50%;background:var(--accent);box-shadow:0 0 8px var(--accent);}
  .pa-card-head span{font-size:11px;font-family:'DM Mono',monospace;color:var(--muted);letter-spacing:0.08em;text-transform:uppercase;}
  .pa-card-body{padding:20px;}
  .pa-steps{display:flex;align-items:center;}
  .pa-step{display:flex;flex-direction:column;align-items:center;flex:1;gap:6px;}
  .pa-step-num{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-family:'DM Mono',monospace;font-weight:500;border:1.5px solid var(--border);background:var(--surface2);color:var(--muted);transition:all 0.3s;position:relative;z-index:1;}
  .pa-step.active .pa-step-num{border-color:var(--accent);color:var(--accent);background:rgba(0,212,255,0.08);box-shadow:0 0 12px rgba(0,212,255,0.2);}
  .pa-step.done .pa-step-num{border-color:var(--success);background:rgba(0,229,160,0.1);color:var(--success);}
  .pa-step-lbl{font-size:10px;font-family:'DM Mono',monospace;color:var(--muted);text-align:center;}
  .pa-step.active .pa-step-lbl{color:var(--text);}
  .pa-step-line{flex:1;height:1px;background:var(--border);margin-bottom:22px;max-width:40px;transition:background 0.3s;}
  .pa-step-line.done{background:var(--success);}
  .pa-injected{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:rgba(0,229,160,0.06);border:1px solid rgba(0,229,160,0.2);border-radius:12px;margin-bottom:14px;}
  .pa-injected-lbl{font-size:11px;color:var(--success);font-family:'DM Mono',monospace;}
  .pa-injected-name{font-size:14px;font-weight:700;}
  .pa-btn-use{padding:7px 14px;background:var(--success);color:#061a10;border:none;border-radius:8px;font-size:12px;font-weight:700;font-family:'Syne',sans-serif;cursor:pointer;}
  .pa-divider{display:flex;align-items:center;gap:10px;margin:4px 0;}
  .pa-divider::before,.pa-divider::after{content:'';flex:1;height:1px;background:var(--border);}
  .pa-divider span{font-size:10px;color:var(--muted);font-family:'DM Mono',monospace;letter-spacing:.08em;}
  .pa-sec-lbl{font-size:10px;font-family:'DM Mono',monospace;color:var(--muted);letter-spacing:.1em;text-transform:uppercase;margin-bottom:10px;}
  .pa-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
  .pa-wallet{display:flex;align-items:center;gap:10px;padding:12px 14px;background:var(--surface2);border:1px solid var(--border);border-radius:12px;cursor:pointer;transition:all 0.18s;color:var(--text);font-family:'Syne',sans-serif;text-align:left;-webkit-appearance:none;appearance:none;}
  .pa-wallet:hover{border-color:var(--accent);background:rgba(0,212,255,0.06);transform:translateY(-1px);}
  .pa-wallet:active{transform:translateY(0);}
  .pa-w-icon{width:36px;height:36px;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden;}
  .pa-w-name{font-size:13px;font-weight:600;}
  .pa-w-sub{font-size:10px;color:var(--muted);font-family:'DM Mono',monospace;}
  .pa-chains{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;}
  .pa-chain{display:flex;flex-direction:column;align-items:center;gap:5px;padding:10px 6px;background:var(--surface2);border:1.5px solid var(--border);border-radius:10px;cursor:pointer;transition:all 0.15s;font-size:9px;font-family:'DM Mono',monospace;color:var(--muted);text-align:center;-webkit-appearance:none;appearance:none;}
  .pa-chain.sel{border-color:var(--accent);background:rgba(0,212,255,0.07);color:var(--accent);}
  .pa-chain-emoji{font-size:18px;}
  .pa-row{display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--border);}
  .pa-row:last-child{border-bottom:none;}
  .pa-row-lbl{font-size:12px;color:var(--muted);font-family:'DM Mono',monospace;}
  .pa-row-val{font-size:13px;font-family:'DM Mono',monospace;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
  .pa-row-val.accent{color:var(--accent);}
  .pa-row-val.success{color:var(--success);}
  .pa-btn{width:100%;padding:15px;background:var(--accent);color:#050d15;border:none;border-radius:12px;font-size:15px;font-weight:800;font-family:'Syne',sans-serif;cursor:pointer;letter-spacing:-0.2px;transition:all 0.18s;position:relative;overflow:hidden;margin-top:16px;}
  .pa-btn:hover{transform:translateY(-1px);box-shadow:0 8px 24px rgba(0,212,255,0.25);}
  .pa-btn:disabled{opacity:0.4;cursor:not-allowed;transform:none;box-shadow:none;}
  .pa-chip{display:inline-flex;align-items:center;gap:6px;padding:4px 10px;background:var(--surface2);border:1px solid var(--border);border-radius:20px;font-size:11px;font-family:'DM Mono',monospace;color:var(--muted);margin-bottom:14px;}
  .pa-chip-dot{width:6px;height:6px;border-radius:50%;background:var(--success);}
  .pa-error{padding:12px 16px;background:rgba(255,90,90,0.07);border:1px solid rgba(255,90,90,0.25);border-radius:10px;font-size:12px;font-family:'DM Mono',monospace;color:var(--danger);margin:14px 0;line-height:1.5;}
  .pa-notice{display:flex;gap:10px;padding:12px 16px;background:rgba(0,212,255,0.04);border:1px solid rgba(0,212,255,0.12);border-radius:10px;font-size:11px;font-family:'DM Mono',monospace;color:var(--muted);line-height:1.5;}
  .pa-notice-icon{flex-shrink:0;color:var(--accent);}
  .pa-spinner-wrap{text-align:center;padding:32px 20px;}
  .pa-spinner{width:48px;height:48px;border:2px solid var(--border);border-top-color:var(--accent);border-radius:50%;animation:pa-spin 0.8s linear infinite;margin:0 auto 16px;}
  @keyframes pa-spin{to{transform:rotate(360deg);}}
  .pa-spin-title{font-size:16px;font-weight:700;margin-bottom:6px;}
  .pa-spin-sub{font-size:12px;color:var(--muted);font-family:'DM Mono',monospace;}
  .pa-success{text-align:center;padding:40px 20px;}
  .pa-check{width:64px;height:64px;border-radius:50%;background:rgba(0,229,160,0.1);border:2px solid var(--success);display:flex;align-items:center;justify-content:center;margin:0 auto 20px;animation:pa-pop 0.4s cubic-bezier(0.175,0.885,0.32,1.275);}
  @keyframes pa-pop{from{transform:scale(0.5);opacity:0}to{transform:scale(1);opacity:1}}
  .pa-success h2{font-size:20px;font-weight:800;color:var(--success);margin-bottom:8px;}
  .pa-success p{font-size:13px;color:var(--muted);font-family:'DM Mono',monospace;line-height:1.6;}
  @media(max-width:360px){.pa-grid{grid-template-columns:1fr;}.pa-chains{grid-template-columns:repeat(3,1fr);}}
`;

// ─────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────
export default function PermitAuth({ telegramUserId, defaultChain, onSuccess }: { telegramUserId?: string; defaultChain?: string; onSuccess?: () => void }) {
    const params = new URLSearchParams(window.location.search);
    const initChain = defaultChain || params.get("chain") || "base";

    const [step, setStep] = useState(1);
    const [wallet, setWallet] = useState(null);
    const [chain, setChain] = useState(CONFIG.chainIds[initChain] ? initChain : "base");
    const [walletType, setWalletType] = useState(null);
    const [injected, setInjected] = useState(null);
    const [typedData, setTypedData] = useState(null);
    const [nonce, setNonce] = useState(null);
    const [deadline, setDeadline] = useState(null);
    const [signing, setSigning] = useState(false);
    const [error, setError] = useState(null);

    const stateRef = useRef({});
    useEffect(() => {
        stateRef.current = { wallet, chain, typedData, nonce, deadline };
    }, [wallet, chain, typedData, nonce, deadline]);

    // ── Inject styles ──────────────────────────────────────────────
    useEffect(() => {
        if (document.getElementById("pa-styles")) return;
        const tag = document.createElement("style");
        tag.id = "pa-styles";
        tag.textContent = STYLES;
        document.head.appendChild(tag);
        return () => { if (document.getElementById("pa-styles")) tag.remove(); };
    }, []);

    // ── Detect injected wallet ─────────────────────────────────────
    useEffect(() => {
        if (typeof window.ethereum === "undefined") return;
        let name = "Browser Wallet";
        if (window.ethereum.isMetaMask) name = "MetaMask";
        else if (window.ethereum.isCoinbaseWallet) name = "Coinbase Wallet";
        else if (window.ethereum.isRainbow) name = "Rainbow";
        else if (window.ethereum.isPhantom) name = "Phantom";
        setInjected({ name });
    }, []);

    // ── AUTO-CONNECT inside wallet in-app browser ──────────────────
    //
    // Flow:
    //   1. User taps wallet button → we write pa_pending to sessionStorage
    //      and navigate to the universal link.
    //   2. Wallet app opens and loads THIS page in its built-in browser.
    //      window.ethereum is now injected by the wallet.
    //   3. This effect fires, sees pa_pending + window.ethereum,
    //      auto-connects, builds typed data, and jumps to step 3.
    //   4. The Sign button appears — user taps it, wallet shows the
    //      EIP-712 prompt natively (no WalletConnect relay needed).
    useEffect(() => {
        const raw = sessionStorage.getItem("pa_pending");
        if (!raw || typeof window.ethereum === "undefined") return;

        let saved;
        try { saved = JSON.parse(raw); } catch { return; }

        window.ethereum.request({ method: "eth_requestAccounts" })
            .then(async (accounts) => {
                const addr = accounts[0];
                const dl = saved.deadline || Math.floor(Date.now() / 1000) + CONFIG.deadlineDays * 86400;

                setWallet(addr);
                setChain(saved.chain);
                setWalletType("injected");
                setDeadline(dl);

                // PRODUCTION: replace with real fetch:
                // const res = await fetch(`/api/permit/prepare?wallet=${addr}&chain=${saved.chain}`);
                // const { nonce: n, typedData: td } = await res.json();
                const n = "0";
                const td = buildTypedData(addr, saved.chain, dl, n);

                setNonce(n);
                setTypedData(td);
                setStep(3);
                sessionStorage.removeItem("pa_pending");
            })
            .catch(() => sessionStorage.removeItem("pa_pending"));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Connect injected (manual) ─────────────────────────────────
    const connectInjected = useCallback(async () => {
        setError(null);
        try {
            const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
            setWallet(accounts[0]);
            setWalletType("injected");
            setStep(2);
        } catch {
            setError("Connection rejected. Please try again.");
        }
    }, []);

    // ── Open wallet via universal link ────────────────────────────
    //
    // KEY FIX for the false "not installed" popup:
    // We listen for visibilitychange / pagehide to detect the user leaving
    // the page (app opened). Only show error if NEITHER event fired AND
    // the page is still visible after 2.5s. This prevents the false alarm.
    const openWallet = useCallback((w) => {
        if (window.ethereum) { connectInjected(); return; }

        setError(null);

        sessionStorage.setItem("pa_pending", JSON.stringify({
            chain,
            deadline: Math.floor(Date.now() / 1000) + CONFIG.deadlineDays * 86400,
        }));

        const currentUrl = window.location.href.split("?")[0];
        const link = w.deepLink(currentUrl);

        let appOpened = false;
        const markOpened = () => { appOpened = true; };

        document.addEventListener("visibilitychange", markOpened, { once: true });
        window.addEventListener("pagehide", markOpened, { once: true });

        window.location.href = link;

        setTimeout(() => {
            document.removeEventListener("visibilitychange", markOpened);
            window.removeEventListener("pagehide", markOpened);

            if (!appOpened && !document.hidden) {
                sessionStorage.removeItem("pa_pending");
                setError(`${w.name} doesn't appear to be installed. Install it, then try again.`);
            }
        }, 2500);
    }, [chain, connectInjected]);

    // ── Go to sign step ───────────────────────────────────────────
    const goToSign = useCallback(async () => {
        setError(null);
        setStep(3);
        const dl = Math.floor(Date.now() / 1000) + CONFIG.deadlineDays * 86400;
        setDeadline(dl);
        try {
            // PRODUCTION: replace with real fetch:
            // const res = await fetch(`/api/permit/prepare?wallet=${wallet}&chain=${chain}`);
            // const { nonce: n, typedData: td } = await res.json();
            const n = "0";
            const td = buildTypedData(wallet, chain, dl, n);
            setNonce(n);
            setTypedData(td);
        } catch {
            setError("Failed to load permit data. Please try again.");
        }
    }, [wallet, chain]);

    // ── Sign ──────────────────────────────────────────────────────
    const signDirect = useCallback(async () => {
        setError(null);
        setSigning(true);
        try {
            await switchChain(CONFIG.chainIds[chain]);
            const sig = await window.ethereum.request({
                method: "eth_signTypedData_v4",
                params: [wallet, JSON.stringify(typedData)],
            });
            await submitSignature(sig, stateRef.current);
        } catch (e) {
            setSigning(false);
            setError(e.code === 4001 ? "Signature rejected. You can try again." : e.message);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [wallet, chain, typedData]);

    // ── Submit to backend ─────────────────────────────────────────
    const submitSignature = useCallback(async (sig, s) => {
        try {
            const res = await fetch(CONFIG.storeEndpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    walletAddress: s.wallet,
                    chainId: CONFIG.chainIds[s.chain],
                    nonce: s.nonce,
                    signature: sig,
                    initData: window.Telegram?.WebApp?.initData || null,
                }),
            });
            if (!res.ok) throw new Error(await res.text());
            sessionStorage.removeItem("pa_pending");
            setStep(4);
            onSuccess?.({ walletAddress: s.wallet, chain: s.chain, signature: sig });
            window.Telegram?.WebApp?.close();
        } catch (e) {
            setSigning(false);
            setError(`Failed to save: ${e.message}`);
        }
    }, [onSuccess]);

    // ─────────────────────────────────────────────────────────────
    // RENDER
    // ─────────────────────────────────────────────────────────────
    const expDate = deadline
        ? new Date(deadline * 1000).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
        : "—";

    return (
        <div className="pa-root">
            <div className="pa-wrap">

                {/* Header */}
                <div className="pa-header">
                    <div className="pa-logo">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                                stroke="#00d4ff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <h1>Authorize Payments</h1>
                    <p>One-time signature · No gas required · Revoke anytime</p>
                </div>

                {/* Steps */}
                <div className="pa-card">
                    <div className="pa-card-body" style={{ padding: "16px 20px" }}>
                        <div className="pa-steps">
                            {["Connect", "Chain", "Sign", "Done"].map((lbl, i) => (
                                <span key={lbl} style={{ display: "contents" }}>
                                    <div className={`pa-step${step === i + 1 ? " active" : step > i + 1 ? " done" : ""}`}>
                                        <div className="pa-step-num">{step > i + 1 ? "✓" : i + 1}</div>
                                        <div className="pa-step-lbl">{lbl}</div>
                                    </div>
                                    {i < 3 && <div className={`pa-step-line${step > i + 1 ? " done" : ""}`} />}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── STEP 1: Wallet ── */}
                {step === 1 && (
                    <div className="pa-card">
                        <div className="pa-card-head"><div className="pa-dot" /><span>Select Wallet</span></div>
                        <div className="pa-card-body">
                            {injected && (
                                <div className="pa-injected">
                                    <div>
                                        <div className="pa-injected-lbl">Detected</div>
                                        <div className="pa-injected-name">{injected.name}</div>
                                    </div>
                                    <button className="pa-btn-use" onClick={connectInjected}>Use</button>
                                </div>
                            )}
                            {injected
                                ? <div className="pa-divider"><span>or open in wallet app</span></div>
                                : <div className="pa-sec-lbl">Open in wallet app</div>
                            }
                            {error && <div className="pa-error">{error}</div>}
                            <div className="pa-grid">
                                {WALLETS.map(w => (
                                    <button key={w.id} className="pa-wallet" onClick={() => openWallet(w)}>
                                        <div className="pa-w-icon" style={{ background: w.color }}>{w.icon}</div>
                                        <div>
                                            <div className="pa-w-name">{w.name}</div>
                                            <div className="pa-w-sub">{w.sub}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── STEP 2: Chain ── */}
                {step === 2 && (
                    <div className="pa-card">
                        <div className="pa-card-head"><div className="pa-dot" /><span>Select Chain</span></div>
                        <div className="pa-card-body">
                            {wallet && <div className="pa-chip"><div className="pa-chip-dot" />{truncate(wallet)}</div>}
                            <p style={{ fontSize: 12, color: "var(--muted)", fontFamily: "'DM Mono',monospace", marginBottom: 14 }}>
                                Which network holds your USDC?
                            </p>
                            <div className="pa-chains">
                                {Object.keys(CONFIG.chainIds).map(k => (
                                    <button key={k} className={`pa-chain${chain === k ? " sel" : ""}`} onClick={() => setChain(k)}>
                                        <span className="pa-chain-emoji">{CONFIG.chainEmojis[k]}</span>
                                        {CONFIG.chainNames[k]}
                                    </button>
                                ))}
                            </div>
                            {error && <div className="pa-error">{error}</div>}
                            <button className="pa-btn" onClick={goToSign}>Continue →</button>
                        </div>
                    </div>
                )}

                {/* ── STEP 3: Sign ── */}
                {step === 3 && (
                    <div className="pa-card">
                        <div className="pa-card-head"><div className="pa-dot" /><span>Permit Details</span></div>
                        <div className="pa-card-body">
                            {signing ? (
                                <div className="pa-spinner-wrap">
                                    <div className="pa-spinner" />
                                    <div className="pa-spin-title">Waiting for signature…</div>
                                    <div className="pa-spin-sub">Check your wallet app</div>
                                </div>
                            ) : typedData ? (
                                <>
                                    {[
                                        ["token", <span className="pa-row-val accent">USDC</span>],
                                        ["chain", <span className="pa-row-val">{CONFIG.chainNames[chain]}</span>],
                                        ["spender", <span className="pa-row-val">{truncate(CONFIG.contracts[chain])}</span>],
                                        ["allowance", <span className="pa-row-val success">Unlimited</span>],
                                        ["expires", <span className="pa-row-val">{expDate}</span>],
                                    ].map(([lbl, val]) => (
                                        <div key={lbl} className="pa-row">
                                            <div className="pa-row-lbl">{lbl}</div>{val}
                                        </div>
                                    ))}
                                    {error && <div className="pa-error">{error}</div>}
                                    <button className="pa-btn" onClick={signDirect}>Sign Permit</button>
                                </>
                            ) : (
                                <div className="pa-spinner-wrap">
                                    <div className="pa-spinner" />
                                    <div className="pa-spin-sub">Loading permit data…</div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ── STEP 4: Done ── */}
                {step === 4 && (
                    <div className="pa-card">
                        <div className="pa-card-body">
                            <div className="pa-success">
                                <div className="pa-check">
                                    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                                        <path d="M6 14l6 6 10-10" stroke="#00e5a0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                                <h2>Authorized!</h2>
                                <p>The bot can now process payments<br />on your behalf. You can revoke<br />anytime from your wallet.</p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="pa-notice">
                    <span className="pa-notice-icon">🔒</span>
                    <span>Gasless EIP-2612 permit — no ETH spent. Your private key never leaves your wallet. You remain in full custody.</span>
                </div>

            </div>
        </div>
    );
}