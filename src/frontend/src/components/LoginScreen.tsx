import { Button } from "@/components/ui/button";
import { ChevronDown, Gamepad2, Loader2, LogIn, TestTube2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { DemoLoginForm } from "./DemoLoginForm";

const FEATURES = [
  { icon: "🎮", label: "Play games & watch ads to earn coins" },
  { icon: "🔥", label: "Up to 15 ads per day" },
  { icon: "💰", label: "Redeem ₹50 for every 5,000 coins" },
];

interface LoginScreenProps {
  onDemoLogin: () => void;
}

export function LoginScreen({ onDemoLogin }: LoginScreenProps) {
  const { login, isLoggingIn } = useInternetIdentity();
  const [showDemo, setShowDemo] = useState(false);

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

        <p className="text-muted-foreground text-xs mt-4 mb-6">
          Secure · Free · No credit card needed
        </p>

        {/* Demo account toggle */}
        <div className="border-t border-white/10 pt-4">
          <button
            type="button"
            onClick={() => setShowDemo((p) => !p)}
            className="flex items-center gap-2 mx-auto text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <TestTube2
              className="w-3.5 h-3.5"
              style={{ color: "oklch(0.83 0.16 87)" }}
            />
            <span style={{ color: "oklch(0.83 0.16 87)" }}>
              Demo / Test Login
            </span>
            <ChevronDown
              className="w-3.5 h-3.5 transition-transform"
              style={{
                color: "oklch(0.83 0.16 87)",
                transform: showDemo ? "rotate(180deg)" : "rotate(0deg)",
              }}
            />
          </button>

          <AnimatePresence>
            {showDemo && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden mt-4"
              >
                <DemoLoginForm onSuccess={onDemoLogin} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <div className="flex flex-col items-center gap-1 mt-8">
        <p className="text-muted-foreground/40 text-xs">
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
        <p className="text-muted-foreground/30 text-xs">
          Created and maintained by Tanmoy Saha
        </p>
      </div>
    </div>
  );
}
