import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  CheckCircle2,
  Gamepad2,
  MessageSquarePlus,
  Send,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";

const categories = [
  { value: "bug", label: "🐛 Bug Report" },
  { value: "feature", label: "✨ Feature Request" },
  { value: "payment", label: "💳 Payment Issue" },
  { value: "general", label: "💬 General Feedback" },
  { value: "other", label: "📝 Other" },
];

export function FeedbackPage({ onBack }: { onBack: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !category || !message) return;

    const categoryLabel =
      categories.find((c) => c.value === category)?.label ?? category;
    const subject = encodeURIComponent(
      `[Gamer Earn Feedback] ${categoryLabel} from ${name}`,
    );
    const body = encodeURIComponent(
      `Name: ${name}\nEmail: ${email}\nCategory: ${categoryLabel}\n\nMessage:\n${message}\n\n---\nSent via Gamer Earn Feedback Form`,
    );
    window.location.href = `mailto:usersupport18@gmail.com?subject=${subject}&body=${body}`;
    setSubmitted(true);
  };

  return (
    <div
      className="min-h-screen"
      style={{
        background:
          "linear-gradient(160deg, oklch(0.12 0.008 255) 0%, oklch(0.17 0.012 250) 100%)",
      }}
    >
      {/* Header */}
      <header className="sticky top-0 z-40 card-surface border-b border-border/50 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="w-8 h-8 rounded-full flex items-center justify-center border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all"
            data-ocid="feedback.close_button"
          >
            <ArrowLeft className="w-4 h-4 text-muted-foreground" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full gold-gradient flex items-center justify-center">
              <Gamepad2
                className="w-4 h-4"
                style={{ color: "oklch(0.14 0.005 255)" }}
              />
            </div>
            <span className="font-extrabold text-foreground text-sm">
              Gamer Earn
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-1">
          <MessageSquarePlus className="w-6 h-6 gold-text" />
          <h1 className="text-2xl font-extrabold text-foreground">
            Send Feedback
          </h1>
        </div>
        <p className="text-sm text-muted-foreground mb-8">
          Aapka feedback hamein behtar banane mein madad karta hai. Hum 24-48
          ghante mein respond karenge.
        </p>

        {submitted ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center gap-4 py-16 text-center"
            data-ocid="feedback.success_state"
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ background: "oklch(0.25 0.08 145 / 40%)" }}
            >
              <CheckCircle2
                className="w-8 h-8"
                style={{ color: "oklch(0.75 0.18 145)" }}
              />
            </div>
            <h2 className="text-xl font-extrabold text-foreground">
              Feedback Sent!
            </h2>
            <p className="text-sm text-muted-foreground max-w-xs">
              Aapka mail client khul gaya hoga. Email send karne ke baad hum
              24-48 ghante mein respond karenge.
            </p>
            <p className="text-xs text-muted-foreground/50">
              usersupport18@gmail.com
            </p>
            <button
              type="button"
              onClick={onBack}
              className="mt-2 text-sm font-semibold gold-text hover:underline"
              data-ocid="feedback.secondary_button"
            >
              ← Back to App
            </button>
          </motion.div>
        ) : (
          <motion.form
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            onSubmit={handleSubmit}
            className="flex flex-col gap-5"
            data-ocid="feedback.panel"
          >
            {/* Name */}
            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor="feedback-name"
                className="text-sm font-semibold text-foreground/80"
              >
                Your Name
              </Label>
              <Input
                id="feedback-name"
                type="text"
                placeholder="Apna naam likhein"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                data-ocid="feedback.input"
                className="border-white/10 focus:border-white/25 text-sm"
                style={{ background: "oklch(0.16 0.008 255 / 0.7)" }}
              />
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor="feedback-email"
                className="text-sm font-semibold text-foreground/80"
              >
                Email Address
              </Label>
              <Input
                id="feedback-email"
                type="email"
                placeholder="apna@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                data-ocid="feedback.input"
                className="border-white/10 focus:border-white/25 text-sm"
                style={{ background: "oklch(0.16 0.008 255 / 0.7)" }}
              />
            </div>

            {/* Category */}
            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor="feedback-category"
                className="text-sm font-semibold text-foreground/80"
              >
                Category
              </Label>
              <select
                id="feedback-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
                data-ocid="feedback.select"
                className="w-full px-3 py-2 rounded-md text-sm border border-white/10 focus:border-white/25 focus:outline-none focus:ring-1 focus:ring-white/10 text-foreground transition-colors"
                style={{ background: "oklch(0.16 0.008 255 / 0.7)" }}
              >
                <option
                  value=""
                  disabled
                  style={{ background: "oklch(0.16 0.008 255)" }}
                >
                  Category chunein...
                </option>
                {categories.map((c) => (
                  <option
                    key={c.value}
                    value={c.value}
                    style={{ background: "oklch(0.16 0.008 255)" }}
                  >
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Message */}
            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor="feedback-message"
                className="text-sm font-semibold text-foreground/80"
              >
                Message
              </Label>
              <Textarea
                id="feedback-message"
                placeholder="Apna feedback ya issue yahan likhein..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={5}
                data-ocid="feedback.textarea"
                className="border-white/10 focus:border-white/25 text-sm resize-none"
                style={{ background: "oklch(0.16 0.008 255 / 0.7)" }}
              />
            </div>

            {/* Info card */}
            <div
              className="p-3 rounded-xl border border-white/8 flex items-start gap-2.5"
              style={{ background: "oklch(0.16 0.008 255 / 0.4)" }}
            >
              <div
                className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center mt-0.5"
                style={{ background: "oklch(0.45 0.15 87 / 25%)" }}
              >
                <Send
                  className="w-3 h-3"
                  style={{ color: "oklch(0.83 0.16 87)" }}
                />
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Aapka feedback{" "}
                <span
                  className="font-semibold"
                  style={{ color: "oklch(0.83 0.16 87)" }}
                >
                  usersupport18@gmail.com
                </span>{" "}
                pe bheja jaayega. Submit karne ke baad aapka mail client
                khulega.
              </p>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              data-ocid="feedback.submit_button"
              className="w-full gold-gradient font-bold text-sm py-5 rounded-xl flex items-center justify-center gap-2"
              style={{ color: "oklch(0.14 0.005 255)" }}
            >
              <Send className="w-4 h-4" />
              Send Feedback
            </Button>
          </motion.form>
        )}

        <p className="text-center text-muted-foreground/30 text-xs mt-8">
          Created and maintained by Tanmoy Saha
        </p>
      </div>
    </div>
  );
}
