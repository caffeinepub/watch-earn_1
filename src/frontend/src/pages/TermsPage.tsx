import { ArrowLeft, Shield } from "lucide-react";
import { motion } from "motion/react";

const sections = [
  {
    title: "1. Eligibility",
    content:
      "You must be at least 13 years old to use Gamer Earn. By using this platform, you confirm that you are 13 years of age or older. A valid email address is required to receive rewards. We reserve the right to verify eligibility at any time.",
  },
  {
    title: "2. Earning Rules",
    content:
      "Users earn coins by watching ads through the Gamer Earn platform. You may watch a maximum of 15 ads per day. A 30-second cooldown applies between consecutive ad views. Attempting to earn coins through bots, scripts, emulators, or any other automated means is strictly prohibited and will result in immediate account suspension.",
  },
  {
    title: "3. Redemption Rules",
    content:
      "The minimum redemption amount is ₹50 (5,000 coins). The maximum redemption amount is ₹250 per transaction. Each user is limited to one (1) redemption per 24 hours. Coins are deducted immediately upon submitting a redeem request. Rewards are processed within 24–72 hours after admin approval and sent via email.",
  },
  {
    title: "4. Reward Delivery",
    content:
      "Rewards are delivered to the email address provided during redemption. Delivery typically occurs within 24–72 hours after admin approval. Gamer Earn is not responsible for delays caused by third-party email services, incorrect email addresses, or spam filters. Ensure your email address is correct before submitting a redeem request.",
  },
  {
    title: "5. Prohibited Actions",
    content:
      "The following actions are strictly prohibited: using bots, scripts, or automation tools; creating multiple accounts to abuse the reward system; using VPNs or proxies to manipulate location or circumvent limits; sharing or selling accounts; tampering with coin balances or redeem codes; and any form of fraud or misrepresentation.",
  },
  {
    title: "6. Account Suspension",
    content:
      "Violations of these Terms & Conditions may result in immediate and permanent suspension of your account without prior notice. Suspended accounts forfeit all coins and pending rewards. Gamer Earn reserves the right to determine what constitutes a violation at its sole discretion.",
  },
  {
    title: "7. Privacy",
    content:
      "Your personal data (name, email address) is collected solely for the purpose of delivering rewards. We do not sell, share, or rent your personal information to third parties. Data is stored securely and used only for platform operations. By using Gamer Earn, you consent to this data usage.",
  },
  {
    title: "8. Changes to Terms",
    content:
      "Gamer Earn reserves the right to modify, update, or replace these Terms & Conditions at any time without prior notice. Continued use of the platform after changes constitutes acceptance of the new terms. It is your responsibility to review these terms periodically.",
  },
  {
    title: "9. Contact Us",
    content:
      "If you have any questions, concerns, or disputes regarding these terms, please contact us at gmrearn@gmail.com. We aim to respond within 48 hours. For reward-related queries, please include your redeem code in your message.",
  },
];

export function TermsPage({ onBack }: { onBack: () => void }) {
  return (
    <div
      className="min-h-screen flex flex-col"
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
            data-ocid="terms.secondary_button"
            onClick={onBack}
            className="w-9 h-9 rounded-full inner-panel flex items-center justify-center hover:opacity-80 transition-opacity"
          >
            <ArrowLeft
              className="w-4 h-4"
              style={{ color: "oklch(0.83 0.16 87)" }}
            />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full gold-gradient flex items-center justify-center">
              <Shield
                className="w-4 h-4"
                style={{ color: "oklch(0.14 0.005 255)" }}
              />
            </div>
            <div>
              <p className="font-extrabold text-foreground text-sm">
                Terms & Conditions
              </p>
              <p className="text-muted-foreground text-[10px]">
                Gamer Earn Platform Rules
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-6 max-w-2xl mx-auto w-full">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-surface rounded-3xl p-6 mb-6 text-center"
        >
          <div className="w-16 h-16 rounded-full gold-gradient flex items-center justify-center mx-auto mb-3">
            <Shield
              className="w-8 h-8"
              style={{ color: "oklch(0.14 0.005 255)" }}
            />
          </div>
          <h1 className="text-2xl font-extrabold gold-text mb-2">
            Terms & Conditions
          </h1>
          <p className="text-muted-foreground text-sm">
            Please read these terms carefully before using Gamer Earn. By using
            the platform, you agree to all the terms listed below.
          </p>
          <p className="text-muted-foreground text-xs mt-2">
            Last updated: March 2026
          </p>
        </motion.div>

        {/* Sections */}
        <div className="flex flex-col gap-3">
          {sections.map((section, i) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="card-surface rounded-2xl p-5"
            >
              <h2 className="font-extrabold gold-text mb-2 text-sm">
                {section.title}
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {section.content}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Contact box */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-5 inner-panel rounded-2xl p-4 text-center"
        >
          <p className="text-xs text-muted-foreground">
            Questions? Email us at{" "}
            <a
              href="mailto:gmrearn@gmail.com"
              className="gold-text font-semibold hover:underline"
            >
              gmrearn@gmail.com
            </a>
          </p>
        </motion.div>
      </main>

      <footer className="py-4 text-center flex flex-col items-center gap-1">
        <p className="text-muted-foreground/40 text-xs">
          © {new Date().getFullYear()}. Built with ❤️ using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-muted-foreground/60 transition-colors"
          >
            caffeine.ai
          </a>
        </p>
        <p className="text-muted-foreground/30 text-xs">
          Created and maintained by Tanmoy Saha
        </p>
      </footer>
    </div>
  );
}
