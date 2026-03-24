import { ArrowLeft, Gamepad2 } from "lucide-react";
import { motion } from "motion/react";

const sections = [
  {
    title: "Introduction",
    content:
      "Gamer Earn aapki privacy ka poora dhyan rakhta hai. Yeh Privacy Policy batati hai ki hum aapki kaunsi information collect karte hain, use kaise use karte hain, aur aapke rights kya hain. Is app ka use karke aap is policy se agree karte hain.",
  },
  {
    title: "Information We Collect",
    content:
      "Hum aapse yeh information collect karte hain: (1) Account email address - registration ke waqt. (2) Display name - aapka chosen username. (3) Coins balance aur transaction history - platform pe aapki earning activity. (4) Redeem requests - reward type, amount, aur status. (5) Usage data - app usage patterns, ad interaction logs, aur cooldown data. Hum koi sensitive personal data (jaise bank details, Aadhaar, PAN) collect nahi karte.",
  },
  {
    title: "How We Use Your Information",
    content:
      "Aapki information in kamon ke liye use hoti hai: (1) Account management - login, registration, aur authentication. (2) Reward delivery - aapke redeem requests process karna aur reward codes email karna. (3) Anti-abuse protection - fake activity aur bot traffic rokna. (4) App improvement - usage patterns ke basis pe app better banana. (5) Admin communication - important notices aur updates bhejne ke liye. Hum aapki information kabhi third parties ko sell nahi karte.",
  },
  {
    title: "Advertising",
    content:
      "Gamer Earn Google AdSense aur Google Ad Manager ke through ads dikhata hai. Yeh third-party ad networks aapke browser mein cookies use kar sakte hain personalized ads dikhane ke liye. Google ki Privacy Policy apply hoti hai in ads pe. Aap Google ke ad settings mein jaake personalized ads band kar sakte hain: adssettings.google.com. Rewarded video ads dekhne ke baad aapko coins milte hain - yeh voluntary hai.",
  },
  {
    title: "Data Security",
    content:
      "Aapka data ICP (Internet Computer Protocol) blockchain pe secure store hota hai. Passwords hashed form mein store kiye jaate hain - plaintext kabhi nahi. Admin credentials bhi hashed hain. Hum industry-standard security practices follow karte hain. Phir bhi, koi bhi system 100% secure nahi hota - agar koi security concern ho to turant gmrearn@gmail.com pe report karein.",
  },
  {
    title: "Third Party Links",
    content:
      "Is app mein kuch third-party links ho sakte hain (jaise Google Play Store, Amazon). Jab aap in links pe click karte ho, aap un websites ki apni privacy policies ke under aa jaate ho. Gamer Earn in third-party sites ke content ya practices ke liye responsible nahi hai.",
  },
  {
    title: "Children's Privacy",
    content:
      "Gamer Earn sirf 13 saal ya usse zyada umra ke users ke liye hai. Hum jaanboojhkar 13 saal se kam umra ke bachon ka data collect nahi karte. Agar aapko lagta hai kisi minor ne account banaya hai to gmrearn@gmail.com pe report karein - hum us account ko immediately delete kar denge.",
  },
  {
    title: "Data Retention",
    content:
      "Aapka account data tab tak store rehta hai jab tak aapka account active hai. Redeem history aur order records 1 saal tak rakhe jaate hain admin processing ke liye. Agar aap apna account delete karna chahte ho to gmrearn@gmail.com pe contact karein.",
  },
  {
    title: "Changes to This Policy",
    content:
      "Hum is Privacy Policy ko kabhi bhi update kar sakte hain. Agar koi major change hoga to app ke andar notification mil sakta hai. Updated policy ka continued use karna aapki acceptance maan li jaayegi. Regularly is page ko check karte rehein.",
  },
  {
    title: "Contact Us",
    content:
      "Privacy ke baare mein koi bhi sawaal ya concern ho to yahan contact karein:\n\nEmail: gmrearn@gmail.com\nSupport: usersupport18@gmail.com\n\nHum jald se jald respond karte hain.",
  },
];

export function PrivacyPolicyPage({ onBack }: { onBack: () => void }) {
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
            data-ocid="privacy.back.button"
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
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h1 className="text-2xl font-extrabold text-foreground mb-1">
            Privacy Policy
          </h1>
          <p className="text-xs text-muted-foreground mb-6">
            Last updated: March 2026
          </p>

          <div className="flex flex-col gap-4">
            {sections.map((section, i) => (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: i * 0.04 }}
                className="rounded-xl border border-white/8 overflow-hidden"
                style={{ background: "oklch(0.16 0.008 255 / 0.6)" }}
              >
                <div className="px-4 py-3 border-b border-white/5">
                  <h2 className="text-sm font-bold gold-text">
                    {section.title}
                  </h2>
                </div>
                <p className="px-4 py-3 text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                  {section.content}
                </p>
              </motion.div>
            ))}
          </div>

          <div
            className="mt-8 p-4 rounded-xl border border-white/8 text-center"
            style={{ background: "oklch(0.16 0.008 255 / 0.4)" }}
          >
            <p className="text-sm text-muted-foreground mb-1">
              Privacy concern hai?
            </p>
            <a
              href="mailto:gmrearn@gmail.com"
              className="text-sm font-semibold gold-text hover:underline"
            >
              gmrearn@gmail.com
            </a>
          </div>

          <p className="text-center text-muted-foreground/30 text-xs mt-8">
            Created and maintained by Tanmoy Saha
          </p>
        </motion.div>
      </div>
    </div>
  );
}
