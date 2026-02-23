/**
 * PayVendor Telegram Mini App
 *
 * Query params expected:
 *   userId       - Telegram user ID
 *   firstName    - User's first name
 *   usdtBalance  - USDT balance (float string)
 *   usdcBalance  - USDC balance (float string)
 *   network      - chain name e.g. "arbitrum"
 *   walletAddress- custodial wallet address
 *
 * On submit, sends payment data back to the Telegram bot via
 *   window.Telegram.WebApp.sendData(JSON.stringify(payload))
 */

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence, useSpring, useMotionValue } from "framer-motion";

// ─── API hooks (kept exactly as in original) ────────────────────────────────
import { useExchangeRate, useExchangeRateCalculated } from "@/hooks/useExchangeRate";
import { Bank, useBanks } from "@/hooks/useBanks";
import { useAccountVerification } from "@/hooks/useAccountVerification";

// ─── Types ───────────────────────────────────────────────────────────────────
type FlowState = "input" | "review" | "processing" | "success" | "failed";
type Token = "USDT" | "USDC";

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getQueryParam(key: string, fallback = ""): string {
    if (typeof window === "undefined") return fallback;
    return new URLSearchParams(window.location.search).get(key) ?? fallback;
}

function haptic(style: "light" | "medium" | "heavy" = "light") {
    (window as any)?.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.(style);
}

// ─── Particle background ─────────────────────────────────────────────────────
function Particles() {
    const count = 18;
    return (
        <div className="particles-container" aria-hidden>
            {Array.from({ length: count }).map((_, i) => (
                <span
                    key={i}
                    className="particle"
                    style={{
                        "--x": `${Math.random() * 100}%`,
                        "--y": `${Math.random() * 100}%`,
                        "--d": `${3 + Math.random() * 6}s`,
                        "--s": `${0.3 + Math.random() * 0.7}`,
                    } as React.CSSProperties}
                />
            ))}
        </div>
    );
}

// ─── Glowing orb decoration ──────────────────────────────────────────────────
function OrbBg() {
    return (
        <>
            <div className="orb orb-1" />
            <div className="orb orb-2" />
        </>
    );
}

// ─── Token Pill ──────────────────────────────────────────────────────────────
function TokenPill({
    token,
    balance,
    selected,
    onSelect,
}: {
    token: Token;
    balance: number;
    selected: boolean;
    onSelect: () => void;
}) {
    return (
        <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={() => { haptic("light"); onSelect(); }}
            className={`token-pill ${selected ? "token-pill--active" : ""}`}
        >
            <div className="token-pill__icon">{token === "USDT" ? "₮" : "◎"}</div>
            <div className="token-pill__text">
                <span className="token-pill__name">{token}</span>
                <span className="token-pill__bal">{(new Intl.NumberFormat("en-NG", {
                    style: "currency",
                    currency: "USD",
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                    notation: 'compact',
                    compactDisplay: 'short',
                }).format(balance)).replace("US$", "$")}</span>
            </div>
            {selected && (
                <motion.div
                    layoutId="token-check"
                    className="token-pill__check"
                    initial={false}
                    transition={{ type: "spring", stiffness: 400, damping: 28 }}
                >
                    ✓
                </motion.div>
            )}
        </motion.button>
    );
}

// ─── Row item for summary ────────────────────────────────────────────────────
function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
    return (
        <div className="summary-row">
            <span className="summary-row__label">{label}</span>
            <span className={`summary-row__value ${accent ? "summary-row__value--accent" : ""}`}>{value}</span>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function PayVendorTelegram() {
    // ── Context from query params ──
    const userId = getQueryParam("userId");
    const firstName = getQueryParam("firstName", "Friend");
    const usdtBalance = parseFloat(getQueryParam("usdtBalance", "0"));
    const usdcBalance = parseFloat(getQueryParam("usdcBalance", "0"));
    const network = getQueryParam("network", "arbitrum");
    const walletAddress = getQueryParam("walletAddress", "");
    const token = getQueryParam("token", "USDC");

    // ── API hooks ──
    const { banks, loading: loadingBanks, error: banksError } = useBanks();
    const {
        verifyAccount,
        accountName,
        loading: verifyingAccount,
        error: verificationError,
        clearVerification,
    } = useAccountVerification();

    // ── Local state ──
    const [flowState, setFlowState] = useState<FlowState>("input");
    const [selectedToken, setSelectedToken] = useState<Token>(token as Token);
    const [accountNumber, setAccountNumber] = useState("");
    const [selectedBank, setSelectedBank] = useState<Bank | null>(null);
    const [amount, setAmount] = useState("");
    const [narration, setNarration] = useState("");
    const [showBankSearch, setShowBankSearch] = useState(false);
    const [bankSearch, setBankSearch] = useState("");
    const [step, setStep] = useState(0); // 0=bank, 1=account, 2=amount, 3=token
    const [errorMsg, setErrorMsg] = useState("");

    // ── Exchange rate ──
    const amountNgn = parseFloat(amount) || 0;
    const { data: rateData } = useExchangeRate(selectedToken);
    const { data: calcData, isLoading: calcLoading } = useExchangeRateCalculated(amountNgn, selectedToken);

    const fallbackRate = rateData?.effectiveRate || 1600;
    const fee = calcData?.fee ?? 0;
    const feePercentage = calcData?.feePercentage ?? 0;
    const rate = calcData?.rate ?? fallbackRate;
    const amountCrypto = calcData?.amountCrypto ?? 0;
    const platformFeeNgn = fee * rate;
    const totalNgn = amountNgn + platformFeeNgn;
    const totalCrypto = amountCrypto + fee;

    // ── Filtered banks ──
    const filteredBanks = banks.filter((b) =>
        b.name.toLowerCase().includes(bankSearch.toLowerCase())
    );

    // ── Account verification ──
    useEffect(() => {
        if (accountNumber.length === 10 && selectedBank) {
            verifyAccount({ accountNumber, accountBank: selectedBank.code });
        } else {
            clearVerification();
        }
    }, [accountNumber, selectedBank]);

    // ── Telegram WebApp setup ──
    useEffect(() => {
        const tg = (window as any)?.Telegram?.WebApp;
        if (tg) {
            tg.ready();
            tg.expand();
            tg.BackButton.onClick(() => {
                if (flowState === "review") { setFlowState("input"); haptic("light"); }
                else if (flowState !== "input") setFlowState("input");
                else tg.close();
            });
        }
    }, [flowState]);

    // ── Handlers ──
    const handleBankSelect = (bank: Bank) => {
        setSelectedBank(bank);
        setShowBankSearch(false);
        setBankSearch("");
        haptic("medium");
        if (step === 0) setTimeout(() => setStep(1), 300);
    };

    const handleAccountChange = (v: string) => {
        const cleaned = v.replace(/\D/g, "").slice(0, 10);
        setAccountNumber(cleaned);
        if (cleaned.length === 10 && step < 2) setTimeout(() => setStep(2), 400);
    };

    const formatAmount = (v: string) => {
        const n = v.replace(/\D/g, "");
        return n ? parseInt(n).toLocaleString("en-NG") : "";
    };

    const handleAmountChange = (v: string) => {
        const n = v.replace(/,/g, "");
        setAmount(n);
        if (parseFloat(n) > 0 && step < 3) setTimeout(() => setStep(3), 200);
    };

    const canProceed =
        selectedBank && accountNumber.length === 10 && accountName && parseFloat(amount) > 0;

    const handleConfirm = () => {
        if (!canProceed) { setErrorMsg("Please fill all fields"); return; }
        setErrorMsg("");
        haptic("medium");
        setFlowState("review");
    };

    const handlePay = () => {
        haptic("heavy");
        setFlowState("processing");

        const payload = {
            type: "pay_vendor",
            userId,
            walletAddress,
            network,
            bank: selectedBank?.code,
            bankName: selectedBank?.name,
            accountNumber,
            accountName,
            amountNgn,
            amountCrypto: totalCrypto.toFixed(6),
            tokenSymbol: selectedToken,
            fee: fee.toFixed(6),
            feeNgn: platformFeeNgn,
            totalNgn,
            narration,
            rate,
        };

        // Send to Telegram bot
        const tg = (window as any)?.Telegram?.WebApp;
        if (tg?.sendData) {
            tg.sendData(JSON.stringify(payload));
        } else {
            // Dev fallback
            console.log("📤 Would send to bot:", payload);
            setTimeout(() => setFlowState("success"), 2000);
        }
    };

    // ── Steps progress ──
    const steps = [
        { label: "Bank", done: !!selectedBank },
        { label: "Account", done: accountNumber.length === 10 && !!accountName },
        { label: "Amount", done: parseFloat(amount) > 0 },
        { label: "Token", done: true },
    ];

    // ════════════════════════════════════════════════════
    // RENDER STATES
    // ════════════════════════════════════════════════════

    const renderInput = () => (
        <motion.div
            key="input"
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="page-content"
        >
            {/* Header */}
            <div className="page-header">
                <h1 className="page-title">Pay Vendor</h1>
                <p className="page-subtitle">Crypto → Nigerian bank in seconds</p>
            </div>

            {/* Progress steps */}
            <div className="progress-steps">
                {steps.map((s, i) => (
                    <div key={i} className="progress-step">
                        <motion.div
                            className={`progress-dot ${s.done ? "progress-dot--done" : i === step ? "progress-dot--active" : ""}`}
                            animate={s.done ? { scale: [1, 1.3, 1] } : {}}
                            transition={{ duration: 0.3 }}
                        >
                            {s.done ? "✓" : i + 1}
                        </motion.div>
                        <span className="progress-label">{s.label}</span>
                        {i < steps.length - 1 && <div className={`progress-line ${s.done ? "progress-line--done" : ""}`} />}
                    </div>
                ))}
            </div>

            {/* Bank selector */}
            <motion.div
                className="field-group"
                animate={{ opacity: 1 }}
                initial={{ opacity: 0 }}
                transition={{ delay: 0.1 }}
            >
                <label className="field-label">Select Bank</label>
                <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => { setShowBankSearch(true); haptic("light"); }}
                    className={`field-btn ${selectedBank ? "field-btn--filled" : ""}`}
                >
                    {selectedBank ? (
                        <div className="bank-selected">
                            <div className="bank-avatar">{selectedBank.name.slice(0, 2).toUpperCase()}</div>
                            <span>{selectedBank.name}</span>
                        </div>
                    ) : (
                        <span className="field-placeholder">Choose a bank</span>
                    )}
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="chevron">
                        <polyline points="6 9 12 15 18 9" />
                    </svg>
                </motion.button>
            </motion.div>

            {/* Account Number */}
            <AnimatePresence>
                {(step >= 1 || selectedBank) && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                        className="field-group"
                    >
                        <label className="field-label">Account Number</label>
                        <div className="input-wrap">
                            <input
                                type="tel"
                                inputMode="numeric"
                                className="field-input"
                                placeholder="0000000000"
                                value={accountNumber}
                                maxLength={10}
                                onChange={(e) => handleAccountChange(e.target.value)}
                            />
                            <div className="input-counter">{accountNumber.length}/10</div>
                        </div>
                        <AnimatePresence mode="wait">
                            {verifyingAccount && (
                                <motion.div key="verifying" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="field-hint field-hint--loading">
                                    <span className="spinner-xs" /> Verifying account…
                                </motion.div>
                            )}
                            {accountName && !verifyingAccount && (
                                <motion.div key="name" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="field-hint field-hint--success">
                                    ✓ {accountName}
                                </motion.div>
                            )}
                            {verificationError && !verifyingAccount && (
                                <motion.div key="err" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="field-hint field-hint--error">
                                    ⚠ {verificationError}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Amount */}
            <AnimatePresence>
                {(step >= 2 || (accountNumber.length === 10 && accountName)) && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                        className="field-group"
                    >
                        <label className="field-label">Amount (NGN)</label>
                        <div className="amount-input-wrap">
                            <span className="currency-symbol">₦</span>
                            <input
                                type="text"
                                inputMode="numeric"
                                className="field-input field-input--amount"
                                placeholder="0"
                                value={formatAmount(amount)}
                                onChange={(e) => handleAmountChange(e.target.value)}
                            />
                        </div>
                        {amountNgn > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="amount-eq"
                            >
                                {calcLoading ? (
                                    <span className="spinner-xs" />
                                ) : (
                                    <>
                                        <span className="amount-eq__rate">Rate: ₦{rate.toLocaleString()}/USD</span>
                                        <span className="amount-eq__crypto">≈ {amountCrypto.toFixed(4)} {selectedToken}</span>
                                    </>
                                )}
                            </motion.div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Token selector */}
            <AnimatePresence>
                {(step >= 3 || parseFloat(amount) > 0) && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                        className="field-group"
                    >
                        <label className="field-label">Pay With</label>
                        <div className="token-grid">
                            <TokenPill token="USDT" balance={usdtBalance} selected={selectedToken === "USDT"} onSelect={() => setSelectedToken("USDT")} />
                            <TokenPill token="USDC" balance={usdcBalance} selected={selectedToken === "USDC"} onSelect={() => setSelectedToken("USDC")} />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Narration */}
            <AnimatePresence>
                {parseFloat(amount) > 0 && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.35, delay: 0.05 }}
                        className="field-group"
                    >
                        <label className="field-label">Narration <span className="optional">(optional)</span></label>
                        <input
                            type="text"
                            className="field-input"
                            placeholder="Payment description"
                            value={narration}
                            onChange={(e) => setNarration(e.target.value)}
                            maxLength={60}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Summary strip */}
            <AnimatePresence>
                {amountNgn > 0 && fee > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="summary-strip"
                    >
                        <div className="summary-strip__row">
                            <span>Fee ({feePercentage}%)</span>
                            <span>₦{platformFeeNgn.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                        </div>
                        <div className="summary-strip__row summary-strip__row--total">
                            <span>Total</span>
                            <span>₦{totalNgn.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {errorMsg && <p className="error-msg">{errorMsg}</p>}

            <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleConfirm}
                disabled={!canProceed || verifyingAccount}
                className="cta-btn"
            >
                <span>Review Payment</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
            </motion.button>

            {/* Bank Search Sheet */}
            <AnimatePresence>
                {showBankSearch && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="sheet-backdrop"
                        onClick={() => setShowBankSearch(false)}
                    >
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", stiffness: 340, damping: 32 }}
                            onClick={(e) => e.stopPropagation()}
                            className="sheet"
                        >
                            <div className="sheet-handle" />
                            <div className="sheet-header">
                                <h2 className="sheet-title">Select Bank</h2>
                                <div className="sheet-search-wrap">
                                    <svg className="sheet-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                                    </svg>
                                    <input
                                        className="sheet-search"
                                        placeholder="Search banks…"
                                        value={bankSearch}
                                        onChange={(e) => setBankSearch(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                            </div>
                            <div className="sheet-list">
                                {loadingBanks ? (
                                    <div className="sheet-empty"><span className="spinner" /></div>
                                ) : banksError ? (
                                    <div className="sheet-empty sheet-empty--error">⚠ Failed to load banks</div>
                                ) : filteredBanks.length === 0 ? (
                                    <div className="sheet-empty">No banks found</div>
                                ) : (
                                    filteredBanks.map((bank) => (
                                        <motion.button
                                            key={bank.id}
                                            whileTap={{ scale: 0.97 }}
                                            onClick={() => handleBankSelect(bank)}
                                            className={`bank-item ${selectedBank?.code === bank.code ? "bank-item--active" : ""}`}
                                        >
                                            <div className="bank-item__avatar">{bank.name.slice(0, 2).toUpperCase()}</div>
                                            <span className="bank-item__name">{bank.name}</span>
                                            {selectedBank?.code === bank.code && <span className="bank-item__check">✓</span>}
                                        </motion.button>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );

    const renderReview = () => (
        <motion.div
            key="review"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="page-content"
        >
            <div className="page-header">
                <h1 className="page-title">Review</h1>
                <p className="page-subtitle">Confirm your payment details</p>
            </div>

            <motion.div
                className="review-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <div className="review-card__badge">Recipient</div>
                <div className="review-card__name">{accountName}</div>
                <div className="review-card__sub">{accountNumber} · {selectedBank?.name}</div>
            </motion.div>

            <motion.div
                className="summary-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
            >
                <Row label="Amount" value={`₦${amountNgn.toLocaleString()}`} />
                <Row label={`Fee (${feePercentage}%)`} value={`₦${platformFeeNgn.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />
                <div className="summary-divider" />
                <Row label="Total NGN" value={`₦${totalNgn.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} accent />
                <Row label={`Total ${selectedToken}`} value={`${totalCrypto.toFixed(6)} ${selectedToken}`} accent />
                {narration && <Row label="Narration" value={narration} />}
                <div className="summary-divider" />
                <Row label="Network" value={network} />
                <Row label="Token" value={selectedToken} />
            </motion.div>

            <div className="btn-row">
                <motion.button whileTap={{ scale: 0.96 }} onClick={() => { haptic("light"); setFlowState("input"); }} className="back-btn">
                    ← Back
                </motion.button>
                <motion.button whileTap={{ scale: 0.96 }} onClick={handlePay} className="cta-btn cta-btn--flex">
                    <span>Confirm & Pay</span>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                    </svg>
                </motion.button>
            </div>
        </motion.div>
    );

    const renderProcessing = () => (
        <motion.div
            key="processing"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="state-page"
        >
            <div className="pulse-ring">
                <div className="pulse-ring__inner">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="spin-icon">
                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                </div>
            </div>
            <h2 className="state-title">Processing</h2>
            <p className="state-sub">Your payment is being processed by the bot. Please wait…</p>
            <p className="state-tiny">This may take up to 3 minutes</p>
        </motion.div>
    );

    const renderSuccess = () => (
        <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="state-page"
        >
            <motion.div
                className="success-ring"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 18, delay: 0.15 }}
            >
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                </svg>
            </motion.div>
            <motion.h2 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="state-title">
                Sent! 🎉
            </motion.h2>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="state-sub">
                ₦{amountNgn.toLocaleString()} → {accountName}
            </motion.p>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="state-tiny">
                The bot will send you a confirmation message shortly.
            </motion.p>
        </motion.div>
    );

    const renderFailed = () => (
        <motion.div
            key="failed"
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="state-page"
        >
            <div className="error-ring">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
                </svg>
            </div>
            <h2 className="state-title">Payment Failed</h2>
            <p className="state-sub">Something went wrong. Please try again.</p>
            <motion.button whileTap={{ scale: 0.96 }} onClick={() => setFlowState("input")} className="cta-btn" style={{ marginTop: "2rem" }}>
                Try Again
            </motion.button>
        </motion.div>
    );

    return (
        <>
            {/* ── Global Styles ── */}
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg: #0a0b10;
          --bg2: #10121a;
          --surface: rgba(255,255,255,0.045);
          --surface-hover: rgba(255,255,255,0.08);
          --border: rgba(255,255,255,0.08);
          --border-active: rgba(100,210,255,0.5);
          --text: #f0f2ff;
          --text-muted: rgba(240,242,255,0.48);
          --primary: #4ef0c4;
          --primary-dark: #1db995;
          --accent: #7b6ef6;
          --error: #ff6b6b;
          --success: #4ef0c4;
          --font-head: 'Syne', sans-serif;
          --font-body: 'DM Sans', sans-serif;
          --radius: 16px;
          --radius-sm: 10px;
        }

        html, body, #root { height: 100%; }

        body {
          background: var(--bg);
          color: var(--text);
          font-family: var(--font-body);
          font-size: 15px;
          line-height: 1.5;
          -webkit-font-smoothing: antialiased;
          overscroll-behavior: none;
        }

        /* ── App shell ── */
        .app {
          position: relative;
          min-height: 100dvh;
          overflow-x: hidden;
          overflow-y: auto;
        }

        /* ── Orbs ── */
        .orb {
          position: fixed;
          border-radius: 50%;
          filter: blur(80px);
          pointer-events: none;
          z-index: 0;
        }
        .orb-1 {
          width: 340px; height: 340px;
          background: radial-gradient(circle, rgba(78,240,196,0.18) 0%, transparent 70%);
          top: -80px; right: -80px;
        }
        .orb-2 {
          width: 260px; height: 260px;
          background: radial-gradient(circle, rgba(123,110,246,0.16) 0%, transparent 70%);
          bottom: 60px; left: -60px;
        }

        /* ── Particles ── */
        .particles-container {
          position: fixed; inset: 0; pointer-events: none; z-index: 0; overflow: hidden;
        }
        .particle {
          position: absolute;
          left: var(--x); top: var(--y);
          width: 2px; height: 2px;
          border-radius: 50%;
          background: var(--primary);
          opacity: 0;
          transform: scale(var(--s));
          animation: float var(--d) ease-in-out infinite;
        }
        @keyframes float {
          0%, 100% { opacity: 0; transform: translateY(0) scale(var(--s)); }
          30% { opacity: 0.6; }
          50% { transform: translateY(-28px) scale(var(--s)); opacity: 0.4; }
        }

        /* ── Page ── */
        .page-content {
          position: relative;
          z-index: 1;
          padding: 24px 18px 120px;
          max-width: 480px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .page-header { margin-bottom: 4px; }
        .page-title {
          font-family: var(--font-head);
          font-size: 28px;
          font-weight: 800;
          letter-spacing: -0.5px;
          color: var(--text);
          line-height: 1.15;
        }
        .page-subtitle {
          font-size: 13px;
          color: var(--text-muted);
          margin-top: 4px;
        }

        /* ── Progress ── */
        .progress-steps {
          display: flex;
          align-items: center;
          gap: 0;
        }
        .progress-step {
          display: flex;
          align-items: center;
          gap: 6px;
          flex: 1;
        }
        .progress-dot {
          width: 26px; height: 26px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 700;
          background: var(--surface);
          border: 1.5px solid var(--border);
          color: var(--text-muted);
          flex-shrink: 0;
          transition: all 0.3s;
        }
        .progress-dot--active {
          border-color: var(--primary);
          color: var(--primary);
          box-shadow: 0 0 10px rgba(78,240,196,0.3);
        }
        .progress-dot--done {
          background: var(--primary);
          border-color: var(--primary);
          color: #0a0b10;
        }
        .progress-label {
          font-size: 10px;
          color: var(--text-muted);
          white-space: nowrap;
        }
        .progress-line {
          flex: 1;
          height: 1.5px;
          background: var(--border);
          margin: 0 4px;
          transition: background 0.4s;
        }
        .progress-line--done { background: var(--primary); }

        /* ── Fields ── */
        .field-group { display: flex; flex-direction: column; gap: 8px; }

        .field-label {
          font-size: 12px;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        .optional { font-weight: 400; opacity: 0.6; text-transform: none; letter-spacing: 0; }

        .field-btn {
          display: flex; align-items: center; justify-content: space-between;
          width: 100%; padding: 14px 16px;
          background: var(--surface);
          border: 1.5px solid var(--border);
          border-radius: var(--radius);
          color: var(--text-muted);
          cursor: pointer;
          transition: border-color 0.2s, background 0.2s;
          text-align: left;
        }
        .field-btn--filled { border-color: var(--border-active); color: var(--text); background: var(--surface-hover); }
        .field-btn:hover { background: var(--surface-hover); }
        .field-placeholder { font-size: 15px; }
        .chevron { opacity: 0.5; flex-shrink: 0; transition: transform 0.2s; }

        .bank-selected { display: flex; align-items: center; gap: 10px; }
        .bank-avatar {
          width: 32px; height: 32px; border-radius: 8px;
          background: linear-gradient(135deg, var(--primary), var(--accent));
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 800; color: #0a0b10;
          flex-shrink: 0;
        }

        .input-wrap { position: relative; }
        .field-input {
          width: 100%; padding: 14px 44px 14px 16px;
          background: var(--surface);
          border: 1.5px solid var(--border);
          border-radius: var(--radius);
          color: var(--text);
          font-family: var(--font-body);
          font-size: 15px;
          transition: border-color 0.2s, box-shadow 0.2s;
          outline: none;
        }
        .field-input:focus {
          border-color: var(--border-active);
          box-shadow: 0 0 0 3px rgba(78,240,196,0.12);
        }
        .field-input::placeholder { color: var(--text-muted); }
        .input-counter {
          position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
          font-size: 11px; color: var(--text-muted);
        }

        .amount-input-wrap { position: relative; }
        .currency-symbol {
          position: absolute; left: 16px; top: 50%; transform: translateY(-50%);
          font-size: 20px; font-weight: 700; color: var(--text-muted); z-index: 1;
        }
        .field-input--amount {
          padding-left: 36px;
          font-size: 26px;
          font-weight: 700;
          font-family: var(--font-head);
          letter-spacing: -0.5px;
        }

        .amount-eq {
          display: flex; justify-content: space-between;
          font-size: 12px; color: var(--text-muted);
          padding: 0 4px;
        }
        .amount-eq__crypto { color: var(--primary); font-weight: 600; }

        .field-hint { font-size: 12.5px; padding: 0 4px; display: flex; align-items: center; gap: 6px; }
        .field-hint--loading { color: var(--text-muted); }
        .field-hint--success { color: var(--success); }
        .field-hint--error { color: var(--error); }

        /* ── Token pills ── */
        .token-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .token-pill {
          display: flex; align-items: center; gap: 10px;
          padding: 14px;
          background: var(--surface);
          border: 1.5px solid var(--border);
          border-radius: var(--radius);
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
          position: relative;
          overflow: hidden;
        }
        .token-pill--active {
          border-color: var(--primary);
          background: rgba(78,240,196,0.08);
          box-shadow: 0 0 18px rgba(78,240,196,0.12);
        }
        .token-pill__icon {
          width: 36px; height: 36px; border-radius: 50%;
          background: var(--surface-hover);
          display: flex; align-items: center; justify-content: center;
          font-size: 18px; font-weight: 700;
        }
        .token-pill--active .token-pill__icon { background: rgba(78,240,196,0.15); color: var(--primary); }
        .token-pill__text { flex: 1; }
        .token-pill__name { display: block; font-weight: 700; font-size: 14px; }
        .token-pill__bal { display: block; font-size: 11px; color: var(--text-muted); }
        .token-pill__check {
          width: 20px; height: 20px; border-radius: 50%;
          background: var(--primary); color: #0a0b10;
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 800;
        }

        /* ── Summary strip ── */
        .summary-strip {
          background: var(--surface);
          border: 1.5px solid var(--border);
          border-radius: var(--radius);
          padding: 14px 16px;
          display: flex; flex-direction: column; gap: 6px;
        }
        .summary-strip__row {
          display: flex; justify-content: space-between;
          font-size: 13px; color: var(--text-muted);
        }
        .summary-strip__row--total {
          font-weight: 700; font-size: 15px; color: var(--text);
        }

        /* ── CTA button ── */
        .cta-btn {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          width: 100%; padding: 16px 24px;
          background: linear-gradient(135deg, var(--primary), #2dd4bf);
          border: none; border-radius: var(--radius);
          color: #0a0b10;
          font-family: var(--font-head);
          font-size: 16px; font-weight: 700;
          cursor: pointer;
          transition: filter 0.2s, transform 0.15s;
          box-shadow: 0 6px 24px rgba(78,240,196,0.25);
        }
        .cta-btn:disabled {
          opacity: 0.4; cursor: not-allowed;
          box-shadow: none;
        }
        .cta-btn:not(:disabled):hover { filter: brightness(1.08); }
        .cta-btn--flex { flex: 1; }

        .back-btn {
          padding: 16px 20px;
          background: var(--surface); border: 1.5px solid var(--border);
          border-radius: var(--radius);
          color: var(--text-muted);
          font-family: var(--font-body); font-size: 15px;
          cursor: pointer; transition: background 0.2s;
        }
        .back-btn:hover { background: var(--surface-hover); }

        .btn-row { display: flex; gap: 10px; }

        /* ── Review card ── */
        .review-card {
          background: linear-gradient(135deg, rgba(78,240,196,0.1), rgba(123,110,246,0.1));
          border: 1.5px solid rgba(78,240,196,0.2);
          border-radius: var(--radius);
          padding: 20px;
          text-align: center;
        }
        .review-card__badge {
          font-size: 10px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.1em; color: var(--primary);
          margin-bottom: 8px;
        }
        .review-card__name {
          font-family: var(--font-head); font-size: 22px; font-weight: 700;
          margin-bottom: 4px;
        }
        .review-card__sub { font-size: 13px; color: var(--text-muted); }

        /* ── Summary card ── */
        .summary-card {
          background: var(--surface);
          border: 1.5px solid var(--border);
          border-radius: var(--radius);
          padding: 18px;
          display: flex; flex-direction: column; gap: 10px;
        }
        .summary-row { display: flex; justify-content: space-between; align-items: center; font-size: 14px; }
        .summary-row__label { color: var(--text-muted); }
        .summary-row__value { font-weight: 500; }
        .summary-row__value--accent { color: var(--primary); font-weight: 700; }
        .summary-divider { height: 1px; background: var(--border); }

        /* ── Sheet ── */
        .sheet-backdrop {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.6);
          backdrop-filter: blur(6px);
          z-index: 100;
          display: flex; align-items: flex-end;
        }
        .sheet {
          width: 100%; max-height: 75dvh;
          background: #13151f;
          border-top: 1.5px solid var(--border);
          border-radius: 24px 24px 0 0;
          overflow: hidden;
          display: flex; flex-direction: column;
        }
        .sheet-handle {
          width: 40px; height: 4px; border-radius: 2px;
          background: var(--border);
          margin: 12px auto 0;
          flex-shrink: 0;
        }
        .sheet-header {
          padding: 16px 18px;
          border-bottom: 1px solid var(--border);
          flex-shrink: 0;
        }
        .sheet-title {
          font-family: var(--font-head); font-size: 18px; font-weight: 700;
          margin-bottom: 12px;
        }
        .sheet-search-wrap { position: relative; }
        .sheet-search-icon {
          position: absolute; left: 12px; top: 50%; transform: translateY(-50%);
          opacity: 0.4;
        }
        .sheet-search {
          width: 100%; padding: 10px 12px 10px 38px;
          background: var(--surface);
          border: 1.5px solid var(--border);
          border-radius: 10px;
          color: var(--text); font-family: var(--font-body); font-size: 14px;
          outline: none; transition: border-color 0.2s;
        }
        .sheet-search:focus { border-color: var(--border-active); }
        .sheet-list { overflow-y: auto; flex: 1; padding: 8px; }
        .sheet-empty {
          padding: 40px; text-align: center;
          color: var(--text-muted); font-size: 14px;
          display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .sheet-empty--error { color: var(--error); }

        .bank-item {
          display: flex; align-items: center; gap: 12px;
          width: 100%; padding: 12px 10px;
          background: transparent; border: none;
          border-radius: 12px; cursor: pointer;
          transition: background 0.15s; text-align: left;
        }
        .bank-item:hover { background: var(--surface-hover); }
        .bank-item--active { background: rgba(78,240,196,0.08); }
        .bank-item__avatar {
          width: 38px; height: 38px; border-radius: 10px;
          background: var(--surface-hover);
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; font-weight: 800; color: var(--text-muted);
          flex-shrink: 0;
        }
        .bank-item--active .bank-item__avatar { background: rgba(78,240,196,0.15); color: var(--primary); }
        .bank-item__name { flex: 1; font-size: 14px; font-weight: 500; color: var(--text); }
        .bank-item__check { color: var(--primary); font-weight: 700; font-size: 16px; }

        /* ── State pages ── */
        .state-page {
          position: relative; z-index: 1;
          min-height: 80dvh;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          text-align: center;
          padding: 32px 24px;
          gap: 14px;
        }
        .state-title {
          font-family: var(--font-head); font-size: 28px; font-weight: 800;
        }
        .state-sub { color: var(--text-muted); font-size: 15px; max-width: 280px; }
        .state-tiny { font-size: 12px; color: rgba(240,242,255,0.3); margin-top: 4px; }

        /* ── Pulse ring (processing) ── */
        .pulse-ring {
          width: 96px; height: 96px; border-radius: 50%;
          border: 2px solid rgba(78,240,196,0.3);
          display: flex; align-items: center; justify-content: center;
          animation: pulse-ring 1.6s ease-in-out infinite;
          position: relative;
          margin-bottom: 8px;
        }
        @keyframes pulse-ring {
          0%, 100% { box-shadow: 0 0 0 0 rgba(78,240,196,0.3); }
          50% { box-shadow: 0 0 0 16px rgba(78,240,196,0); }
        }
        .pulse-ring__inner {
          width: 64px; height: 64px; border-radius: 50%;
          background: rgba(78,240,196,0.1);
          display: flex; align-items: center; justify-content: center;
          color: var(--primary);
        }
        .spin-icon { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── Success ring ── */
        .success-ring {
          width: 96px; height: 96px; border-radius: 50%;
          background: rgba(78,240,196,0.15);
          border: 2px solid var(--primary);
          display: flex; align-items: center; justify-content: center;
          color: var(--primary);
          box-shadow: 0 0 32px rgba(78,240,196,0.3);
          margin-bottom: 8px;
        }

        /* ── Error ring ── */
        .error-ring {
          width: 96px; height: 96px; border-radius: 50%;
          background: rgba(255,107,107,0.12);
          border: 2px solid var(--error);
          display: flex; align-items: center; justify-content: center;
          color: var(--error);
          box-shadow: 0 0 24px rgba(255,107,107,0.2);
          margin-bottom: 8px;
        }

        /* ── Spinners ── */
        .spinner {
          width: 28px; height: 28px; border-radius: 50%;
          border: 2.5px solid var(--border);
          border-top-color: var(--primary);
          animation: spin 0.8s linear infinite;
          display: inline-block;
        }
        .spinner-xs {
          width: 12px; height: 12px; border-radius: 50%;
          border: 2px solid var(--border);
          border-top-color: var(--primary);
          animation: spin 0.8s linear infinite;
          display: inline-block; flex-shrink: 0;
        }

        .error-msg { color: var(--error); font-size: 13px; padding: 0 4px; }

        /* ── Scrollbar ── */
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }
      `}</style>

            <div className="app">
                <OrbBg />
                <Particles />

                <AnimatePresence mode="wait">
                    {flowState === "input" && renderInput()}
                    {flowState === "review" && renderReview()}
                    {flowState === "processing" && renderProcessing()}
                    {flowState === "success" && renderSuccess()}
                    {flowState === "failed" && renderFailed()}
                </AnimatePresence>
            </div>
        </>
    );
}