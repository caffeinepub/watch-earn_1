import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  Gamepad2,
  Lock,
  LogOut,
  Search,
  Shield,
  Users,
  XCircle,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import type { RedeemRequest } from "../backend.d";
import { RedeemStatus } from "../backend.d";
import {
  useAllRedeemRequests,
  useApproveRedeemRequest,
  useRejectRedeemRequest,
} from "../hooks/useQueries";

const ADMIN_EMAIL = "gmrearn@gmail.com";
const ADMIN_PASSWORD = "GamerAdmin@06052006#2026.";
const SESSION_KEY = "adminLoggedIn";

function StatusBadge({ status }: { status: RedeemStatus }) {
  if (status === RedeemStatus.approved)
    return (
      <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-green-900/40 text-green-400 border border-green-600/30">
        <CheckCircle2 className="w-3 h-3" /> Approved
      </span>
    );
  if (status === RedeemStatus.rejected)
    return (
      <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-red-900/40 text-red-400 border border-red-600/30">
        <XCircle className="w-3 h-3" /> Rejected
      </span>
    );
  return (
    <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-yellow-900/40 text-yellow-400 border border-yellow-600/30">
      <Clock className="w-3 h-3" /> Pending
    </span>
  );
}

function RequestCard({
  req,
  index,
  onApprove,
  onReject,
  isApproving,
  isRejecting,
}: {
  req: RedeemRequest;
  index: number;
  onApprove: (id: bigint) => void;
  onReject: (id: bigint) => void;
  isApproving: boolean;
  isRejecting: boolean;
}) {
  const date = new Date(Number(req.timestamp) / 1_000_000).toLocaleString(
    "en-IN",
    {
      timeZone: "Asia/Kolkata",
      dateStyle: "medium",
      timeStyle: "short",
    },
  );
  const rewardEmoji = req.rewardType === "google_play" ? "🎮" : "🛒";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      data-ocid={`admin.item.${index + 1}`}
      className="card-surface rounded-2xl p-4 flex flex-col gap-3"
    >
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div>
          <p className="text-xs text-muted-foreground">Code</p>
          <p className="font-extrabold gold-text tracking-wider">{req.code}</p>
        </div>
        <StatusBadge status={req.status} />
      </div>

      <div className="inner-panel rounded-xl p-3 grid grid-cols-2 gap-2 text-sm">
        <div>
          <p className="text-muted-foreground text-[10px] uppercase">Name</p>
          <p className="font-semibold text-foreground text-xs">
            {req.userName}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground text-[10px] uppercase">Email</p>
          <p className="font-semibold text-foreground text-xs truncate">
            {req.userEmail}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground text-[10px] uppercase">Amount</p>
          <p className="font-bold text-foreground">₹{Number(req.amount)}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-[10px] uppercase">Reward</p>
          <p className="font-semibold text-foreground text-xs">
            {rewardEmoji}{" "}
            {req.rewardType === "google_play" ? "Google Play" : "Amazon Pay"}
          </p>
        </div>
        <div className="col-span-2">
          <p className="text-muted-foreground text-[10px] uppercase">Date</p>
          <p className="font-medium text-foreground text-xs">{date}</p>
        </div>
      </div>

      {req.status === RedeemStatus.pending && (
        <div className="flex gap-2">
          <Button
            data-ocid={`admin.confirm_button.${index + 1}`}
            onClick={() => onApprove(req.id)}
            disabled={isApproving || isRejecting}
            className="flex-1 h-9 rounded-xl text-xs font-bold"
            style={{
              background: "oklch(0.40 0.15 145)",
              color: "white",
              border: "none",
            }}
          >
            {isApproving ? (
              <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Approve
              </>
            )}
          </Button>
          <Button
            data-ocid={`admin.delete_button.${index + 1}`}
            onClick={() => onReject(req.id)}
            disabled={isApproving || isRejecting}
            className="flex-1 h-9 rounded-xl text-xs font-bold"
            style={{
              background: "oklch(0.40 0.18 25)",
              color: "white",
              border: "none",
            }}
          >
            {isRejecting ? (
              <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
            ) : (
              <>
                <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
              </>
            )}
          </Button>
        </div>
      )}
    </motion.div>
  );
}

function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [search, setSearch] = useState("");
  const { data: requests, isLoading } = useAllRedeemRequests();
  const approveMutation = useApproveRedeemRequest();
  const rejectMutation = useRejectRedeemRequest();

  const filtered = (requests ?? []).filter((r) =>
    r.code.toLowerCase().includes(search.toLowerCase()),
  );

  const pendingCount = (requests ?? []).filter(
    (r) => r.status === RedeemStatus.pending,
  ).length;

  const approvedCount = (requests ?? []).filter(
    (r) => r.status === RedeemStatus.approved,
  ).length;

  const rejectedCount = (requests ?? []).filter(
    (r) => r.status === RedeemStatus.rejected,
  ).length;

  const uniqueUserCount = new Set(
    (requests ?? []).map((r) => r.userId.toString()),
  ).size;

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
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full gold-gradient flex items-center justify-center shrink-0">
              <Shield
                className="w-4 h-4"
                style={{ color: "oklch(0.14 0.005 255)" }}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-extrabold text-foreground text-sm">
                  Admin Panel
                </p>
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-extrabold tracking-widest uppercase"
                  style={{
                    background:
                      "linear-gradient(135deg, oklch(0.85 0.17 90), oklch(0.78 0.16 82))",
                    color: "oklch(0.14 0.005 255)",
                  }}
                >
                  Admin
                </span>
              </div>
              <p className="text-muted-foreground text-[10px]">
                Admin access only
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {pendingCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold gold-text inner-panel">
                {pendingCount} pending
              </span>
            )}
            <Button
              data-ocid="admin.secondary_button"
              onClick={onLogout}
              variant="outline"
              size="sm"
              className="rounded-full text-xs border-white/10 hover:border-white/20 hover:bg-white/5"
              style={{ color: "oklch(0.70 0.015 250)" }}
            >
              <LogOut className="w-3.5 h-3.5 mr-1" /> Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-6 max-w-2xl mx-auto w-full">
        {/* Search */}
        <div className="relative mb-5">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
            style={{ color: "oklch(0.55 0.01 255)" }}
          />
          <Input
            data-ocid="admin.search_input"
            placeholder="Search by redeem code (e.g. #GE-7482)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 rounded-2xl text-sm"
            style={{
              background: "oklch(0.17 0.012 250)",
              border: "1px solid oklch(0.28 0.01 255)",
              color: "oklch(0.90 0.01 255)",
            }}
          />
        </div>

        {/* Stats - 2x2 grid */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="card-surface rounded-2xl p-3 text-center">
            <p className="text-xl font-extrabold gold-text">
              {(requests ?? []).length}
            </p>
            <p className="text-muted-foreground text-[10px]">Total</p>
          </div>
          <div className="card-surface rounded-2xl p-3 text-center">
            <p className="text-xl font-extrabold text-yellow-400">
              {pendingCount}
            </p>
            <p className="text-muted-foreground text-[10px]">Pending</p>
          </div>
          <div className="card-surface rounded-2xl p-3 text-center">
            <p className="text-xl font-extrabold text-green-400">
              {approvedCount}
            </p>
            <p className="text-muted-foreground text-[10px]">Approved</p>
          </div>
          <div className="card-surface rounded-2xl p-3 text-center">
            <p className="text-xl font-extrabold text-red-400">
              {rejectedCount}
            </p>
            <p className="text-muted-foreground text-[10px]">Rejected</p>
          </div>
          {/* Live Users — full width */}
          <div className="col-span-2 card-surface rounded-2xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="relative">
                <span className="w-2.5 h-2.5 rounded-full bg-green-400 block" />
                <span className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-60" />
              </div>
              <div className="flex items-center gap-1.5">
                <Users
                  className="w-4 h-4"
                  style={{ color: "oklch(0.65 0.01 255)" }}
                />
                <p className="text-muted-foreground text-xs font-medium">
                  Live Users
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-extrabold text-green-400">
                {uniqueUserCount}
              </p>
              <p className="text-muted-foreground text-[10px]">unique users</p>
            </div>
          </div>
        </div>

        {/* List */}
        {isLoading && (
          <div className="flex flex-col gap-3" data-ocid="admin.loading_state">
            {[1, 2, 3].map((i) => (
              <Skeleton
                key={i}
                className="h-44 rounded-2xl"
                style={{ background: "oklch(0.20 0.01 255)" }}
              />
            ))}
          </div>
        )}

        {!isLoading && filtered.length === 0 && (
          <div
            data-ocid="admin.empty_state"
            className="card-surface rounded-3xl p-10 text-center"
          >
            <p className="text-4xl mb-3">🔍</p>
            <p className="text-foreground font-semibold">
              {search ? "No results found" : "No redeem requests yet"}
            </p>
            <p className="text-muted-foreground text-sm mt-1">
              {search
                ? `No code matching "${search}"`
                : "Requests will appear here when users redeem."}
            </p>
          </div>
        )}

        {!isLoading && filtered.length > 0 && (
          <div className="flex flex-col gap-3">
            {filtered.map((req, i) => (
              <RequestCard
                key={String(req.id)}
                req={req}
                index={i}
                onApprove={(id) => approveMutation.mutate(id)}
                onReject={(id) => rejectMutation.mutate(id)}
                isApproving={approveMutation.isPending}
                isRejecting={rejectMutation.isPending}
              />
            ))}
          </div>
        )}
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

function AdminLogin({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = () => {
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, "true");
      onLogin();
    } else {
      setError(true);
      setTimeout(() => setError(false), 3000);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{
        background:
          "linear-gradient(160deg, oklch(0.12 0.008 255) 0%, oklch(0.17 0.012 250) 100%)",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="card-surface rounded-3xl p-8 w-full max-w-sm flex flex-col gap-6"
      >
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-full gold-gradient flex items-center justify-center">
            <Shield
              className="w-8 h-8"
              style={{ color: "oklch(0.14 0.005 255)" }}
            />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-extrabold gold-text">Admin Panel</h1>
            <p className="text-muted-foreground text-sm">
              Gamer Earn — Secure Access
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div>
            <label
              htmlFor="admin-email"
              className="text-sm font-semibold text-foreground mb-1.5 flex items-center gap-2"
            >
              <Gamepad2 className="w-4 h-4 gold-text" /> Email
            </label>
            <Input
              id="admin-email"
              data-ocid="admin.input"
              type="email"
              placeholder="Admin email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              style={{
                background: "oklch(0.18 0.01 255)",
                border: "1px solid oklch(0.28 0.01 255)",
                color: "oklch(0.90 0.01 255)",
              }}
            />
          </div>
          <div>
            <label
              htmlFor="admin-pass"
              className="text-sm font-semibold text-foreground mb-1.5 flex items-center gap-2"
            >
              <Lock className="w-4 h-4 gold-text" /> Password
            </label>
            <div className="relative">
              <Input
                id="admin-pass"
                data-ocid="admin.input"
                type={showPassword ? "text" : "password"}
                placeholder="Admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                className="pr-10"
                style={{
                  background: "oklch(0.18 0.01 255)",
                  border: "1px solid oklch(0.28 0.01 255)",
                  color: "oklch(0.90 0.01 255)",
                }}
              />
              <button
                type="button"
                data-ocid="admin.toggle"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded text-muted-foreground hover:text-yellow-400 transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            data-ocid="admin.error_state"
            className="rounded-xl px-4 py-3 text-sm text-red-400 bg-red-900/30 border border-red-600/30"
          >
            Invalid credentials. Please try again.
          </motion.div>
        )}

        <Button
          data-ocid="admin.submit_button"
          onClick={handleLogin}
          disabled={!email || !password}
          className="w-full h-12 rounded-full font-bold"
          style={{
            background:
              !email || !password
                ? "oklch(0.35 0.01 250)"
                : "linear-gradient(135deg, oklch(0.85 0.17 90), oklch(0.78 0.16 82))",
            color: "oklch(0.14 0.005 255)",
            border: "none",
          }}
        >
          Login to Admin Panel
        </Button>
      </motion.div>
    </div>
  );
}

export function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(
    () => sessionStorage.getItem(SESSION_KEY) === "true",
  );

  const handleLogout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setIsLoggedIn(false);
  };

  if (!isLoggedIn) {
    return <AdminLogin onLogin={() => setIsLoggedIn(true)} />;
  }

  return <AdminDashboard onLogout={handleLogout} />;
}
