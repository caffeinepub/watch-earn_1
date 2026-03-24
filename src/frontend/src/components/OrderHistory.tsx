import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, Clock, Package, RefreshCw, XCircle } from "lucide-react";
import { motion } from "motion/react";
import type { RedeemRequest } from "../backend.d";
import { RedeemStatus } from "../backend.d";
import { useUserRedeemHistory } from "../hooks/useQueries";

function StatusBadge({ status }: { status: RedeemStatus }) {
  if (status === RedeemStatus.approved) {
    return (
      <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-green-900/40 text-green-400 border border-green-600/30">
        <CheckCircle2 className="w-3 h-3" />
        Approved
      </span>
    );
  }
  if (status === RedeemStatus.rejected) {
    return (
      <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-red-900/40 text-red-400 border border-red-600/30">
        <XCircle className="w-3 h-3" />
        Rejected
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-yellow-900/40 text-yellow-400 border border-yellow-600/30">
      <Clock className="w-3 h-3" />
      Pending
    </span>
  );
}

function OrderCard({ req, index }: { req: RedeemRequest; index: number }) {
  const date = new Date(Number(req.timestamp) / 1_000_000).toLocaleString(
    "en-IN",
    {
      timeZone: "Asia/Kolkata",
      dateStyle: "medium",
      timeStyle: "short",
    },
  );
  const rewardEmoji = req.rewardType === "google_play" ? "🎮" : "🛒";
  const rewardLabel =
    req.rewardType === "google_play"
      ? "Google Play Gift Card"
      : "Amazon Pay Voucher";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      data-ocid={`orders.item.${index + 1}`}
      className="card-surface rounded-2xl p-4 flex flex-col gap-3"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <p className="text-xs text-muted-foreground font-mono">Redeem Code</p>
          <p className="font-extrabold gold-text tracking-wider text-base">
            {req.code}
          </p>
        </div>
        <StatusBadge status={req.status} />
      </div>
      <div className="inner-panel rounded-xl p-3 grid grid-cols-2 gap-2 text-sm">
        <div>
          <p className="text-muted-foreground text-[10px] uppercase tracking-wide">
            Amount
          </p>
          <p className="font-bold text-foreground">₹{Number(req.amount)}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-[10px] uppercase tracking-wide">
            Reward
          </p>
          <p className="font-semibold text-foreground text-xs">
            {rewardEmoji} {rewardLabel}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground text-[10px] uppercase tracking-wide">
            Coins Used
          </p>
          <p className="font-bold text-foreground">
            {Number(req.coins).toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground text-[10px] uppercase tracking-wide">
            Date
          </p>
          <p className="font-medium text-foreground text-[11px]">{date}</p>
        </div>
      </div>
      {req.status === RedeemStatus.rejected && (
        <div className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs text-red-400 bg-red-900/20">
          <span className="w-3.5 h-3.5 shrink-0">✗</span>
          Request was rejected. This order will be removed from history within
          24 hours.
        </div>
      )}
      {req.status === RedeemStatus.approved && (
        <div className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs text-green-400 bg-green-900/20">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          Reward has been sent to your email! This order will be removed from
          history within 24 hours of approval.
        </div>
      )}
    </motion.div>
  );
}

export function OrderHistory() {
  const {
    data: orders,
    isLoading,
    isFetching,
    refetch,
  } = useUserRedeemHistory();

  return (
    <div className="flex flex-col gap-4 px-4 py-6 max-w-md mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <div className="w-10 h-10 rounded-2xl gold-gradient flex items-center justify-center">
          <Package
            className="w-5 h-5"
            style={{ color: "oklch(0.14 0.005 255)" }}
          />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-extrabold text-foreground">
            Order History
          </h2>
          <p className="text-xs text-muted-foreground">Your redeem requests</p>
        </div>
        <button
          type="button"
          data-ocid="orders.secondary_button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 transition-all disabled:opacity-40"
        >
          <RefreshCw
            className={`w-3 h-3 ${isFetching ? "animate-spin" : ""}`}
          />
          Refresh
        </button>
      </motion.div>

      {isLoading && (
        <div className="flex flex-col gap-3" data-ocid="orders.loading_state">
          {[1, 2, 3].map((i) => (
            <Skeleton
              key={i}
              className="h-32 rounded-2xl"
              style={{ background: "oklch(0.20 0.01 255)" }}
            />
          ))}
        </div>
      )}

      {!isLoading && (!orders || orders.length === 0) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          data-ocid="orders.empty_state"
          className="card-surface rounded-3xl p-10 flex flex-col items-center gap-3 text-center"
        >
          <span className="text-5xl">📦</span>
          <p className="text-foreground font-semibold">No pending orders</p>
          <p className="text-muted-foreground text-sm">
            No pending orders. Approved orders are automatically removed after
            24 hours.
          </p>
        </motion.div>
      )}

      {!isLoading && orders && orders.length > 0 && (
        <div className="flex flex-col gap-3">
          {orders.map((req, i) => (
            <OrderCard key={String(req.id)} req={req} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
