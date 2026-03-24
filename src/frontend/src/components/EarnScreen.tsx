import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  CheckCircle,
  Coins,
  Gift,
  Lock,
  Play,
  TrendingUp,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { useEarnCoins, useUserProfile } from "../hooks/useQueries";
import { AdSlot } from "./AdSlot";
import { IMARewardedAd } from "./IMARewardedAd";

const MAX_DAILY_ADS = 15;

type StatusType =
  | "idle"
  | "wait"
  | "banned"
  | "daily-limit"
  | "success"
  | "error";

type ComingSoonItem = {
  icon: typeof Gift;
  label: string;
  color: string;
  bgColor: string;
};

const COMING_SOON_ITEMS: ComingSoonItem[] = [
  {
    icon: Gift,
    label: "Daily Login Bonus",
    color: "oklch(0.7 0.18 300)",
    bgColor: "oklch(0.7 0.18 300 / 15%)",
  },
  {
    icon: Zap,
    label: "Streak Bonus",
    color: "oklch(0.75 0.17 55)",
    bgColor: "oklch(0.75 0.17 55 / 15%)",
  },
  {
    icon: TrendingUp,
    label: "Referral Bonus",
    color: "oklch(0.72 0.16 200)",
    bgColor: "oklch(0.72 0.16 200 / 15%)",
  },
];

const PARTICLE_KEYS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as const;

// Floating particle for background
function FloatingParticle({ index }: { index: number }) {
  const style = {
    left: `${(index * 37 + 11) % 100}%`,
    animationDelay: `${(index * 0.7) % 4}s`,
    animationDuration: `${4 + (index % 3)}s`,
    width: index % 3 === 0 ? "3px" : "2px",
    height: index % 3 === 0 ? "3px" : "2px",
  };
  return <div className="earn-particle" style={style} />;
}

// Segmented XP bar
function XPBar({
  total,
  current,
}: {
  progress: number;
  total: number;
  current: number;
}) {
  return (
    <div className="w-full">
      <div className="flex gap-1 mb-2">
        {Array.from({ length: total }).map((_, i) => (
          <motion.div
            // biome-ignore lint/suspicious/noArrayIndexKey: static fixed-length array
            key={`xp-${i}-seg`}
            className="flex-1 h-3 rounded-sm relative overflow-hidden"
            style={{ background: "oklch(0.23 0.014 250)" }}
          >
            {i < current && (
              <motion.div
                className="absolute inset-0 rounded-sm"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.3, delay: i * 0.03 }}
                style={{
                  transformOrigin: "left",
                  background:
                    "linear-gradient(90deg, oklch(0.85 0.17 90), oklch(0.78 0.16 82))",
                  boxShadow: "0 0 6px oklch(0.83 0.16 87 / 60%)",
                }}
              />
            )}
          </motion.div>
        ))}
      </div>
      <div className="flex justify-between text-xs">
        <span style={{ color: "oklch(0.7 0.015 250)" }}>Daily XP Progress</span>
        <span
          className="font-bold"
          style={{
            color:
              current >= total ? "oklch(0.65 0.18 25)" : "oklch(0.83 0.16 87)",
          }}
        >
          {current}/{total} ads
        </span>
      </div>
    </div>
  );
}

export function EarnScreen() {
  const { data: profile, refetch: refetchProfile } = useUserProfile();
  const earnCoinsMutation = useEarnCoins();

  const [showInterstitial, setShowInterstitial] = useState(false);
  const [status, setStatus] = useState<StatusType>("idle");
  const [statusMsg, setStatusMsg] = useState("");
  const [showPlusCoins, setShowPlusCoins] = useState(false);
  const [coinBounce, setCoinBounce] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Live countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      if (!profile) {
        setCountdown(0);
        return;
      }
      const nowNs = BigInt(Date.now()) * BigInt(1_000_000);
      const diff = Number(profile.nextAllowedAdTime - nowNs);
      if (diff > 0) {
        setCountdown(Math.ceil(diff / 1_000_000_000));
      } else {
        setCountdown(0);
      }
    }, 500);
    return () => clearInterval(interval);
  }, [profile]);

  const dailyAdsWatched = profile ? Number(profile.dailyAdsWatched) : 0;
  const coins = profile ? Number(profile.coins) : 0;
  const coinsToday = dailyAdsWatched * 10;
  const rupeesEquivalent = (coins / 100).toFixed(2);

  const getButtonState = useCallback((): {
    disabled: boolean;
    reason: StatusType | null;
  } => {
    if (!profile) return { disabled: false, reason: null };
    const nowNs = BigInt(Date.now()) * BigInt(1_000_000);

    if (profile.fastClickDisabledUntil > nowNs) {
      return { disabled: true, reason: "banned" };
    }
    if (dailyAdsWatched >= MAX_DAILY_ADS) {
      return { disabled: true, reason: "daily-limit" };
    }
    if (profile.nextAllowedAdTime > nowNs) {
      return { disabled: true, reason: "wait" };
    }
    return { disabled: false, reason: null };
  }, [profile, dailyAdsWatched]);

  const doEarnCoins = useCallback(async () => {
    setStatus("idle");
    try {
      await earnCoinsMutation.mutateAsync();
      await refetchProfile();
      setStatus("success");
      setStatusMsg("+10 coins earned!");
      setShowPlusCoins(true);
      setCoinBounce(true);
      setTimeout(() => setShowPlusCoins(false), 1200);
      setTimeout(() => setCoinBounce(false), 700);
      setTimeout(() => setStatus("idle"), 3000);
    } catch (err: any) {
      setStatus("error");
      setStatusMsg(err?.message || "Failed to earn coins. Try again.");
      setTimeout(() => setStatus("idle"), 3000);
    } finally {
      setShowInterstitial(false);
    }
  }, [earnCoinsMutation, refetchProfile]);

  const handleWatchAd = useCallback(async () => {
    if (!profile) {
      setShowInterstitial(true);
      return;
    }
    const nowNs = BigInt(Date.now()) * BigInt(1_000_000);

    if (profile.fastClickDisabledUntil > nowNs) {
      const secsLeft = Math.ceil(
        Number(profile.fastClickDisabledUntil - nowNs) / 1_000_000_000,
      );
      setStatus("banned");
      setStatusMsg(`Too many fast clicks. Wait ${secsLeft}s.`);
      return;
    }

    if (dailyAdsWatched >= MAX_DAILY_ADS) {
      setStatus("daily-limit");
      setStatusMsg("Daily limit reached (15/15). Come back tomorrow!");
      return;
    }

    if (profile.nextAllowedAdTime > nowNs) {
      setStatus("wait");
      setStatusMsg(`Please wait before next ad (${countdown}s)`);
      return;
    }

    setShowInterstitial(true);
  }, [profile, dailyAdsWatched, countdown]);

  const { disabled: btnDisabled } = getButtonState();
  const isLoading = earnCoinsMutation.isPending;
  const progressPct = (dailyAdsWatched / MAX_DAILY_ADS) * 100;
  const countdownPct =
    countdown > 0 ? Math.min((countdown / 60) * 100, 100) : 0;

  // Circumference for circular countdown
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDash = circumference - (countdownPct / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-5 px-4 py-6 max-w-md mx-auto fade-in relative">
      {/* Animated background particles */}
      <div className="earn-particles-bg" aria-hidden="true">
        {PARTICLE_KEYS.map((pk) => (
          <FloatingParticle key={pk} index={pk} />
        ))}
      </div>

      {/* IMA Rewarded Ad Overlay */}
      {showInterstitial && (
        <IMARewardedAd
          onRewarded={doEarnCoins}
          onClose={() => setShowInterstitial(false)}
          onError={() => {
            setStatus("error");
            setStatusMsg("Ad failed to load. Try again.");
            setShowInterstitial(false);
            setTimeout(() => setStatus("idle"), 3000);
          }}
        />
      )}

      {/* Coin Balance Card */}
      <motion.div
        layout
        className="w-full rounded-3xl relative overflow-hidden"
        style={{
          background:
            "linear-gradient(145deg, oklch(0.22 0.015 255), oklch(0.18 0.01 255))",
          border: "1px solid oklch(0.83 0.16 87 / 20%)",
          boxShadow:
            "0 0 40px oklch(0.83 0.16 87 / 12%), 0 8px 32px oklch(0 0 0 / 50%)",
        }}
      >
        <div className="earn-hex-bg" aria-hidden="true" />

        <div className="relative z-10 p-7 flex flex-col items-center gap-3">
          {/* Coin icon with pulsing rings */}
          <div className="relative flex items-center justify-center">
            <div className="earn-coin-ring-outer" />
            <div className="earn-coin-ring-inner" />
            <div
              className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center ${
                coinBounce ? "coin-bounce" : ""
              }`}
              style={{
                background:
                  "radial-gradient(circle at 35% 35%, oklch(0.92 0.18 92), oklch(0.75 0.16 80))",
                boxShadow:
                  "0 0 24px oklch(0.83 0.16 87 / 50%), inset 0 2px 4px oklch(1 0 0 / 30%)",
              }}
            >
              <Coins
                className="w-10 h-10"
                style={{ color: "oklch(0.14 0.005 255)" }}
              />
            </div>

            <AnimatePresence>
              {showPlusCoins && (
                <motion.span
                  key="plus"
                  initial={{ opacity: 1, y: 0, scale: 1 }}
                  animate={{ opacity: 0, y: -60, scale: 1.4 }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                  className="absolute -top-2 -right-2 text-xl font-black pointer-events-none"
                  style={{
                    color: "oklch(0.88 0.18 92)",
                    textShadow: "0 0 12px oklch(0.83 0.16 87 / 80%)",
                  }}
                >
                  +10
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          <p
            className="text-xs font-semibold tracking-widest uppercase"
            style={{ color: "oklch(0.83 0.16 87 / 70%)" }}
          >
            ⚡ Coin Balance
          </p>

          <motion.p
            key={coins}
            initial={{ scale: 1.25 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="font-black tracking-tight leading-none"
            style={{
              fontSize: "clamp(3rem, 10vw, 4.5rem)",
              background:
                "linear-gradient(135deg, oklch(0.92 0.18 92), oklch(0.78 0.16 82))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              filter: "drop-shadow(0 0 16px oklch(0.83 0.16 87 / 40%))",
            }}
          >
            {coins.toLocaleString()}
          </motion.p>

          <p
            className="text-sm font-medium"
            style={{ color: "oklch(0.7 0.015 250)" }}
          >
            ≈{" "}
            <span style={{ color: "oklch(0.83 0.16 87)" }}>
              ₹{rupeesEquivalent}
            </span>{" "}
            redeemable
          </p>
        </div>
      </motion.div>

      {/* Status Message */}
      <AnimatePresence mode="wait">
        {status !== "idle" && (
          <motion.div
            key={status}
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            transition={{ duration: 0.25 }}
            className={`w-full rounded-2xl px-4 py-3 flex items-center gap-3 text-sm font-semibold ${
              status === "success"
                ? "bg-green-900/30 border border-green-600/30 text-green-400"
                : status === "error"
                  ? "bg-red-900/30 border border-red-600/30 text-red-400"
                  : "bg-amber-900/20 border border-amber-600/20 text-amber-400"
            }`}
            data-ocid="earn.error_state"
          >
            {status === "success" ? (
              <CheckCircle className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            {statusMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Watch Ad Button — epic pill */}
      <div className="w-full relative">
        {!btnDisabled && !isLoading && (
          <div
            className="absolute inset-0 rounded-full blur-xl opacity-40 earn-btn-glow"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.85 0.17 90), oklch(0.78 0.16 82))",
            }}
            aria-hidden="true"
          />
        )}
        <Button
          data-ocid="earn.primary_button"
          onClick={handleWatchAd}
          disabled={btnDisabled || isLoading || showInterstitial}
          className={`w-full h-16 rounded-full text-lg font-black tracking-wider transition-all duration-300 relative overflow-hidden ${
            btnDisabled || isLoading
              ? "opacity-40 cursor-not-allowed"
              : "hover:scale-[1.03] active:scale-[0.97]"
          }`}
          style={{
            background:
              btnDisabled || isLoading
                ? "oklch(0.28 0.01 250)"
                : "linear-gradient(135deg, oklch(0.88 0.18 90), oklch(0.76 0.16 80), oklch(0.88 0.18 90))",
            backgroundSize: "200% 100%",
            color: "oklch(0.12 0.005 255)",
            border: "none",
            boxShadow:
              btnDisabled || isLoading
                ? "none"
                : "0 0 0 2px oklch(0.83 0.16 87 / 40%), 0 8px 32px oklch(0.83 0.16 87 / 25%)",
          }}
        >
          {!btnDisabled && !isLoading && (
            <div className="earn-btn-shimmer" aria-hidden="true" />
          )}
          {isLoading ? (
            <span className="flex items-center gap-3 relative z-10">
              <span className="w-5 h-5 rounded-full border-2 border-current border-t-transparent animate-spin" />
              Earning coins...
            </span>
          ) : (
            <span className="flex items-center gap-3 relative z-10">
              <span
                className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{ background: "oklch(0.12 0.005 255 / 25%)" }}
              >
                <Play className="w-5 h-5 fill-current ml-0.5" />
              </span>
              Watch Ad &amp; Earn
              <span
                className="ml-auto text-sm font-bold px-2 py-0.5 rounded-full"
                style={{ background: "oklch(0.12 0.005 255 / 25%)" }}
              >
                +10
              </span>
            </span>
          )}
        </Button>
      </div>

      <AdSlot size="rectangle" className="w-full" />

      {/* Countdown recharge — circular progress */}
      <AnimatePresence>
        {countdown > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex items-center gap-4 w-full rounded-2xl py-5 px-4"
            style={{
              background: "oklch(0.18 0.01 255)",
              border: "1px solid oklch(0.83 0.16 87 / 15%)",
            }}
            data-ocid="earn.loading_state"
          >
            <div className="relative w-20 h-20 shrink-0">
              <svg
                className="w-full h-full -rotate-90"
                viewBox="0 0 88 88"
                aria-hidden="true"
              >
                <title>Recharge countdown</title>
                <circle
                  cx="44"
                  cy="44"
                  r={radius}
                  fill="none"
                  strokeWidth="4"
                  stroke="oklch(0.3 0.01 255)"
                />
                <motion.circle
                  cx="44"
                  cy="44"
                  r={radius}
                  fill="none"
                  strokeWidth="4"
                  stroke="oklch(0.83 0.16 87)"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  animate={{ strokeDashoffset: strokeDash }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  style={{
                    filter: "drop-shadow(0 0 4px oklch(0.83 0.16 87 / 70%))",
                  }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span
                  className="text-lg font-black leading-none"
                  style={{ color: "oklch(0.88 0.17 90)" }}
                >
                  {countdown}
                </span>
                <span
                  className="text-[9px] font-semibold tracking-wider uppercase"
                  style={{ color: "oklch(0.6 0.01 255)" }}
                >
                  sec
                </span>
              </div>
            </div>
            <div>
              <p
                className="font-bold text-sm"
                style={{ color: "oklch(0.88 0.17 90)" }}
              >
                ⚡ Recharging...
              </p>
              <p
                className="text-xs mt-0.5"
                style={{ color: "oklch(0.6 0.01 255)" }}
              >
                Next ad unlocks in {countdown}s
              </p>
              <p
                className="text-xs mt-1"
                style={{ color: "oklch(0.5 0.01 255)" }}
              >
                Cooldown: 30–60s between ads
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* XP Progress */}
      <div
        className="w-full rounded-2xl p-5"
        style={{
          background: "oklch(0.2 0.012 250)",
          border: "1px solid oklch(0.96 0.005 250 / 8%)",
          boxShadow: "0 4px 24px oklch(0 0 0 / 40%)",
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp
              className="w-4 h-4"
              style={{ color: "oklch(0.83 0.16 87)" }}
            />
            <span
              className="text-sm font-bold tracking-wide"
              style={{ color: "oklch(0.88 0.17 90)" }}
            >
              Daily XP
            </span>
          </div>
          <span
            className="text-xs font-semibold px-2 py-1 rounded-full"
            style={{
              background:
                dailyAdsWatched >= MAX_DAILY_ADS
                  ? "oklch(0.45 0.18 25 / 25%)"
                  : "oklch(0.83 0.16 87 / 15%)",
              color:
                dailyAdsWatched >= MAX_DAILY_ADS
                  ? "oklch(0.75 0.18 25)"
                  : "oklch(0.83 0.16 87)",
            }}
            data-ocid="earn.panel"
          >
            {dailyAdsWatched >= MAX_DAILY_ADS
              ? "MAX LEVEL"
              : `${Math.round(progressPct)}%`}
          </span>
        </div>
        <XPBar
          progress={progressPct}
          total={MAX_DAILY_ADS}
          current={dailyAdsWatched}
        />
      </div>

      {/* Earn Stats */}
      <div className="w-full grid grid-cols-2 gap-3">
        <div
          className="rounded-2xl p-4 flex flex-col items-center gap-1"
          style={{
            background: "oklch(0.2 0.012 250)",
            border: "1px solid oklch(0.83 0.16 87 / 12%)",
          }}
        >
          <Coins
            className="w-5 h-5 mb-1"
            style={{ color: "oklch(0.83 0.16 87)" }}
          />
          <p
            className="text-2xl font-black"
            style={{ color: "oklch(0.88 0.17 90)" }}
          >
            {coinsToday}
          </p>
          <p
            className="text-[11px] font-medium text-center"
            style={{ color: "oklch(0.6 0.01 255)" }}
          >
            Coins Today
          </p>
        </div>
        <div
          className="rounded-2xl p-4 flex flex-col items-center gap-1"
          style={{
            background: "oklch(0.2 0.012 250)",
            border: "1px solid oklch(0.55 0.15 145 / 20%)",
          }}
        >
          <Zap
            className="w-5 h-5 mb-1"
            style={{ color: "oklch(0.75 0.16 145)" }}
          />
          <p
            className="text-2xl font-black"
            style={{ color: "oklch(0.78 0.16 145)" }}
          >
            ₹{rupeesEquivalent}
          </p>
          <p
            className="text-[11px] font-medium text-center"
            style={{ color: "oklch(0.6 0.01 255)" }}
          >
            Total Value
          </p>
        </div>
      </div>

      <AdSlot size="banner" className="w-full" />

      {/* Coming Soon section */}
      <div className="w-full">
        <div className="flex items-center gap-2 mb-3">
          <div
            className="h-px flex-1"
            style={{ background: "oklch(0.96 0.005 250 / 10%)" }}
          />
          <span
            className="text-xs font-semibold tracking-widest uppercase px-2"
            style={{ color: "oklch(0.6 0.01 255)" }}
          >
            Upcoming Features
          </span>
          <div
            className="h-px flex-1"
            style={{ background: "oklch(0.96 0.005 250 / 10%)" }}
          />
        </div>

        <div className="grid grid-cols-3 gap-2">
          {COMING_SOON_ITEMS.map(({ icon: Icon, label, color, bgColor }) => (
            <div
              key={label}
              className="rounded-xl p-3 flex flex-col items-center gap-2 relative overflow-hidden"
              style={{
                background: "oklch(0.18 0.01 255)",
                border: "1px solid oklch(0.96 0.005 250 / 8%)",
              }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: bgColor }}
              >
                <Icon className="w-4 h-4" style={{ color }} />
              </div>
              <p
                className="text-[10px] font-semibold text-center leading-tight"
                style={{ color: "oklch(0.7 0.01 255)" }}
              >
                {label}
              </p>
              <span
                className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                style={{
                  background: "oklch(0.83 0.16 87 / 12%)",
                  color: "oklch(0.83 0.16 87)",
                }}
              >
                SOON
              </span>
              <Lock
                className="absolute top-2 right-2 w-3 h-3 opacity-30"
                style={{ color: "oklch(0.7 0.01 255)" }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
