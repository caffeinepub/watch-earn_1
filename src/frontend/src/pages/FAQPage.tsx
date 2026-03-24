import { ArrowLeft, ChevronDown, ChevronUp, Gamepad2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

const faqs = [
  {
    q: "Gamer Earn kya hai?",
    a: "Gamer Earn ek free online earning platform hai jahan aap ads dekh ke coins kama sakte ho aur unhe Google Play Gift Card ya Amazon Pay Voucher mein redeem kar sakte ho.",
  },
  {
    q: "Coins kaise kamayein?",
    a: "Earn tab pe jaao aur 'Watch Ad & Earn' button dabao. Har ad dekhne ke baad aapko coins milenge. Ek 30-60 second ka cooldown hoga dono ads ke beech.",
  },
  {
    q: "Ek din mein kitne ads dekh sakte hain?",
    a: "Aap ek din mein maximum 15 ads dekh sakte ho. Yeh limit ad network ki policy ke according hai aur abuse rokne ke liye hai.",
  },
  {
    q: "Coins ko rupees mein kaise convert karein?",
    a: "100 coins = ₹1 ke barabar hote hain. Jaise 5000 coins = ₹50. Minimum ₹50 aur maximum ₹250 ek baar mein redeem kar sakte ho.",
  },
  {
    q: "Redeem kaise karein?",
    a: "Redeem tab pe jaao, reward type chunno (Google Play ya Amazon Pay), amount choose karo, aur 'Redeem Now' button dabao. Aapka request admin ke paas jayega aur 3-7 din mein aapki email pe reward aayega.",
  },
  {
    q: "Minimum redeem amount kitna hai?",
    a: "Minimum ₹50 (5000 coins) aur maximum ₹250 (25000 coins) ek redeem request mein kar sakte ho. ₹10 ke steps mein amount choose kar sakte ho.",
  },
  {
    q: "Reward kitne time mein milta hai?",
    a: "Redeem request submit karne ke baad 3-7 din mein aapki registered email pe reward code bheja jaata hai. Weekends pe thoda zyada time lag sakta hai.",
  },
  {
    q: "Kya har bar redeem kar sakte hain?",
    a: "Nahi. Ek redeem ke baad 24 ghante ka cooldown hota hai. Iske baad hi aap next redeem request kar sakte ho.",
  },
  {
    q: "Kaunse rewards available hain?",
    a: "Abhi do reward options hain: (1) Google Play Gift Card - games aur apps ke liye, (2) Amazon Pay Voucher - Amazon par shopping ke liye. UPI aur Paytm options coming soon hain.",
  },
  {
    q: "Meri email par reward nahi aaya, kya karein?",
    a: "Pehle apna spam/junk folder check karo. Agar 7 din ke baad bhi nahi mila to gmrearn@gmail.com pe contact karo apna redeem code lekar.",
  },
  {
    q: "Account kaise banayein?",
    a: "App kholo, 'Register' button dabao, apna naam, email, aur password dalo. Register karte hi automatic login ho jaata hai.",
  },
  {
    q: "Password bhool gaye, kya karein?",
    a: "Abhi password reset feature nahi hai. Agar access nahi ho raha to gmrearn@gmail.com pe email karo, admin help karega.",
  },
  {
    q: "Kya yeh app free hai?",
    a: "Haan, bilkul free hai! Koi hidden charges nahi hain. Aap ads dekhte ho, coins kamate ho, aur free rewards paate ho.",
  },
  {
    q: "Kya yeh app safe hai?",
    a: "Haan. Gamer Earn ICP (Internet Computer Protocol) blockchain pe hosted hai jo highly secure hai. Aapka data encrypted rehta hai aur kisi third party se share nahi hota.",
  },
  {
    q: "Koi feedback ya complaint kahan dein?",
    a: "Aap usersupport18@gmail.com pe apna feedback ya complaint bhej sakte ho. Hum 24-48 ghante mein respond karte hain.",
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="border border-white/8 rounded-xl overflow-hidden"
      style={{ background: "oklch(0.16 0.008 255 / 0.6)" }}
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3.5 text-left gap-3"
      >
        <span className="text-sm font-semibold text-foreground/90 leading-snug">
          {q}
        </span>
        {open ? (
          <ChevronUp className="w-4 h-4 gold-text shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
        )}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed border-t border-white/5 pt-3">
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function FAQPage({ onBack }: { onBack: () => void }) {
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
        <h1 className="text-2xl font-extrabold text-foreground mb-1">
          Frequently Asked Questions
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          Saare common sawaalon ke jawab yahan hain.
        </p>

        <div className="flex flex-col gap-2">
          {faqs.map((faq) => (
            <FAQItem key={faq.q} q={faq.q} a={faq.a} />
          ))}
        </div>

        <div
          className="mt-8 p-4 rounded-xl border border-white/8 text-center"
          style={{ background: "oklch(0.16 0.008 255 / 0.4)" }}
        >
          <p className="text-sm text-muted-foreground">Aur koi sawaal hai?</p>
          <a
            href="mailto:usersupport18@gmail.com"
            className="text-sm font-semibold gold-text hover:underline"
          >
            usersupport18@gmail.com
          </a>
        </div>

        <p className="text-center text-muted-foreground/30 text-xs mt-8">
          Created and maintained by Tanmoy Saha
        </p>
      </div>
    </div>
  );
}
