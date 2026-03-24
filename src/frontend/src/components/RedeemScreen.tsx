import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Coins,
  Gift,
  Lock,
  Mail,
  PartyPopper,
  User,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useSubmitRedeemRequest, useUserProfile } from "../hooks/useQueries";

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
  return `${h}h ${m}m ${s}s`;
}

export function RedeemScreen() {
  const { data: profile } = useUserProfile();
  const { identity } = useInternetIdentity();
  const redeemMutation = useSubmitRedeemRequest();

  const coins = profile ? Number(profile.coins) : 0;
  const maxRedeemableCoins = Math.min(coins, MAX_COINS);
  const canRedeem = coins >= MIN_COINS;

  const cooldownRemaining = useCooldownRemaining(profile?.lastRedeemTime);
  const isOnCooldown = cooldownRemaining > 0;

  const [selectedRupees, setSelectedRupees] = useState(50);
  const [rewardType, setRewardType] = useState<RewardType>("google_play");
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
    userName.trim() !== "" &&
    userEmail.includes("@") &&
    clampedSelected >= 50;

  const rewardLabel =
    rewardType === "google_play"
      ? "Google Play Store Gift Card"
      : "Amazon Pay Voucher";

  const handleRedeem = async () => {
    if (!isFormValid) return;
    setRedeemStatus("loading");
    try {
      const code = await redeemMutation.mutateAsync({
        amount: BigInt(clampedSelected),
        rewardType,
        userName: userName.trim(),
        userEmail: userEmail.trim(),
      });

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
      ].join("%0A");
      const mailtoUrl = `mailto:gmrearn@gmail.com?subject=${encodeURIComponent(subject)}&body=${body}`;
      window.open(mailtoUrl, "_blank");

      setRedeemStatus("idle");
      setCongratsCode(code);
    } catch {
      setRedeemStatus("error");
      setTimeout(() => setRedeemStatus("idle"), 3000);
    }
  };

  return (
    <div className="flex flex-col items-center gap-5 px-4 py-6 max-w-md mx-auto">
      {/* Balance Card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-surface rounded-3xl p-6 w-full text-center"
      >
        <div className="inner-panel rounded-2xl p-5 flex flex-col items-center gap-2">
          <div className="w-16 h-16 rounded-full gold-gradient flex items-center justify-center mb-1 shadow-gold">
            <Coins
              className="w-8 h-8"
              style={{ color: "oklch(0.14 0.005 255)" }}
            />
          </div>
          <p className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
            Total Balance
          </p>
          <p className="text-5xl font-extrabold gold-text">
            {coins.toLocaleString()}
          </p>
          <p className="text-muted-foreground text-xs">coins</p>
          <div className="mt-2 px-4 py-1.5 rounded-full inner-panel">
            <p className="text-sm font-semibold text-foreground">
              ≈ ₹{Math.floor(coins / COINS_PER_RUPEE).toLocaleString()}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Cooldown Banner */}
      {isOnCooldown && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-full card-surface rounded-2xl p-5 flex flex-col items-center gap-2"
        >
          <AlertTriangle
            className="w-8 h-8"
            style={{ color: "oklch(0.83 0.16 87)" }}
          />
          <p className="text-sm font-semibold text-foreground">
            24-Hour Cooldown Active
          </p>
          <p className="text-2xl font-extrabold gold-text">
            {formatDuration(cooldownRemaining)}
          </p>
          <p className="text-muted-foreground text-xs">
            Next redeem available after cooldown
          </p>
        </motion.div>
      )}

      {/* Progress to Minimum */}
      {!canRedeem && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-full card-surface rounded-2xl p-5"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-foreground">
              Progress to minimum
            </p>
            <p className="text-sm gold-text font-bold">
              {coins.toLocaleString()} / 5,000
            </p>
          </div>
          <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{
                background:
                  "linear-gradient(90deg, oklch(0.85 0.17 90), oklch(0.78 0.16 82))",
              }}
              initial={{ width: 0 }}
              animate={{ width: `${progressToMin}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
          <p className="text-muted-foreground text-xs mt-2">
            {coinsNeeded.toLocaleString()} more coins needed (minimum ₹50)
          </p>
        </motion.div>
      )}

      {/* Redemption Form */}
      {canRedeem && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-surface rounded-3xl p-6 w-full flex flex-col gap-5"
        >
          {/* Amount Slider */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Gift className="w-4 h-4 gold-text" />
                Select Amount
              </p>
              <div className="inner-panel rounded-full px-3 py-1">
                <span className="text-lg font-extrabold gold-text">
                  ₹{clampedSelected}
                </span>
              </div>
            </div>
            <input
              type="range"
              min={50}
              max={maxRupees}
              step={10}
              value={clampedSelected}
              onChange={(e) => setSelectedRupees(Number(e.target.value))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(90deg, oklch(0.85 0.17 90) 0%, oklch(0.78 0.16 82) ${
                  ((clampedSelected - 50) / Math.max(maxRupees - 50, 1)) * 100
                }%, oklch(0.25 0.01 255) ${
                  ((clampedSelected - 50) / Math.max(maxRupees - 50, 1)) * 100
                }%)`,
              }}
            />
            <div className="flex justify-between mt-1">
              <span className="text-xs text-muted-foreground">₹50 min</span>
              <span className="text-xs text-muted-foreground">
                ₹{maxRupees} max
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1 text-center">
              {requiredCoins.toLocaleString()} coins will be used
            </p>
          </div>

          {/* Reward Type */}
          <div>
            <p className="text-sm font-semibold text-foreground mb-3">
              Select Reward Type
            </p>
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  id: "google_play" as RewardType,
                  label: "Google Play",
                  sub: "Gift Card",
                  emoji: "🎮",
                },
                {
                  id: "amazon_pay" as RewardType,
                  label: "Amazon Pay",
                  sub: "Voucher",
                  emoji: "🛒",
                },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setRewardType(opt.id)}
                  data-ocid={`redeem.${opt.id}.toggle`}
                  className={`inner-panel rounded-2xl p-4 flex flex-col items-center gap-1 transition-all duration-200 ${
                    rewardType === opt.id
                      ? "scale-[1.02]"
                      : "opacity-70 hover:opacity-90"
                  }`}
                  style={
                    rewardType === opt.id
                      ? { outline: "2px solid oklch(0.83 0.16 87)" }
                      : {}
                  }
                >
                  <span className="text-2xl">{opt.emoji}</span>
                  <span className="text-sm font-bold text-foreground">
                    {opt.label}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {opt.sub}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label
              htmlFor="redeem-name"
              className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2"
            >
              <User className="w-4 h-4 gold-text" />
              Your Name
            </label>
            <input
              id="redeem-name"
              data-ocid="redeem.input"
              type="text"
              placeholder="Enter your full name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none mt-1"
              style={{
                background: "oklch(0.18 0.01 255)",
                border: "1px solid oklch(0.28 0.01 255)",
              }}
            />
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="redeem-email"
              className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2"
            >
              <Mail className="w-4 h-4 gold-text" />
              Your Email
              {emailLocked && (
                <Lock className="w-3 h-3 text-muted-foreground" />
              )}
            </label>
            <div className="relative">
              <input
                id="redeem-email"
                data-ocid="redeem.input"
                type="email"
                placeholder="Enter your email address"
                value={userEmail}
                onChange={(e) => !emailLocked && setUserEmail(e.target.value)}
                readOnly={emailLocked}
                className={`w-full rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none mt-1 ${
                  emailLocked ? "cursor-not-allowed opacity-80" : ""
                }`}
                style={{
                  background: emailLocked
                    ? "oklch(0.15 0.01 255)"
                    : "oklch(0.18 0.01 255)",
                  border: `1px solid ${emailLocked ? "oklch(0.83 0.16 87 / 0.3)" : "oklch(0.28 0.01 255)"}`,
                }}
              />
              {emailLocked && (
                <Lock
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4"
                  style={{
                    color: "oklch(0.83 0.16 87 / 0.7)",
                    marginTop: "2px",
                  }}
                />
              )}
            </div>
            {emailLocked && (
              <p className="text-xs text-muted-foreground mt-1">
                Email is locked.{" "}
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
        </motion.div>
      )}

      {/* Error */}
      <AnimatePresence>
        {redeemStatus === "error" && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            data-ocid="redeem.error_state"
            className="w-full rounded-2xl px-4 py-3 flex items-center gap-3 text-sm font-medium bg-red-900/30 border border-red-600/30 text-red-400"
          >
            <AlertTriangle className="w-4 h-4 shrink-0" />
            Failed to process redeem. Please try again.
          </motion.div>
        )}
      </AnimatePresence>

      {/* Redeem Button */}
      <Button
        data-ocid="redeem.submit_button"
        onClick={handleRedeem}
        disabled={!isFormValid || redeemStatus === "loading"}
        className={`w-full h-16 rounded-full text-lg font-bold tracking-wide transition-all duration-300 ${
          !isFormValid || redeemStatus === "loading"
            ? "opacity-50 cursor-not-allowed"
            : "gold-glow hover:scale-[1.02] active:scale-[0.98]"
        }`}
        style={{
          background:
            !isFormValid || redeemStatus === "loading"
              ? "oklch(0.35 0.01 250)"
              : "linear-gradient(135deg, oklch(0.85 0.17 90), oklch(0.78 0.16 82))",
          color: "oklch(0.14 0.005 255)",
          border: "none",
        }}
      >
        {redeemStatus === "loading" ? (
          <span className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full border-2 border-current border-t-transparent animate-spin" />
            Processing...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <Gift className="w-5 h-5" />
            Redeem ₹{canRedeem ? clampedSelected : 0} Now
            <ArrowRight className="w-5 h-5" />
          </span>
        )}
      </Button>

      {canRedeem && !isFormValid && !isOnCooldown && (
        <p className="text-muted-foreground text-xs text-center">
          Fill in name and valid email to redeem
        </p>
      )}

      {/* Coin Economy Info */}
      <div className="card-surface rounded-2xl p-4 w-full">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="inner-panel rounded-xl p-3">
            <p className="text-sm font-bold gold-text">₹50</p>
            <p className="text-muted-foreground text-[10px] mt-0.5">minimum</p>
          </div>
          <div className="inner-panel rounded-xl p-3">
            <p className="text-sm font-bold gold-text">₹250</p>
            <p className="text-muted-foreground text-[10px] mt-0.5">maximum</p>
          </div>
          <div className="inner-panel rounded-xl p-3">
            <p className="text-sm font-bold gold-text">24h</p>
            <p className="text-muted-foreground text-[10px] mt-0.5">cooldown</p>
          </div>
        </div>
      </div>

      {/* Congratulations Dialog */}
      <Dialog open={!!congratsCode} onOpenChange={() => setCongratsCode(null)}>
        <DialogContent
          data-ocid="redeem.dialog"
          className="border-none text-center max-w-sm"
          style={{
            background: "oklch(0.17 0.012 250)",
            border: "1px solid oklch(0.83 0.16 87 / 0.3)",
          }}
        >
          <DialogHeader>
            <div className="flex justify-center mb-2">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
                className="w-20 h-20 rounded-full gold-gradient flex items-center justify-center"
              >
                <PartyPopper
                  className="w-10 h-10"
                  style={{ color: "oklch(0.14 0.005 255)" }}
                />
              </motion.div>
            </div>
            <DialogTitle className="text-2xl font-extrabold gold-text">
              Congratulations! 🎉
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-2">
            <p className="text-foreground text-sm leading-relaxed">
              Your reward will be sent to you in{" "}
              <span className="font-bold gold-text">24-72 hours</span> via
              email.
            </p>
            <div className="inner-panel rounded-2xl px-6 py-3 w-full">
              <p className="text-xs text-muted-foreground mb-1">
                Your Redeem Code
              </p>
              <p className="text-xl font-extrabold gold-text tracking-wider">
                {congratsCode}
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              <span>Coins deducted · Request submitted</span>
            </div>
            <Button
              data-ocid="redeem.close_button"
              onClick={() => setCongratsCode(null)}
              className="w-full rounded-full font-bold"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.85 0.17 90), oklch(0.78 0.16 82))",
                color: "oklch(0.14 0.005 255)",
                border: "none",
              }}
            >
              Awesome!
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
