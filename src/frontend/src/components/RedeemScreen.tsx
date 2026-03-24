import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Clock,
  Coins,
  Gift,
  Lock,
  Mail,
  PartyPopper,
  Sparkles,
  User,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useSubmitRedeemRequest, useUserProfile } from "../hooks/useQueries";
import { isDemoLoggedIn } from "../utils/demoMode";
import { AdSlot } from "./AdSlot";

const MIN_COINS = 5000;
const MAX_COINS = 25000;
const COINS_PER_RUPEE = 100;
const COOLDOWN_MS = 24 * 60 * 60 * 1000;

type RewardType = "google_play" | "amazon_pay";

function useCooldownRemaining(lastRedeemTime: bigint | undefined) {
  const [remaining, setRemaining] = useState<number>(0);

  useEffect(() => {
    if (!lastRedeemTime) return;
    const lastMs = Number(lastRedeemTime) / 1_000_000;
    const update = () => {
      const diff = COOLDOWN_MS - (Date.now() - lastMs);
      setRemaining(Math.max(0, diff));
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [lastRedeemTime]);

  return remaining;
}

function formatDuration(ms: number) {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return { h, m, s };
}

const AMOUNT_TICKS = [50, 100, 150, 200, 250];

const REWARD_OPTIONS = [
  {
    id: "google_play" as RewardType,
    label: "Google Play",
    sub: "Gift Card",
    emoji: "🎮",
    gradient:
      "linear-gradient(135deg, oklch(0.22 0.04 160), oklch(0.18 0.02 160))",
    glow: "oklch(0.6 0.18 160 / 25%)",
    borderActive: "oklch(0.6 0.18 160)",
    badge: "Popular",
    desc: "Redeem for games, apps & in-app purchases on Google Play Store.",
  },
  {
    id: "amazon_pay" as RewardType,
    label: "Amazon Pay",
    sub: "Voucher",
    emoji: "🛒",
    gradient:
      "linear-gradient(135deg, oklch(0.22 0.05 60), oklch(0.18 0.02 60))",
    glow: "oklch(0.75 0.17 60 / 25%)",
    borderActive: "oklch(0.75 0.17 60)",
    badge: "Fast",
    desc: "Use for shopping, recharges, bill payments on Amazon India.",
  },
];

const CONFETTI_IDS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
const COMING_SOON_OPTIONS = [
  { label: "UPI Transfer", emoji: "💸" },
  { label: "Paytm Wallet", emoji: "📱" },
];

export function RedeemScreen() {
  const { data: profile } = useUserProfile();
  const { identity } = useInternetIdentity();
  const redeemMutation = useSubmitRedeemRequest();

  const coins = profile ? Number(profile.coins) : 0;
  const maxRedeemableCoins = Math.min(coins, MAX_COINS);
  const canRedeem = coins >= MIN_COINS;

  const cooldownRemaining = useCooldownRemaining(profile?.lastRedeemTime);
  const demo = isDemoLoggedIn();
  const isOnCooldown = !demo && cooldownRemaining > 0;

  const [selectedRupees, setSelectedRupees] = useState(50);
  const [rewardType, setRewardType] = useState<RewardType | null>(null);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState(
    () => localStorage.getItem("ge_user_email") ?? "",
  );
  const [emailLocked, setEmailLocked] = useState(
    () => !!localStorage.getItem("ge_user_email"),
  );
  const [redeemStatus, setRedeemStatus] = useState<
    "idle" | "loading" | "error"
  >("idle");
  const [congratsCode, setCongratsCode] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const maxRupees = Math.min(
    Math.floor(maxRedeemableCoins / COINS_PER_RUPEE),
    250,
  );
  const clampedSelected = Math.min(selectedRupees, maxRupees);
  const requiredCoins = clampedSelected * COINS_PER_RUPEE;
  const progressToMin = Math.min((coins / MIN_COINS) * 100, 100);
  const coinsNeeded = Math.max(0, MIN_COINS - coins);

  const isFormValid =
    canRedeem &&
    !isOnCooldown &&
    rewardType !== null &&
    userName.trim() !== "" &&
    userEmail.includes("@") &&
    clampedSelected >= 50;

  const rewardLabel =
    rewardType === "google_play"
      ? "Google Play Store Gift Card"
      : rewardType === "amazon_pay"
        ? "Amazon Pay Voucher"
        : "";

  const handleRedeem = async () => {
    if (!isFormValid || !rewardType) return;
    setRedeemStatus("loading");
    try {
      const rawCode = await redeemMutation.mutateAsync({
        amount: BigInt(clampedSelected),
        rewardType,
        userName: userName.trim(),
        userEmail: userEmail.trim(),
      });
      const code = String(rawCode);

      if (!emailLocked) {
        localStorage.setItem("ge_user_email", userEmail.trim());
        setEmailLocked(true);
      }

      const timestamp = new Date().toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
      });
      const subject = `Redeem Request - ${code} - ₹${clampedSelected} ${rewardLabel}`;
      const body = [
        "=== GAMER EARN REDEEM REQUEST ===",
        "",
        `Code: ${code}`,
        `Name: ${userName}`,
        `Email: ${userEmail}`,
        `Amount: ₹${clampedSelected}`,
        `Reward Type: ${rewardLabel}`,
        `Coins Used: ${requiredCoins.toLocaleString()}`,
        `Timestamp: ${timestamp}`,
        `User Principal: ${identity?.getPrincipal().toString() ?? "anonymous"}`,
      ].join("\n");

      // Send actual email via FormSubmit AJAX (no email client needed)
      try {
        await fetch("https://formsubmit.co/ajax/gmrearn@gmail.com", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            _subject: subject,
            message: body,
            name: userName,
            email: userEmail,
            redeemCode: code,
            amount: `₹${clampedSelected}`,
            rewardType: rewardLabel,
          }),
        });
      } catch {
        // email sending failure is non-critical, redeem already saved
      }

      setRedeemStatus("idle");
      setCongratsCode(code);
    } catch {
      setRedeemStatus("error");
      setTimeout(() => setRedeemStatus("idle"), 3000);
    }
  };

  const { h, m, s } = formatDuration(cooldownRemaining);
  const selectedReward = REWARD_OPTIONS.find((r) => r.id === rewardType);
  const sliderPct =
    ((clampedSelected - 50) / Math.max(maxRupees - 50, 1)) * 100;

  return (
    <div className="flex flex-col items-center gap-5 px-4 py-6 max-w-md mx-auto">
      {/* ─── BALANCE CARD ─── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full relative overflow-hidden rounded-3xl"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.19 0.018 255), oklch(0.16 0.012 255))",
          border: "1px solid oklch(0.83 0.16 87 / 20%)",
          boxShadow:
            "0 8px 40px oklch(0 0 0 / 50%), 0 0 60px oklch(0.83 0.16 87 / 8%)",
        }}
      >
        {/* Glow orb */}
        <div
          className="absolute -top-10 -right-10 w-48 h-48 rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, oklch(0.83 0.16 87 / 12%) 0%, transparent 70%)",
          }}
        />
        <div className="relative px-6 pt-6 pb-5 flex flex-col items-center gap-2">
          {/* Coin icon with pulse */}
          <motion.div
            animate={{
              boxShadow: [
                "0 0 20px oklch(0.83 0.16 87 / 30%)",
                "0 0 40px oklch(0.83 0.16 87 / 60%)",
                "0 0 20px oklch(0.83 0.16 87 / 30%)",
              ],
            }}
            transition={{ duration: 2.5, repeat: Number.POSITIVE_INFINITY }}
            className="w-20 h-20 rounded-full gold-gradient flex items-center justify-center mb-1"
          >
            <Coins
              className="w-10 h-10"
              style={{ color: "oklch(0.14 0.005 255)" }}
            />
          </motion.div>

          <p className="text-muted-foreground text-xs font-semibold tracking-[0.15em] uppercase">
            Your Balance
          </p>
          <motion.p
            key={coins}
            initial={{ scale: 1.15, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-5xl font-extrabold gold-text leading-none"
          >
            {coins.toLocaleString()}
          </motion.p>
          <p className="text-muted-foreground text-xs">coins</p>

          <div
            className="mt-1 px-5 py-2 rounded-full flex items-center gap-2"
            style={{
              background: "oklch(0.25 0.015 255)",
              border: "1px solid oklch(0.96 0.005 250 / 8%)",
            }}
          >
            <span className="text-sm font-bold text-foreground">
              ≈ ₹{Math.floor(coins / COINS_PER_RUPEE).toLocaleString()}
            </span>
            <span className="text-muted-foreground text-xs">rupees</span>
          </div>

          {/* Economy mini stats */}
          <div className="grid grid-cols-3 gap-2 w-full mt-3">
            {[
              { val: "₹50", lbl: "minimum" },
              { val: "₹250", lbl: "maximum" },
              demo
                ? { val: "∞", lbl: "no limit" }
                : { val: "24h", lbl: "cooldown" },
            ].map((item) => (
              <div
                key={item.lbl}
                className="rounded-xl py-2 text-center"
                style={{
                  background: "oklch(0.24 0.015 255)",
                  border: "1px solid oklch(0.96 0.005 250 / 6%)",
                }}
              >
                <p className="text-sm font-bold gold-text">{item.val}</p>
                <p className="text-muted-foreground text-[10px] mt-0.5">
                  {item.lbl}
                </p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Ad slot */}
      <AdSlot size="rectangle" className="w-full" />

      {/* ─── COOLDOWN BANNER ─── */}
      <AnimatePresence>
        {isOnCooldown && (
          <motion.div
            key="cooldown"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="w-full rounded-3xl overflow-hidden"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.2 0.03 30), oklch(0.16 0.02 30))",
              border: "1px solid oklch(0.65 0.18 30 / 30%)",
              boxShadow: "0 0 30px oklch(0.65 0.18 30 / 15%)",
            }}
          >
            <div className="px-5 py-5 flex flex-col items-center gap-3">
              <div className="flex items-center gap-2">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ background: "oklch(0.65 0.18 30 / 20%)" }}
                >
                  <Clock
                    className="w-5 h-5"
                    style={{ color: "oklch(0.75 0.18 30)" }}
                  />
                </div>
                <div>
                  <p
                    className="text-sm font-bold"
                    style={{ color: "oklch(0.75 0.18 30)" }}
                  >
                    Cooldown Active
                  </p>
                  <p className="text-muted-foreground text-xs">
                    24-hour lock between redeems
                  </p>
                </div>
              </div>
              {/* Dramatic countdown */}
              <div className="flex gap-3">
                {[
                  { v: h, l: "HRS" },
                  { v: m, l: "MIN" },
                  { v: s, l: "SEC" },
                ].map((seg) => (
                  <div
                    key={seg.l}
                    className="flex flex-col items-center rounded-2xl px-4 py-3 min-w-[64px]"
                    style={{
                      background: "oklch(0.15 0.02 30)",
                      border: "1px solid oklch(0.65 0.18 30 / 20%)",
                    }}
                  >
                    <motion.span
                      key={seg.v}
                      initial={{ y: -6, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      className="text-3xl font-extrabold tabular-nums"
                      style={{ color: "oklch(0.75 0.18 30)" }}
                    >
                      {String(seg.v).padStart(2, "0")}
                    </motion.span>
                    <span className="text-[9px] tracking-widest text-muted-foreground mt-0.5">
                      {seg.l}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── PROGRESS TO MINIMUM ─── */}
      <AnimatePresence>
        {!canRedeem && (
          <motion.div
            key="progress"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="w-full card-surface rounded-3xl p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 gold-text" />
                <p className="text-sm font-semibold text-foreground">
                  Unlock Redeem
                </p>
              </div>
              <p className="text-sm gold-text font-bold">
                {coins.toLocaleString()} / 5,000
              </p>
            </div>
            <div
              className="w-full h-3 rounded-full overflow-hidden"
              style={{ background: "oklch(0.24 0.015 255)" }}
            >
              <motion.div
                className="h-full rounded-full"
                style={{
                  background:
                    "linear-gradient(90deg, oklch(0.85 0.17 90), oklch(0.78 0.16 82))",
                }}
                initial={{ width: 0 }}
                animate={{ width: `${progressToMin}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
            <p className="text-muted-foreground text-xs mt-2 text-center">
              {coinsNeeded.toLocaleString()} more coins needed to unlock redeem
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── REDEMPTION WIZARD ─── */}
      {canRedeem && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-full flex flex-col gap-4"
        >
          {/* STEP 1 — Choose Reward */}
          <WizardSection
            step={1}
            title="Choose Your Reward"
            icon={<Gift className="w-4 h-4" />}
          >
            <div className="flex flex-col gap-3">
              {REWARD_OPTIONS.map((opt, i) => {
                const isSelected = rewardType === opt.id;
                return (
                  <motion.button
                    key={opt.id}
                    type="button"
                    onClick={() => setRewardType(opt.id)}
                    data-ocid={`redeem.${opt.id}.toggle`}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    whileTap={{ scale: 0.98 }}
                    className="relative w-full text-left rounded-2xl p-4 transition-all duration-300"
                    style={{
                      background: isSelected
                        ? opt.gradient
                        : "oklch(0.22 0.012 255)",
                      border: isSelected
                        ? `2px solid ${opt.borderActive}`
                        : "2px solid oklch(0.96 0.005 250 / 8%)",
                      boxShadow: isSelected ? `0 0 20px ${opt.glow}` : "none",
                      transform: isSelected ? "scale(1.01)" : "scale(1)",
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl shrink-0"
                        style={{
                          background: isSelected
                            ? "oklch(0.15 0.01 255 / 50%)"
                            : "oklch(0.25 0.012 255)",
                        }}
                      >
                        {opt.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-foreground text-base">
                            {opt.label}
                          </span>
                          <span
                            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                            style={{
                              background: isSelected
                                ? opt.borderActive
                                : "oklch(0.28 0.012 255)",
                              color: isSelected
                                ? "oklch(0.14 0.005 255)"
                                : "oklch(0.7 0.01 255)",
                            }}
                          >
                            {opt.badge}
                          </span>
                        </div>
                        <p className="text-muted-foreground text-xs mt-0.5 font-medium">
                          {opt.sub}
                        </p>
                        <p className="text-muted-foreground text-[11px] mt-1 leading-snug">
                          {opt.desc}
                        </p>
                      </div>
                      <motion.div
                        animate={{
                          scale: isSelected ? 1 : 0.7,
                          opacity: isSelected ? 1 : 0,
                        }}
                        className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                        style={{ background: opt.borderActive }}
                      >
                        <CheckCircle2
                          className="w-4 h-4"
                          style={{ color: "oklch(0.14 0.005 255)" }}
                        />
                      </motion.div>
                    </div>
                  </motion.button>
                );
              })}

              {/* Coming Soon options */}
              <div className="grid grid-cols-2 gap-2">
                {COMING_SOON_OPTIONS.map((opt) => (
                  <div
                    key={opt.label}
                    className="rounded-xl p-3 flex items-center gap-2 opacity-50"
                    style={{
                      background: "oklch(0.19 0.01 255)",
                      border: "1px dashed oklch(0.96 0.005 250 / 12%)",
                    }}
                  >
                    <span>{opt.emoji}</span>
                    <div>
                      <p className="text-xs font-semibold text-foreground">
                        {opt.label}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        Coming Soon
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </WizardSection>

          {/* STEP 2 — Amount (only after reward is selected) */}
          <AnimatePresence>
            {rewardType && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ type: "spring", stiffness: 300, damping: 28 }}
              >
                <WizardSection
                  step={2}
                  title="Select Amount"
                  icon={<Sparkles className="w-4 h-4" />}
                >
                  {/* Big rupee display */}
                  <div className="flex flex-col items-center py-4 gap-2">
                    <motion.div
                      key={clampedSelected}
                      initial={{ scale: 1.2, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 20,
                      }}
                      className="text-6xl font-extrabold gold-text leading-none"
                      style={{
                        textShadow: "0 0 30px oklch(0.83 0.16 87 / 50%)",
                      }}
                    >
                      ₹{clampedSelected}
                    </motion.div>
                    {/* Coin cost pill */}
                    <motion.div
                      key={requiredCoins}
                      initial={{ scale: 0.9 }}
                      animate={{ scale: 1 }}
                      className="flex items-center gap-1.5 rounded-full px-4 py-1.5"
                      style={{
                        background: "oklch(0.24 0.015 255)",
                        border: "1px solid oklch(0.83 0.16 87 / 25%)",
                      }}
                    >
                      <Coins className="w-3.5 h-3.5 gold-text" />
                      <span className="text-sm font-semibold gold-text">
                        {requiredCoins.toLocaleString()}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        coins
                      </span>
                    </motion.div>
                  </div>

                  {/* Styled range slider */}
                  <div className="px-2">
                    <div className="relative">
                      <input
                        type="range"
                        min={50}
                        max={maxRupees}
                        step={10}
                        value={clampedSelected}
                        onChange={(e) =>
                          setSelectedRupees(Number(e.target.value))
                        }
                        className="w-full h-2 rounded-full appearance-none cursor-pointer redeem-slider"
                        style={{
                          background: `linear-gradient(90deg, oklch(0.85 0.17 90) 0%, oklch(0.78 0.16 82) ${sliderPct}%, oklch(0.24 0.015 255) ${sliderPct}%)`,
                        }}
                      />
                    </div>
                    {/* Tick marks */}
                    <div className="flex justify-between mt-2 px-1">
                      {AMOUNT_TICKS.map((tick) => {
                        const isActive = tick <= clampedSelected;
                        return (
                          <button
                            key={tick}
                            type="button"
                            onClick={() => setSelectedRupees(tick)}
                            className="flex flex-col items-center gap-1 transition-all"
                          >
                            <div
                              className="w-1.5 h-1.5 rounded-full transition-all"
                              style={{
                                background: isActive
                                  ? "oklch(0.85 0.17 90)"
                                  : "oklch(0.35 0.01 255)",
                              }}
                            />
                            <span
                              className="text-[10px] font-semibold transition-all"
                              style={{
                                color: isActive
                                  ? "oklch(0.83 0.16 87)"
                                  : "oklch(0.55 0.01 255)",
                              }}
                            >
                              ₹{tick}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <p className="text-muted-foreground text-[11px] text-center mt-1">
                    Max redeemable: ₹{maxRupees}
                  </p>
                </WizardSection>
              </motion.div>
            )}
          </AnimatePresence>

          {/* STEP 3 — Your Details */}
          <AnimatePresence>
            {rewardType && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 28,
                  delay: 0.05,
                }}
              >
                <WizardSection
                  step={3}
                  title="Your Details"
                  icon={<User className="w-4 h-4" />}
                >
                  <div className="flex flex-col gap-3">
                    {/* Name field */}
                    <div>
                      <label
                        htmlFor="redeem-name"
                        className="text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1.5 uppercase tracking-wider"
                      >
                        <User className="w-3 h-3 gold-text" /> Full Name
                      </label>
                      <div
                        className="rounded-xl overflow-hidden transition-all duration-200"
                        style={{
                          border:
                            focusedField === "name"
                              ? "1.5px solid oklch(0.83 0.16 87 / 80%)"
                              : "1.5px solid oklch(0.96 0.005 250 / 10%)",
                          boxShadow:
                            focusedField === "name"
                              ? "0 0 12px oklch(0.83 0.16 87 / 20%)"
                              : "none",
                        }}
                      >
                        <input
                          id="redeem-name"
                          data-ocid="redeem.input"
                          type="text"
                          placeholder="Enter your full name"
                          value={userName}
                          onChange={(e) => setUserName(e.target.value)}
                          onFocus={() => setFocusedField("name")}
                          onBlur={() => setFocusedField(null)}
                          className="w-full px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none"
                          style={{ background: "oklch(0.19 0.012 255)" }}
                        />
                      </div>
                    </div>

                    {/* Email field */}
                    <div>
                      <label
                        htmlFor="redeem-email"
                        className="text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1.5 uppercase tracking-wider"
                      >
                        <Mail className="w-3 h-3 gold-text" /> Email Address
                        {emailLocked && (
                          <Lock
                            className="w-3 h-3 ml-auto"
                            style={{ color: "oklch(0.83 0.16 87 / 60%)" }}
                          />
                        )}
                      </label>
                      <div
                        className="rounded-xl overflow-hidden transition-all duration-200 relative"
                        style={{
                          border:
                            focusedField === "email"
                              ? "1.5px solid oklch(0.83 0.16 87 / 80%)"
                              : emailLocked
                                ? "1.5px solid oklch(0.83 0.16 87 / 20%)"
                                : "1.5px solid oklch(0.96 0.005 250 / 10%)",
                          boxShadow:
                            focusedField === "email"
                              ? "0 0 12px oklch(0.83 0.16 87 / 20%)"
                              : "none",
                        }}
                      >
                        <input
                          id="redeem-email"
                          data-ocid="redeem.input"
                          type="email"
                          placeholder="Enter your email address"
                          value={userEmail}
                          onChange={(e) =>
                            !emailLocked && setUserEmail(e.target.value)
                          }
                          readOnly={emailLocked}
                          onFocus={() =>
                            !emailLocked && setFocusedField("email")
                          }
                          onBlur={() => setFocusedField(null)}
                          className={`w-full px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none pr-10 ${
                            emailLocked ? "cursor-not-allowed" : ""
                          }`}
                          style={{
                            background: emailLocked
                              ? "oklch(0.17 0.01 255)"
                              : "oklch(0.19 0.012 255)",
                          }}
                        />
                        {emailLocked && (
                          <Lock
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4"
                            style={{ color: "oklch(0.83 0.16 87 / 60%)" }}
                          />
                        )}
                      </div>
                      {emailLocked && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Email locked.{" "}
                          <button
                            type="button"
                            className="underline gold-text"
                            onClick={() => {
                              localStorage.removeItem("ge_user_email");
                              setEmailLocked(false);
                            }}
                          >
                            Change?
                          </button>
                        </p>
                      )}
                    </div>
                  </div>
                </WizardSection>
              </motion.div>
            )}
          </AnimatePresence>

          {/* STEP 4 — Confirm Summary */}
          <AnimatePresence>
            {isFormValid && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 28,
                  delay: 0.1,
                }}
              >
                <WizardSection
                  step={4}
                  title="Confirm Order"
                  icon={<ChevronRight className="w-4 h-4" />}
                >
                  <div
                    className="rounded-2xl overflow-hidden"
                    style={{
                      background: "oklch(0.18 0.012 255)",
                      border: "1px solid oklch(0.83 0.16 87 / 20%)",
                    }}
                  >
                    {[
                      {
                        label: "Reward",
                        value: selectedReward?.label ?? "",
                        sub: selectedReward?.sub,
                      },
                      {
                        label: "Amount",
                        value: `₹${clampedSelected}`,
                        sub: "Indian Rupees",
                      },
                      {
                        label: "Coins Used",
                        value: requiredCoins.toLocaleString(),
                        sub: "from your balance",
                      },
                      { label: "Recipient", value: userEmail, sub: userName },
                    ].map((row, i, arr) => (
                      <div
                        key={row.label}
                        className="flex items-center justify-between px-4 py-3"
                        style={{
                          borderBottom:
                            i < arr.length - 1
                              ? "1px solid oklch(0.96 0.005 250 / 6%)"
                              : "none",
                        }}
                      >
                        <span className="text-xs text-muted-foreground">
                          {row.label}
                        </span>
                        <div className="text-right">
                          <p className="text-sm font-bold gold-text">
                            {row.value}
                          </p>
                          {row.sub && (
                            <p className="text-[10px] text-muted-foreground">
                              {row.sub}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </WizardSection>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* ─── ERROR STATE ─── */}
      <AnimatePresence>
        {redeemStatus === "error" && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            data-ocid="redeem.error_state"
            className="w-full rounded-2xl px-4 py-3 flex items-center gap-3 text-sm font-medium"
            style={{
              background: "oklch(0.2 0.04 20 / 60%)",
              border: "1px solid oklch(0.65 0.22 20 / 40%)",
              color: "oklch(0.75 0.15 20)",
            }}
          >
            <AlertTriangle className="w-4 h-4 shrink-0" />
            Failed to process redeem. Please try again.
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── REDEEM BUTTON ─── */}
      <motion.div
        className="w-full"
        animate={
          isFormValid && !isOnCooldown
            ? {
                boxShadow: [
                  "0 0 20px oklch(0.83 0.16 87 / 20%)",
                  "0 0 35px oklch(0.83 0.16 87 / 45%)",
                  "0 0 20px oklch(0.83 0.16 87 / 20%)",
                ],
              }
            : {}
        }
        transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
        style={{ borderRadius: "9999px" }}
      >
        <Button
          data-ocid="redeem.submit_button"
          onClick={handleRedeem}
          disabled={!isFormValid || redeemStatus === "loading"}
          className="w-full h-16 rounded-full text-lg font-bold tracking-wide relative overflow-hidden transition-all duration-300 active:scale-[0.98]"
          style={{
            background:
              !isFormValid || redeemStatus === "loading"
                ? "oklch(0.3 0.01 255)"
                : "linear-gradient(135deg, oklch(0.85 0.17 90) 0%, oklch(0.78 0.16 82) 50%, oklch(0.83 0.16 87) 100%)",
            color: "oklch(0.14 0.005 255)",
            border: "none",
          }}
        >
          {/* Shimmer overlay */}
          {isFormValid && redeemStatus === "idle" && (
            <span
              className="absolute inset-0 rounded-full pointer-events-none shimmer-sweep"
              style={{
                background:
                  "linear-gradient(105deg, transparent 40%, oklch(1 0 0 / 25%) 50%, transparent 60%)",
                backgroundSize: "200% 100%",
              }}
            />
          )}
          {redeemStatus === "loading" ? (
            <span className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full border-2 border-current border-t-transparent animate-spin" />
              Processing...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Gift className="w-5 h-5" />
              Redeem ₹{canRedeem ? clampedSelected : 0} Now
            </span>
          )}
        </Button>
      </motion.div>

      {canRedeem && !isFormValid && !isOnCooldown && (
        <p className="text-muted-foreground text-xs text-center">
          {!rewardType
            ? "Select a reward type to continue"
            : "Fill in your details to redeem"}
        </p>
      )}

      <AdSlot size="banner" className="w-full" />

      {/* ─── CONGRATULATIONS DIALOG ─── */}
      <Dialog open={!!congratsCode} onOpenChange={() => setCongratsCode(null)}>
        <DialogContent
          data-ocid="redeem.dialog"
          className="max-w-sm border-none text-center overflow-hidden"
          style={{
            background: "oklch(0.17 0.012 250)",
            border: "1px solid oklch(0.83 0.16 87 / 30%)",
            boxShadow:
              "0 0 60px oklch(0.83 0.16 87 / 20%), 0 20px 60px oklch(0 0 0 / 60%)",
          }}
        >
          {/* Confetti particles */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {CONFETTI_IDS.map((i) => (
              <div
                key={i}
                className="confetti-particle"
                style={{
                  left: `${(i * 6.25) % 100}%`,
                  animationDelay: `${(i * 0.12) % 1.5}s`,
                  background: [
                    "oklch(0.83 0.16 87)",
                    "oklch(0.75 0.18 160)",
                    "oklch(0.75 0.18 30)",
                    "oklch(0.75 0.18 300)",
                  ][i % 4],
                }}
              />
            ))}
          </div>

          <DialogHeader className="relative z-10">
            <div className="flex justify-center mb-3">
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 260,
                  damping: 15,
                  delay: 0.1,
                }}
                className="w-24 h-24 rounded-full gold-gradient flex items-center justify-center"
                style={{ boxShadow: "0 0 40px oklch(0.83 0.16 87 / 60%)" }}
              >
                <PartyPopper
                  className="w-12 h-12"
                  style={{ color: "oklch(0.14 0.005 255)" }}
                />
              </motion.div>
            </div>
            <DialogTitle className="text-2xl font-extrabold gold-text">
              Congratulations! 🎉
            </DialogTitle>
          </DialogHeader>

          <div className="relative z-10 flex flex-col items-center gap-4 py-2">
            <p className="text-foreground text-sm leading-relaxed">
              Your reward will be sent in{" "}
              <span className="font-bold gold-text">3–7 days</span> via email.
            </p>

            {/* Ticket-style code box */}
            <div
              className="w-full rounded-2xl px-6 py-4 relative"
              style={{
                background: "oklch(0.14 0.008 255)",
                border: "2px dashed oklch(0.83 0.16 87 / 40%)",
              }}
            >
              {/* Ticket notches */}
              <div
                className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full"
                style={{ background: "oklch(0.17 0.012 250)" }}
              />
              <div
                className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full"
                style={{ background: "oklch(0.17 0.012 250)" }}
              />
              <p className="text-xs text-muted-foreground mb-1 uppercase tracking-widest">
                Redeem Code
              </p>
              <p className="text-2xl font-extrabold gold-text tracking-widest">
                {congratsCode}
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle2
                className="w-4 h-4"
                style={{ color: "oklch(0.7 0.18 150)" }}
              />
              <span>Coins deducted · Request submitted</span>
            </div>

            <Button
              data-ocid="redeem.close_button"
              onClick={() => setCongratsCode(null)}
              className="w-full h-11 rounded-full font-bold text-base"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.85 0.17 90), oklch(0.78 0.16 82))",
                color: "oklch(0.14 0.005 255)",
                border: "none",
              }}
            >
              Awesome! 🎮
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Wizard Section Component ───
function WizardSection({
  step,
  title,
  icon,
  children,
}: {
  step: number;
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div
      className="w-full rounded-3xl overflow-hidden"
      style={{
        background: "oklch(0.19 0.014 255)",
        border: "1px solid oklch(0.96 0.005 250 / 8%)",
        boxShadow: "0 4px 20px oklch(0 0 0 / 30%)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-5 py-4"
        style={{ borderBottom: "1px solid oklch(0.96 0.005 250 / 6%)" }}
      >
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold shrink-0"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.85 0.17 90), oklch(0.78 0.16 82))",
            color: "oklch(0.14 0.005 255)",
          }}
        >
          {step}
        </div>
        <div className="flex items-center gap-1.5 gold-text">{icon}</div>
        <p className="font-bold text-sm text-foreground">{title}</p>
      </div>
      {/* Body */}
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}
