import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { Clock, Gamepad2, Gift, LogOut, Star } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { AdSlot } from "./components/AdSlot";
import { EarnScreen } from "./components/EarnScreen";
import { LoginScreen } from "./components/LoginScreen";
import { NotificationsPanel } from "./components/NotificationsPanel";
import { OrderHistory } from "./components/OrderHistory";
import { RedeemScreen } from "./components/RedeemScreen";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useAllNotices, useUserProfile } from "./hooks/useQueries";
import { AdminPage } from "./pages/AdminPage";
import { CreditsPage } from "./pages/CreditsPage";
import { FAQPage } from "./pages/FAQPage";
import { PrivacyPolicyPage } from "./pages/PrivacyPolicyPage";
import { TermsPage } from "./pages/TermsPage";

type Tab = "earn" | "redeem" | "orders" | "credits";
type Page = "app" | "admin" | "terms" | "faq" | "privacy";

function getInitialPage(): Page {
  const path = window.location.pathname;
  if (path.startsWith("/admin")) return "admin";
  if (path.startsWith("/terms")) return "terms";
  if (path.startsWith("/faq")) return "faq";
  if (path.startsWith("/privacy")) return "privacy";
  return "app";
}

function AppShell({ onNavigate }: { onNavigate: (page: Page) => void }) {
  const [activeTab, setActiveTab] = useState<Tab>("earn");
  const { clear, identity, isInitializing } = useInternetIdentity();
  const { data: profile } = useUserProfile();
  const { data: notices = [] } = useAllNotices();
  const coins = profile ? Number(profile.coins) : 0;

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full gold-gradient flex items-center justify-center">
            <Gamepad2
              className="w-6 h-6"
              style={{ color: "oklch(0.14 0.005 255)" }}
            />
          </div>
          <div className="w-5 h-5 rounded-full border-2 border-gold border-t-transparent animate-spin" />
        </div>
      </div>
    );
  }

  if (!identity) {
    return <LoginScreen />;
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "earn", label: "Earn", icon: <Gamepad2 className="w-4 h-4" /> },
    { id: "redeem", label: "Redeem", icon: <Gift className="w-4 h-4" /> },
    { id: "orders", label: "Orders", icon: <Clock className="w-4 h-4" /> },
    { id: "credits", label: "Credits", icon: <Star className="w-4 h-4" /> },
  ];

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
        <div className="max-w-md mx-auto flex items-center justify-between">
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
          <div className="flex items-center gap-2">
            <div className="inner-panel rounded-full px-3 py-1.5 flex items-center gap-1.5">
              <Gamepad2 className="w-3.5 h-3.5 gold-text" />
              <span className="text-xs font-bold gold-text">
                {coins.toLocaleString()}
              </span>
            </div>
            {/* Bell icon with notification dot */}
            <NotificationsPanel notices={notices} />
            <Button
              data-ocid="nav.secondary_button"
              onClick={clear}
              variant="outline"
              size="sm"
              className="rounded-full text-xs border-white/10 hover:border-white/20 hover:bg-white/5"
              style={{ color: "oklch(0.70 0.015 250)" }}
            >
              <LogOut className="w-3.5 h-3.5 mr-1" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Tab nav */}
      <nav className="sticky top-[57px] z-30 card-surface border-b border-border/50 px-4">
        <div className="max-w-md mx-auto flex">
          {tabs.map((tab) => (
            <button
              type="button"
              key={tab.id}
              data-ocid={`nav.${tab.id}.tab`}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1 py-3 text-xs font-semibold transition-all duration-200 border-b-2 ${
                activeTab === tab.id
                  ? "border-gold text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground/70"
              }`}
              style={
                activeTab === tab.id
                  ? { borderColor: "oklch(0.83 0.16 87)" }
                  : {}
              }
            >
              <span className={activeTab === tab.id ? "gold-text" : ""}>
                {tab.icon}
              </span>
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* AdSense: Replace data-ad-client with your Publisher ID */}
      {/* Ad Banner — below tab navigation */}
      <div className="max-w-md mx-auto w-full px-4 py-2">
        <AdSlot size="banner" />
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-md mx-auto">
          <AnimatePresence mode="wait">
            {activeTab === "earn" && (
              <motion.div
                key="earn"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ duration: 0.2 }}
              >
                <EarnScreen />
              </motion.div>
            )}
            {activeTab === "redeem" && (
              <motion.div
                key="redeem"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.2 }}
              >
                <RedeemScreen />
              </motion.div>
            )}
            {activeTab === "orders" && (
              <motion.div
                key="orders"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.2 }}
              >
                <OrderHistory />
              </motion.div>
            )}
            {activeTab === "credits" && (
              <motion.div
                key="credits"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.2 }}
              >
                <CreditsPage />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* AdSense: Replace data-ad-client with your Publisher ID */}
      {/* Ad Banner — above footer */}
      <div className="max-w-md mx-auto w-full px-4 py-3">
        <AdSlot size="banner" />
      </div>

      {/* Footer */}
      <footer className="py-4 text-center flex flex-col items-center gap-1">
        <div className="flex items-center gap-3 flex-wrap justify-center">
          <button
            type="button"
            data-ocid="nav.terms.link"
            onClick={() => onNavigate("terms")}
            className="text-muted-foreground/50 text-xs hover:text-muted-foreground/70 transition-colors underline underline-offset-2"
          >
            Terms & Conditions
          </button>
          <span className="text-muted-foreground/30 text-xs">|</span>
          <button
            type="button"
            data-ocid="nav.faq.link"
            onClick={() => onNavigate("faq")}
            className="text-muted-foreground/50 text-xs hover:text-muted-foreground/70 transition-colors underline underline-offset-2"
          >
            FAQ
          </button>
          <span className="text-muted-foreground/30 text-xs">|</span>
          <button
            type="button"
            data-ocid="nav.privacy.link"
            onClick={() => onNavigate("privacy")}
            className="text-muted-foreground/50 text-xs hover:text-muted-foreground/70 transition-colors underline underline-offset-2"
          >
            Privacy Policy
          </button>
        </div>
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

      <Toaster />
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState<Page>(getInitialPage);

  const navigate = (p: Page) => {
    setPage(p);
    const path = p === "app" ? "/" : `/${p}`;
    window.history.pushState({}, "", path);
  };

  if (page === "admin") {
    return (
      <>
        <AdminPage />
        <Toaster />
      </>
    );
  }

  if (page === "terms") {
    return (
      <>
        <TermsPage onBack={() => navigate("app")} />
        <Toaster />
      </>
    );
  }

  if (page === "faq") {
    return (
      <>
        <FAQPage onBack={() => navigate("app")} />
        <Toaster />
      </>
    );
  }

  if (page === "privacy") {
    return (
      <>
        <PrivacyPolicyPage onBack={() => navigate("app")} />
        <Toaster />
      </>
    );
  }

  return <AppShell onNavigate={navigate} />;
}
