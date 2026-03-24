import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Coins,
  Play,
  TrendingUp,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { useEarnCoins, useUserProfile } from "../hooks/useQueries";
import { IMARewardedAd } from "./IMARewardedAd";

const MAX_DAILY_ADS = 15;

type StatusType =
  | "idle"
  | "wait"
  | "banned"
  | "daily-limit"
  | "success"
  | "error";

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

  const getButtonState = useCallback((): {
    disabled: boolean;
    reason: StatusType | null;
  } => {
    // New user - no profile yet, allow first ad
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
    }
  }, [earnCoinsMutation, refetchProfile]);

  const handleWatchAd = useCallback(async () => {
    // New user - no profile yet, show ad first
    if (!profile) {
      setShowInterstitial(true);
      return;
    }
    const nowNs = BigInt(Date.now()) * BigInt(1_000_000);

    // Check fast-click ban
    if (profile.fastClickDisabledUntil > nowNs) {
      const secsLeft = Math.ceil(
        Number(profile.fastClickDisabledUntil - nowNs) / 1_000_000_000,
      );
      setStatus("banned");
      setStatusMsg(`Too many fast clicks. Wait ${secsLeft}s.`);
      return;
    }

    // Check daily limit
    if (dailyAdsWatched >= MAX_DAILY_ADS) {
      setStatus("daily-limit");
      setStatusMsg("Daily limit reached (15/15). Come back tomorrow!");
      return;
    }

    // Check cooldown
    if (profile.nextAllowedAdTime > nowNs) {
      setStatus("wait");
      setStatusMsg(`Please wait before next ad (${countdown}s)`);
      return;
    }

    // Show the ad
    setShowInterstitial(true);
  }, [profile, dailyAdsWatched, countdown]);

  const { disabled: btnDisabled } = getButtonState();
  const isLoading = earnCoinsMutation.isPending;
  const progressPct = (dailyAdsWatched / MAX_DAILY_ADS) * 100;

  return (
    <div className="flex flex-col items-center gap-6 px-4 py-6 max-w-md mx-auto fade-in">
      {/* IMA Rewarded Ad Overlay */}
      {showInterstitial && (
        <IMARewardedAd
          onRewarded={() => {
            doEarnCoins();
          }}
          onClose={() => setShowInterstitial(false)}
          onError={() => {
            setStatus("error");
            setStatusMsg("Ad failed to load. Try again.");
            setTimeout(() => setStatus("idle"), 3000);
          }}
        />
      )}

      {/* Coin Balance Card */}
      <motion.div
        layout
        className="card-surface rounded-3xl p-6 w-full text-center relative overflow-hidden"
      >
        <div className="inner-panel rounded-2xl p-5 flex flex-col items-center gap-2">
          <div
            className={`relative inline-flex ${coinBounce ? "coin-bounce" : ""}`}
          >
            <div className="w-16 h-16 rounded-full gold-gradient flex items-center justify-center shadow-gold">
              <Coins
                className="w-8 h-8"
                style={{ color: "oklch(0.14 0.005 255)" }}
              />
            </div>
            <AnimatePresence>
              {showPlusCoins && (
                <motion.span
                  key="plus"
                  initial={{ opacity: 1, y: 0 }}
                  animate={{ opacity: 0, y: -50 }}
                  transition={{ duration: 1.2 }}
                  className="absolute -top-2 -right-4 text-lg font-bold gold-text pointer-events-none"
                >
                  +10
                </motion.span>
              )}
            </AnimatePresence>
          </div>
          <p className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
            Your Balance
          </p>
          <motion.p
            key={coins}
            initial={{ scale: 1.2, color: "oklch(0.85 0.17 90)" }}
            animate={{ scale: 1, color: "oklch(0.83 0.16 87)" }}
            className="text-5xl font-extrabold gold-text"
          >
            {coins.toLocaleString()}
          </motion.p>
          <p className="text-muted-foreground text-xs">coins</p>
        </div>
      </motion.div>

      {/* Status Message */}
      <AnimatePresence mode="wait">
        {status !== "idle" && (
          <motion.div
            key={status}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className={`w-full rounded-2xl px-4 py-3 flex items-center gap-3 text-sm font-medium ${
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

      {/* Watch Ad Button */}
      <div className="w-full relative">
        <Button
          data-ocid="earn.primary_button"
          onClick={handleWatchAd}
          disabled={btnDisabled || isLoading || showInterstitial}
          className={`w-full h-16 rounded-full text-lg font-bold tracking-wide transition-all duration-300 ${
            btnDisabled || isLoading
              ? "opacity-50 cursor-not-allowed"
              : "pulse-gold gold-glow hover:scale-[1.02] active:scale-[0.98]"
          }`}
          style={{
            background:
              btnDisabled || isLoading
                ? "oklch(0.35 0.01 250)"
                : "linear-gradient(135deg, oklch(0.85 0.17 90), oklch(0.78 0.16 82))",
            color: "oklch(0.14 0.005 255)",
            border: "none",
          }}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full border-2 border-current border-t-transparent animate-spin" />
              Earning coins...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Play className="w-5 h-5 fill-current" />
              Watch Ad &amp; Earn
            </span>
          )}
        </Button>
      </div>

      {/* Countdown */}
      <AnimatePresence>
        {countdown > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 text-muted-foreground text-sm"
            data-ocid="earn.loading_state"
          >
            <Clock className="w-4 h-4" />
            <span>
              Next ad in{" "}
              <span className="gold-text font-semibold">{countdown}s</span>
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Daily Progress */}
      <div className="card-surface rounded-2xl p-5 w-full">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <TrendingUp className="w-4 h-4 gold-text" />
            Daily Progress
          </div>
          <span
            className={`text-sm font-bold ${
              dailyAdsWatched >= MAX_DAILY_ADS ? "text-red-400" : "gold-text"
            }`}
            data-ocid="earn.panel"
          >
            {dailyAdsWatched} / {MAX_DAILY_ADS}
          </span>
        </div>
        <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{
              background:
                "linear-gradient(90deg, oklch(0.85 0.17 90), oklch(0.78 0.16 82))",
            }}
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </div>
        <p className="text-muted-foreground text-xs mt-2">
          Earn 10 coins per ad · Max {MAX_DAILY_ADS} ads/day
        </p>
      </div>

      {/* Reward info */}
      <div className="inner-panel rounded-2xl px-5 py-4 w-full">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full gold-gradient flex items-center justify-center shrink-0">
            <Coins
              className="w-4 h-4"
              style={{ color: "oklch(0.14 0.005 255)" }}
            />
          </div>
          <div>
            <p className="text-foreground text-sm font-semibold">
              10 coins per ad
            </p>
            <p className="text-muted-foreground text-xs">
              Cooldown: 30–60s between ads
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
