import { Button } from "@/components/ui/button";
import { Gamepad2, Loader2, LogIn } from "lucide-react";
import { motion } from "motion/react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

const FEATURES = [
  { icon: "🎮", label: "Play games & watch ads to earn coins" },
  { icon: "🔥", label: "Up to 15 ads per day" },
  { icon: "💰", label: "Redeem ₹50 for every 5,000 coins" },
];

export function LoginScreen() {
  const { login, isLoggingIn } = useInternetIdentity();

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{
        background:
          "linear-gradient(160deg, oklch(0.12 0.008 255) 0%, oklch(0.17 0.012 250) 100%)",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="card-surface rounded-3xl p-8 w-full max-w-sm text-center shadow-card"
      >
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full gold-gradient flex items-center justify-center shadow-gold">
            <Gamepad2
              className="w-10 h-10"
              style={{ color: "oklch(0.14 0.005 255)" }}
            />
          </div>
        </div>

        <h1 className="text-2xl font-extrabold text-foreground mb-1">
          Gamer Earn
        </h1>
        <p className="text-muted-foreground text-sm mb-8">
          Watch ads, earn coins, redeem rewards
        </p>

        <div className="inner-panel rounded-2xl p-4 mb-8 text-left space-y-3">
          {FEATURES.map((item) => (
            <div key={item.label} className="flex items-center gap-3">
              <span className="text-lg">{item.icon}</span>
              <p className="text-foreground/80 text-sm">{item.label}</p>
            </div>
          ))}
        </div>

        <Button
          data-ocid="login.primary_button"
          onClick={login}
          disabled={isLoggingIn}
          className="w-full h-14 rounded-full text-base font-bold gold-glow hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.85 0.17 90), oklch(0.78 0.16 82))",
            color: "oklch(0.14 0.005 255)",
            border: "none",
          }}
        >
          {isLoggingIn ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              Connecting...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <LogIn className="w-5 h-5" />
              Login to Start Earning
            </span>
          )}
        </Button>

        <p className="text-muted-foreground text-xs mt-4">
          Secure · Free · No credit card needed
        </p>
      </motion.div>

      <p className="text-muted-foreground/40 text-xs mt-8">
        © {new Date().getFullYear()}. Built with ❤️ using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-muted-foreground transition-colors"
        >
          caffeine.ai
        </a>
      </p>
    </div>
  );
}
