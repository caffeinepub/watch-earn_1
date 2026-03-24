// NOTE: AdMob does not work in web browsers.
// This component simulates an interstitial ad with a fake overlay.
// In native Android/iOS apps, real AdMob SDK calls would replace this simulation.

import { Progress } from "@/components/ui/progress";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

interface InterstitialAdProps {
  onClose: () => void;
}

export function InterstitialAd({ onClose }: InterstitialAdProps) {
  const [progress, setProgress] = useState(0);
  const [timeLeft, setTimeLeft] = useState(5);

  useEffect(() => {
    const start = Date.now();
    const duration = 5000;

    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min((elapsed / duration) * 100, 100);
      setProgress(pct);
      setTimeLeft(Math.max(0, Math.ceil((duration - elapsed) / 1000)));

      if (elapsed >= duration) {
        clearInterval(interval);
        setTimeout(onClose, 200);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [onClose]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{ background: "oklch(0.08 0.006 255 / 95%)" }}
        data-ocid="interstitial.modal"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 20 }}
          className="card-surface rounded-3xl p-8 mx-4 w-full max-w-sm text-center"
        >
          {/* Simulated ad banner */}
          <div className="inner-panel rounded-2xl p-6 mb-6 flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-full gold-gradient flex items-center justify-center mb-1">
              <span className="text-2xl">📢</span>
            </div>
            <p className="text-foreground font-semibold text-lg">
              Advertisement
            </p>
            <p className="text-muted-foreground text-sm">
              Sponsored content playing...
            </p>
            {/* Simulated ad content */}
            <div className="w-full h-24 rounded-xl bg-gradient-to-br from-blue-900/40 to-purple-900/40 border border-white/5 flex items-center justify-center">
              <span className="text-muted-foreground text-xs">
                Ad Content Area
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Ad playing...</span>
              <span className="gold-text font-bold">{timeLeft}s</span>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-muted-foreground text-xs mt-2">
              Earn 10 coins after this ad
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
