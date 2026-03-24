import { motion } from "motion/react";

const credits = [
  { icon: "💡", role: "Idea & Concept", name: "Tanmoy Saha" },
  { icon: "🗺️", role: "Planning & Strategy", name: "Tanmoy Saha" },
  { icon: "🎮", role: "Creator & Developer", name: "Tanmoy Saha" },
  { icon: "🛠️", role: "Maintained by", name: "Tanmoy Saha" },
  { icon: "🎨", role: "UI/UX Design", name: "Tanmoy Saha" },
  { icon: "🤖", role: "Development & AI Support", name: "Caffeine AI" },
];

export function CreditsPage() {
  return (
    <div className="px-4 py-8">
      {/* Avatar */}
      <motion.div
        className="flex flex-col items-center mb-8"
        initial={{ opacity: 0, y: -24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div
          className="w-28 h-28 rounded-full flex items-center justify-center mb-4 shadow-lg"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.83 0.16 87), oklch(0.70 0.18 75))",
            boxShadow:
              "0 0 0 4px oklch(0.83 0.16 87 / 0.25), 0 8px 32px oklch(0.83 0.16 87 / 0.18)",
          }}
        >
          <span
            className="font-extrabold text-4xl select-none"
            style={{ color: "oklch(0.14 0.005 255)" }}
          >
            TS
          </span>
        </div>
        <h2 className="text-2xl font-extrabold text-foreground mb-1">
          Tanmoy Saha
        </h2>
        <p className="text-sm" style={{ color: "oklch(0.83 0.16 87)" }}>
          Creator of Gamer Earn
        </p>
      </motion.div>

      {/* Credit Cards */}
      <div className="space-y-3">
        {credits.map((item, i) => (
          <motion.div
            key={item.role}
            className="flex items-center gap-4 rounded-xl px-4 py-3 border border-border/40"
            style={{ background: "oklch(0.17 0.012 250 / 0.7)" }}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, delay: 0.1 + i * 0.07 }}
          >
            <span className="text-2xl">{item.icon}</span>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">{item.role}</p>
              <p
                className="text-sm font-bold"
                style={
                  item.name === "Caffeine AI"
                    ? { color: "oklch(0.75 0.12 250)" }
                    : { color: "oklch(0.83 0.16 87)" }
                }
              >
                {item.name}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.p
        className="text-center text-xs text-muted-foreground/50 mt-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        Gamer Earn — Built with passion 🎮
      </motion.p>
    </div>
  );
}
