import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Bell,
  CheckCircle2,
  ChevronRight,
  Clock,
  Eye,
  EyeOff,
  Gamepad2,
  Lock,
  LogOut,
  Pencil,
  PlusCircle,
  RefreshCw,
  Search,
  Shield,
  Trash2,
  TrendingUp,
  Users,
  XCircle,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { RedeemRequest } from "../backend.d";
import { RedeemStatus } from "../backend.d";
import { useActor } from "../hooks/useActor";
import {
  useAllNotices,
  useAllRedeemRequests,
  useApproveRedeemRequest,
  useDeleteNotice,
  useEditNotice,
  usePostNotice,
  useRejectRedeemRequest,
  useTotalUserCount,
} from "../hooks/useQueries";

const ADMIN_EMAIL_HASH =
  "78c1849ab014654d9de21099aa0adf76dda3cd9832aecf559aa43db282dd0179";
const ADMIN_PASSWORD_HASH =
  "613bc3e979135c881e20bc3be0b29243bc73f650fcc95e2ebbc6ded2d76b002f";
const SESSION_KEY = "adminLoggedIn";

async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Animated background particles for login page
function BackgroundParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 20 }, (_, i) => i).map((i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: Math.random() * 4 + 1,
            height: Math.random() * 4 + 1,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            background: `oklch(0.83 0.16 87 / ${Math.random() * 0.3 + 0.1})`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.2, 0.7, 0.2],
          }}
          transition={{
            duration: Math.random() * 4 + 4,
            delay: Math.random() * 3,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />
      ))}
      {/* Geometric lines */}
      <svg
        aria-hidden="true"
        className="absolute inset-0 w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="grid"
            width="60"
            height="60"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 60 0 L 0 0 0 60"
              fill="none"
              stroke="oklch(0.83 0.16 87 / 0.04)"
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
      {/* Glow orbs */}
      <div
        className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl"
        style={{ background: "oklch(0.83 0.16 87 / 0.04)" }}
      />
      <div
        className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-3xl"
        style={{ background: "oklch(0.60 0.18 270 / 0.04)" }}
      />
    </div>
  );
}

function StatusBadge({ status }: { status: RedeemStatus }) {
  if (status === RedeemStatus.approved)
    return (
      <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-green-950/60 text-green-400 border border-green-500/30">
        <CheckCircle2 className="w-3 h-3" /> Approved
      </span>
    );
  if (status === RedeemStatus.rejected)
    return (
      <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-red-950/60 text-red-400 border border-red-500/30">
        <XCircle className="w-3 h-3" /> Rejected
      </span>
    );
  return (
    <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-amber-950/60 text-amber-400 border border-amber-500/30">
      <Clock className="w-3 h-3" /> Pending
    </span>
  );
}

function statusBorderColor(status: RedeemStatus) {
  if (status === RedeemStatus.approved) return "oklch(0.55 0.18 145)";
  if (status === RedeemStatus.rejected) return "oklch(0.55 0.22 25)";
  return "oklch(0.75 0.18 87)";
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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, ease: "easeOut" }}
      data-ocid={`admin.item.${index + 1}`}
      className="relative rounded-2xl overflow-hidden"
      style={{
        background: "oklch(0.18 0.012 252)",
        border: "1px solid oklch(0.96 0.005 250 / 7%)",
        boxShadow: "0 2px 16px oklch(0 0 0 / 30%)",
      }}
    >
      {/* Status color strip */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
        style={{ background: statusBorderColor(req.status) }}
      />

      <div className="pl-5 pr-4 pt-4 pb-4">
        <div className="flex items-start justify-between gap-2 flex-wrap mb-3">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-0.5">
              Redeem Code
            </p>
            <p
              className="font-black text-lg tracking-wider"
              style={{ color: "oklch(0.83 0.16 87)" }}
            >
              {req.code}
            </p>
          </div>
          <StatusBadge status={req.status} />
        </div>

        <div
          className="grid grid-cols-2 md:grid-cols-4 gap-3 rounded-xl p-3 mb-3"
          style={{
            background: "oklch(0.14 0.008 255)",
            border: "1px solid oklch(0.96 0.005 250 / 5%)",
          }}
        >
          <div>
            <p className="text-muted-foreground text-[9px] uppercase tracking-widest mb-0.5">
              Name
            </p>
            <p className="font-semibold text-foreground text-xs">
              {req.userName}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-[9px] uppercase tracking-widest mb-0.5">
              Email
            </p>
            <p className="font-semibold text-foreground text-xs truncate">
              {req.userEmail}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-[9px] uppercase tracking-widest mb-0.5">
              Amount
            </p>
            <p
              className="font-extrabold text-sm"
              style={{ color: "oklch(0.83 0.16 87)" }}
            >
              ₹{Number(req.amount)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-[9px] uppercase tracking-widest mb-0.5">
              Reward
            </p>
            <p className="font-semibold text-foreground text-xs">
              {rewardEmoji}{" "}
              {req.rewardType === "google_play" ? "Google Play" : "Amazon Pay"}
            </p>
          </div>
          <div className="col-span-2 md:col-span-4">
            <p className="text-muted-foreground text-[9px] uppercase tracking-widest mb-0.5">
              Submitted
            </p>
            <p className="font-medium text-foreground text-xs">{date}</p>
          </div>
        </div>

        {req.status === RedeemStatus.pending && (
          <div className="flex gap-2">
            <Button
              data-ocid={`admin.confirm_button.${index + 1}`}
              onClick={() => onApprove(req.id)}
              disabled={isApproving || isRejecting}
              className="flex-1 h-9 rounded-xl text-xs font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.48 0.18 145), oklch(0.42 0.16 148))",
                color: "white",
                border: "none",
                boxShadow: "0 2px 8px oklch(0.48 0.18 145 / 30%)",
              }}
            >
              {isApproving ? (
                <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Approve
                </>
              )}
            </Button>
            <Button
              data-ocid={`admin.delete_button.${index + 1}`}
              onClick={() => onReject(req.id)}
              disabled={isApproving || isRejecting}
              className="flex-1 h-9 rounded-xl text-xs font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.46 0.20 25), oklch(0.40 0.18 28))",
                color: "white",
                border: "none",
                boxShadow: "0 2px 8px oklch(0.46 0.20 25 / 30%)",
              }}
            >
              {isRejecting ? (
                <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : (
                <>
                  <XCircle className="w-3.5 h-3.5 mr-1.5" /> Reject
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

type AdminTab = "requests" | "notices";

function StatCard({
  value,
  label,
  icon,
  iconColor,
  iconBg,
  accentColor,
  large,
  isLive,
}: {
  value: number;
  label: string;
  icon: React.ReactNode;
  iconColor: string;
  iconBg: string;
  accentColor: string;
  large?: boolean;
  isLive?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative rounded-2xl overflow-hidden flex flex-col"
      style={{
        background: "oklch(0.18 0.012 252)",
        border: "1px solid oklch(0.96 0.005 250 / 7%)",
        boxShadow: "0 2px 16px oklch(0 0 0 / 30%)",
      }}
    >
      {/* Top accent line */}
      <div
        className="h-0.5 w-full absolute top-0 left-0 right-0"
        style={{ background: accentColor }}
      />
      <div className="px-4 pt-5 pb-4 flex items-start justify-between gap-3">
        <div>
          <div
            className={`font-black mb-0.5 tabular-nums ${large ? "text-4xl" : "text-3xl"}`}
            style={{ color: iconColor }}
          >
            {isLive ? (
              <span className="flex items-center gap-2">
                {value}
                <span
                  className="relative inline-flex w-2.5 h-2.5"
                  style={{ marginTop: 2 }}
                >
                  <span
                    className="absolute inset-0 rounded-full animate-ping opacity-70"
                    style={{ background: iconColor }}
                  />
                  <span
                    className="relative rounded-full w-2.5 h-2.5"
                    style={{ background: iconColor }}
                  />
                </span>
              </span>
            ) : (
              value
            )}
          </div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {label}
          </p>
        </div>
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: iconBg }}
        >
          <span style={{ color: iconColor }}>{icon}</span>
        </div>
      </div>
    </motion.div>
  );
}

function NoticesSection() {
  const { actor, isFetching: actorFetching } = useActor();
  const actorReady = !!actor && !actorFetching;
  const { data: notices = [], isLoading } = useAllNotices();
  const postMutation = usePostNotice();
  const editMutation = useEditNotice();
  const deleteMutation = useDeleteNotice();

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState<bigint | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editMessage, setEditMessage] = useState("");

  const handlePost = () => {
    if (!title.trim() || !message.trim()) {
      toast.error("Title and message are required");
      return;
    }
    if (!actorReady) {
      toast.error(
        "Backend is connecting... Please wait a moment and try again.",
      );
      return;
    }
    postMutation.mutate(
      { title: title.trim(), message: message.trim() },
      {
        onSuccess: () => {
          setTitle("");
          setMessage("");
          toast.success("Notice published successfully!");
        },
        onError: (_err) => {
          toast.error("Failed to publish notice. Please try again.");
        },
      },
    );
  };

  const startEdit = (id: bigint, t: string, m: string) => {
    setEditingId(id);
    setEditTitle(t);
    setEditMessage(m);
  };

  const handleEdit = () => {
    if (editingId === null) return;
    editMutation.mutate(
      { id: editingId, title: editTitle.trim(), message: editMessage.trim() },
      {
        onSuccess: () => {
          setEditingId(null);
          toast.success("Notice updated!");
        },
        onError: (_err) => {
          toast.error("Failed to update notice. Please try again.");
        },
      },
    );
  };

  const inputStyle = {
    background: "oklch(0.14 0.008 255)",
    border: "1px solid oklch(0.30 0.01 255)",
    color: "oklch(0.90 0.01 255)",
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Compose notice form */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: "oklch(0.18 0.012 252)",
          border: "1px solid oklch(0.96 0.005 250 / 7%)",
          boxShadow: "0 2px 16px oklch(0 0 0 / 30%)",
        }}
      >
        <div
          className="px-5 py-3.5 flex items-center gap-2.5"
          style={{
            background: "oklch(0.14 0.01 255)",
            borderBottom: "1px solid oklch(0.96 0.005 250 / 6%)",
          }}
        >
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: "oklch(0.83 0.16 87 / 15%)" }}
          >
            <PlusCircle
              className="w-3.5 h-3.5"
              style={{ color: "oklch(0.83 0.16 87)" }}
            />
          </div>
          <p className="font-bold text-sm text-foreground">Compose Notice</p>
          <span
            className="ml-auto text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
            style={{
              background: "oklch(0.83 0.16 87 / 12%)",
              color: "oklch(0.83 0.16 87)",
            }}
          >
            Broadcast
          </span>
        </div>
        <div className="p-5 flex flex-col gap-3">
          <div>
            <label
              htmlFor="notice-title"
              className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5 block"
            >
              Title
            </label>
            <Input
              id="notice-title"
              data-ocid="admin.notice_title_input"
              placeholder="e.g. Maintenance Notice"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-xl text-sm h-10"
              style={inputStyle}
            />
          </div>
          <div>
            <label
              htmlFor="notice-message"
              className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5 block"
            >
              Message
            </label>
            <textarea
              id="notice-message"
              data-ocid="admin.notice_message_input"
              placeholder="Write your notice message here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              className="w-full rounded-xl text-sm px-3 py-2.5 resize-none outline-none focus:ring-1 focus:ring-yellow-500/40"
              style={inputStyle}
            />
          </div>
          <Button
            data-ocid="admin.post_notice_button"
            onClick={handlePost}
            disabled={
              !title.trim() ||
              !message.trim() ||
              postMutation.isPending ||
              !actorReady
            }
            className="w-full h-10 rounded-xl font-bold text-sm transition-all hover:opacity-90 active:scale-[0.98]"
            style={{
              background:
                !title.trim() || !message.trim() || !actorReady
                  ? "oklch(0.28 0.01 255)"
                  : "linear-gradient(135deg, oklch(0.85 0.17 90), oklch(0.78 0.16 82))",
              color: "oklch(0.14 0.005 255)",
              border: "none",
            }}
          >
            {postMutation.isPending ? (
              <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
            ) : !actorReady ? (
              <>
                <span className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin mr-1.5" />
                Connecting...
              </>
            ) : (
              <>
                <Bell className="w-3.5 h-3.5 mr-1.5" /> Publish Notice
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Section header */}
      {!isLoading && notices.length > 0 && (
        <div className="flex items-center gap-3">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Published Notices
          </p>
          <div
            className="flex-1 h-px"
            style={{ background: "oklch(0.96 0.005 250 / 8%)" }}
          />
          <span
            className="text-xs font-bold px-2 py-0.5 rounded-full"
            style={{
              background: "oklch(0.83 0.16 87 / 12%)",
              color: "oklch(0.83 0.16 87)",
            }}
          >
            {notices.length}
          </span>
        </div>
      )}

      {isLoading && (
        <div className="flex flex-col gap-3">
          {[1, 2].map((i) => (
            <Skeleton
              key={i}
              className="h-24 rounded-2xl"
              style={{ background: "oklch(0.20 0.01 255)" }}
            />
          ))}
        </div>
      )}

      {!isLoading && notices.length === 0 && (
        <div
          className="rounded-2xl p-10 text-center"
          style={{
            background: "oklch(0.18 0.012 252)",
            border: "1px solid oklch(0.96 0.005 250 / 7%)",
          }}
        >
          <p className="text-4xl mb-3">📭</p>
          <p className="text-foreground font-semibold text-sm">
            No notices published yet
          </p>
          <p className="text-muted-foreground text-xs mt-1">
            Compose your first notice above.
          </p>
        </div>
      )}

      {!isLoading && notices.length > 0 && (
        <div className="flex flex-col gap-3">
          {notices.map((notice, i) => {
            const date = new Date(
              Number(notice.timestamp) / 1_000_000,
            ).toLocaleString("en-IN", {
              timeZone: "Asia/Kolkata",
              dateStyle: "medium",
              timeStyle: "short",
            });
            const isEditing = editingId === notice.id;
            return (
              <motion.div
                key={String(notice.id)}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                data-ocid={`admin.notice.${i + 1}`}
                className="relative rounded-2xl overflow-hidden"
                style={{
                  background: "oklch(0.18 0.012 252)",
                  border: "1px solid oklch(0.96 0.005 250 / 7%)",
                  boxShadow: "0 2px 12px oklch(0 0 0 / 25%)",
                }}
              >
                {/* Pin accent */}
                <div
                  className="absolute left-0 top-0 bottom-0 w-1"
                  style={{ background: "oklch(0.83 0.16 87)" }}
                />
                <div className="pl-5 pr-4 pt-4 pb-4">
                  <AnimatePresence mode="wait">
                    {isEditing ? (
                      <motion.div
                        key="edit"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col gap-2"
                      >
                        <Input
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="rounded-xl text-sm"
                          style={inputStyle}
                        />
                        <textarea
                          value={editMessage}
                          onChange={(e) => setEditMessage(e.target.value)}
                          rows={3}
                          className="w-full rounded-xl text-sm px-3 py-2 resize-none outline-none focus:ring-1 focus:ring-yellow-500/40"
                          style={inputStyle}
                        />
                        <div className="flex gap-2">
                          <Button
                            onClick={handleEdit}
                            disabled={editMutation.isPending}
                            className="flex-1 h-8 rounded-xl text-xs font-bold"
                            style={{
                              background:
                                "linear-gradient(135deg, oklch(0.48 0.18 145), oklch(0.42 0.16 148))",
                              color: "white",
                              border: "none",
                            }}
                          >
                            {editMutation.isPending ? (
                              <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                            ) : (
                              "Save Changes"
                            )}
                          </Button>
                          <Button
                            onClick={() => setEditingId(null)}
                            variant="outline"
                            className="flex-1 h-8 rounded-xl text-xs"
                            style={{
                              borderColor: "oklch(0.28 0.01 255)",
                              color: "oklch(0.70 0.015 250)",
                              background: "transparent",
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="view"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p
                              className="font-extrabold text-sm leading-snug"
                              style={{ color: "oklch(0.83 0.16 87)" }}
                            >
                              {notice.title}
                            </p>
                            <p className="text-xs text-foreground/75 leading-relaxed mt-1">
                              {notice.message}
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {date}
                            </p>
                          </div>
                          <div className="flex gap-1 shrink-0 mt-0.5">
                            <button
                              type="button"
                              data-ocid={`admin.edit_notice.${i + 1}`}
                              onClick={() =>
                                startEdit(
                                  notice.id,
                                  notice.title,
                                  notice.message,
                                )
                              }
                              className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-white/8"
                              style={{ color: "oklch(0.65 0.12 87)" }}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              data-ocid={`admin.delete_notice.${i + 1}`}
                              onClick={() => deleteMutation.mutate(notice.id)}
                              disabled={deleteMutation.isPending}
                              className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-red-900/25"
                              style={{ color: "oklch(0.60 0.22 25)" }}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function LiveClock() {
  const [time, setTime] = useState(() =>
    new Date().toLocaleTimeString("en-IN", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }),
  );
  const [dateStr] = useState(() =>
    new Date().toLocaleDateString("en-IN", {
      timeZone: "Asia/Kolkata",
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
  );
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTime(
        new Date().toLocaleTimeString("en-IN", {
          timeZone: "Asia/Kolkata",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      );
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <div className="hidden sm:flex flex-col items-end">
      <p
        className="text-sm font-bold tabular-nums"
        style={{ color: "oklch(0.83 0.16 87)" }}
      >
        {time}
      </p>
      <p className="text-[10px] text-muted-foreground">{dateStr} IST</p>
    </div>
  );
}

function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<AdminTab>("requests");
  const {
    data: requests,
    isLoading,
    refetch: refetchRequests,
  } = useAllRedeemRequests();
  const approveMutation = useApproveRedeemRequest();
  const rejectMutation = useRejectRedeemRequest();
  const { data: totalUserCount = BigInt(0) } = useTotalUserCount();
  const [approvingId, setApprovingId] = useState<bigint | null>(null);
  const [rejectingId, setRejectingId] = useState<bigint | null>(null);

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
          "linear-gradient(160deg, oklch(0.12 0.008 255) 0%, oklch(0.155 0.012 250) 100%)",
      }}
    >
      {/* Top Header */}
      <header
        className="sticky top-0 z-40 border-b px-4 py-0"
        style={{
          background: "oklch(0.14 0.01 255 / 95%)",
          borderColor: "oklch(0.96 0.005 250 / 8%)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="max-w-5xl mx-auto flex items-center justify-between h-14">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-xs">
            <Gamepad2
              className="w-4 h-4"
              style={{ color: "oklch(0.83 0.16 87)" }}
            />
            <span
              className="font-bold"
              style={{ color: "oklch(0.83 0.16 87)" }}
            >
              Gamer Earn
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="font-semibold text-foreground">Admin Panel</span>
            <span
              className="ml-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold tracking-widest uppercase"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.85 0.17 90), oklch(0.78 0.16 82))",
                color: "oklch(0.14 0.005 255)",
              }}
            >
              Admin
            </span>
          </div>

          <div className="flex items-center gap-4">
            <LiveClock />

            {/* Admin avatar */}
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center font-extrabold text-sm shrink-0"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.85 0.17 90), oklch(0.78 0.16 82))",
                color: "oklch(0.14 0.005 255)",
              }}
            >
              A
            </div>

            {pendingCount > 0 && (
              <span
                className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold"
                style={{
                  background: "oklch(0.75 0.18 87 / 15%)",
                  color: "oklch(0.83 0.16 87)",
                  border: "1px solid oklch(0.83 0.16 87 / 25%)",
                }}
              >
                <Clock className="w-3 h-3" /> {pendingCount} pending
              </span>
            )}

            <Button
              data-ocid="admin.secondary_button"
              onClick={onLogout}
              variant="outline"
              size="sm"
              className="rounded-full text-xs h-8 px-3 gap-1 transition-colors"
              style={{
                borderColor: "oklch(0.96 0.005 250 / 12%)",
                color: "oklch(0.65 0.01 255)",
                background: "transparent",
              }}
            >
              <LogOut className="w-3.5 h-3.5" /> Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Pill Tabs */}
      <div
        className="sticky top-14 z-30 border-b px-4"
        style={{
          background: "oklch(0.14 0.01 255 / 95%)",
          borderColor: "oklch(0.96 0.005 250 / 6%)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="max-w-5xl mx-auto flex gap-2 py-2">
          <button
            type="button"
            onClick={() => setActiveTab("requests")}
            data-ocid="admin.tab"
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200"
            style={
              activeTab === "requests"
                ? {
                    background:
                      "linear-gradient(135deg, oklch(0.85 0.17 90), oklch(0.78 0.16 82))",
                    color: "oklch(0.14 0.005 255)",
                    boxShadow: "0 2px 8px oklch(0.83 0.16 87 / 30%)",
                  }
                : {
                    background: "oklch(0.20 0.01 255)",
                    color: "oklch(0.65 0.01 255)",
                    border: "1px solid oklch(0.96 0.005 250 / 8%)",
                  }
            }
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Redeem Requests
            {(requests ?? []).length > 0 && (
              <span
                className="px-1.5 py-0.5 rounded-full text-[10px] font-extrabold min-w-[18px] text-center"
                style={{
                  background:
                    activeTab === "requests"
                      ? "oklch(0.14 0.005 255 / 30%)"
                      : "oklch(0.83 0.16 87 / 15%)",
                  color:
                    activeTab === "requests"
                      ? "oklch(0.14 0.005 255)"
                      : "oklch(0.83 0.16 87)",
                }}
              >
                {(requests ?? []).length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("notices")}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200"
            style={
              activeTab === "notices"
                ? {
                    background:
                      "linear-gradient(135deg, oklch(0.85 0.17 90), oklch(0.78 0.16 82))",
                    color: "oklch(0.14 0.005 255)",
                    boxShadow: "0 2px 8px oklch(0.83 0.16 87 / 30%)",
                  }
                : {
                    background: "oklch(0.20 0.01 255)",
                    color: "oklch(0.65 0.01 255)",
                    border: "1px solid oklch(0.96 0.005 250 / 8%)",
                  }
            }
          >
            <Bell className="w-3.5 h-3.5" />
            Notices
          </button>
        </div>
      </div>

      <main className="flex-1 px-4 py-7 max-w-5xl mx-auto w-full">
        <AnimatePresence mode="wait">
          {activeTab === "requests" && (
            <motion.div
              key="requests"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                <StatCard
                  value={(requests ?? []).length}
                  label="Total Requests"
                  icon={<TrendingUp className="w-5 h-5" />}
                  iconColor="oklch(0.83 0.16 87)"
                  iconBg="oklch(0.83 0.16 87 / 12%)"
                  accentColor="oklch(0.83 0.16 87)"
                />
                <StatCard
                  value={pendingCount}
                  label="Pending"
                  icon={<Clock className="w-5 h-5" />}
                  iconColor="oklch(0.82 0.15 88)"
                  iconBg="oklch(0.82 0.15 88 / 12%)"
                  accentColor="oklch(0.75 0.15 75)"
                />
                <StatCard
                  value={approvedCount}
                  label="Approved"
                  icon={<CheckCircle2 className="w-5 h-5" />}
                  iconColor="oklch(0.72 0.18 145)"
                  iconBg="oklch(0.72 0.18 145 / 12%)"
                  accentColor="oklch(0.55 0.18 145)"
                />
                <StatCard
                  value={rejectedCount}
                  label="Rejected"
                  icon={<XCircle className="w-5 h-5" />}
                  iconColor="oklch(0.65 0.22 25)"
                  iconBg="oklch(0.65 0.22 25 / 12%)"
                  accentColor="oklch(0.50 0.22 25)"
                />
                <StatCard
                  value={Number(totalUserCount)}
                  label="Total Users"
                  icon={<Users className="w-5 h-5" />}
                  iconColor="oklch(0.72 0.18 260)"
                  iconBg="oklch(0.72 0.18 260 / 12%)"
                  accentColor="oklch(0.60 0.18 260)"
                />
              </div>

              {/* Live Users card */}
              <div
                className="rounded-2xl overflow-hidden mb-6"
                style={{
                  background: "oklch(0.18 0.012 252)",
                  border: "1px solid oklch(0.96 0.005 250 / 7%)",
                  boxShadow: "0 2px 16px oklch(0 0 0 / 30%)",
                }}
              >
                <div
                  className="h-0.5"
                  style={{ background: "oklch(0.65 0.20 145)" }}
                />
                <div className="px-5 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: "oklch(0.65 0.20 145 / 12%)" }}
                    >
                      <Users
                        className="w-5 h-5"
                        style={{ color: "oklch(0.72 0.18 145)" }}
                      />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">
                        Live Users
                      </p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                        Unique active accounts
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className="text-4xl font-black tabular-nums flex items-center gap-2"
                      style={{ color: "oklch(0.72 0.18 145)" }}
                    >
                      {uniqueUserCount}
                      <span className="relative inline-flex w-3 h-3">
                        <span
                          className="absolute inset-0 rounded-full animate-ping opacity-60"
                          style={{ background: "oklch(0.72 0.18 145)" }}
                        />
                        <span
                          className="relative rounded-full w-3 h-3"
                          style={{ background: "oklch(0.72 0.18 145)" }}
                        />
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Search */}
              <div className="flex items-center gap-2 mb-5">
                <div className="relative flex-1">
                  <Search
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4"
                    style={{ color: "oklch(0.50 0.01 255)" }}
                  />
                  <Input
                    data-ocid="admin.search_input"
                    placeholder="Search by redeem code (e.g. #GE-7482)"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 rounded-xl text-sm h-10"
                    style={{
                      background: "oklch(0.18 0.012 252)",
                      border: "1px solid oklch(0.96 0.005 250 / 10%)",
                      color: "oklch(0.90 0.01 255)",
                    }}
                  />
                </div>
                <Button
                  data-ocid="admin.refresh_button"
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    refetchRequests();
                    toast.success("Refreshing requests...");
                  }}
                  disabled={isLoading}
                  className="h-10 w-10 rounded-xl shrink-0"
                  style={{
                    background: "oklch(0.18 0.012 252)",
                    border: "1px solid oklch(0.96 0.005 250 / 10%)",
                    color: "oklch(0.83 0.16 87)",
                  }}
                  title="Refresh requests"
                >
                  <RefreshCw
                    className={`w-4 h-4${isLoading ? " animate-spin" : ""}`}
                  />
                </Button>
              </div>

              {/* Section divider */}
              {!isLoading && filtered.length > 0 && (
                <div className="flex items-center gap-3 mb-4">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                    Requests
                  </p>
                  <div
                    className="flex-1 h-px"
                    style={{ background: "oklch(0.96 0.005 250 / 8%)" }}
                  />
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{
                      background: "oklch(0.83 0.16 87 / 12%)",
                      color: "oklch(0.83 0.16 87)",
                    }}
                  >
                    {filtered.length}
                  </span>
                </div>
              )}

              {/* Loading skeletons */}
              {isLoading && (
                <div
                  className="flex flex-col gap-3"
                  data-ocid="admin.loading_state"
                >
                  {[1, 2, 3].map((i) => (
                    <Skeleton
                      key={i}
                      className="h-48 rounded-2xl"
                      style={{ background: "oklch(0.20 0.01 255)" }}
                    />
                  ))}
                </div>
              )}

              {/* Empty state */}
              {!isLoading && filtered.length === 0 && (
                <div
                  data-ocid="admin.empty_state"
                  className="rounded-2xl p-12 text-center"
                  style={{
                    background: "oklch(0.18 0.012 252)",
                    border: "1px solid oklch(0.96 0.005 250 / 7%)",
                  }}
                >
                  <p className="text-5xl mb-4">🔍</p>
                  <p className="text-foreground font-bold text-base">
                    {search ? "No results found" : "No pending requests"}
                  </p>
                  <p className="text-muted-foreground text-sm mt-1.5">
                    {search
                      ? `No code matching "${search}"`
                      : "Approved/rejected requests are automatically removed after 24 hours."}
                  </p>
                </div>
              )}

              {/* Cards */}
              {!isLoading && filtered.length > 0 && (
                <div className="flex flex-col gap-3">
                  {filtered.map((req, i) => (
                    <RequestCard
                      key={String(req.id)}
                      req={req}
                      index={i}
                      onApprove={(id) => {
                        setApprovingId(id);
                        approveMutation.mutate(id, {
                          onSettled: () => setApprovingId(null),
                        });
                      }}
                      onReject={(id) => {
                        setRejectingId(id);
                        rejectMutation.mutate(id, {
                          onSettled: () => setRejectingId(null),
                        });
                      }}
                      isApproving={approvingId === req.id}
                      isRejecting={rejectingId === req.id}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "notices" && (
            <motion.div
              key="notices"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <NoticesSection />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer
        className="py-5 text-center flex flex-col items-center gap-1 border-t"
        style={{ borderColor: "oklch(0.96 0.005 250 / 6%)" }}
      >
        <p className="text-muted-foreground/30 text-xs">
          ©{new Date().getFullYear()} Gamer Earn — Built with Passion 🎮
        </p>
        <p className="text-muted-foreground/40 text-xs">
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
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return;
    setIsLoading(true);
    const [emailHash, passwordHash] = await Promise.all([
      hashString(email),
      hashString(password),
    ]);
    setIsLoading(false);
    if (
      emailHash === ADMIN_EMAIL_HASH &&
      passwordHash === ADMIN_PASSWORD_HASH
    ) {
      sessionStorage.setItem(SESSION_KEY, "true");
      onLogin();
    } else {
      setError(true);
      setTimeout(() => setError(false), 3000);
    }
  };

  const inputStyle = {
    background: "oklch(0.14 0.008 255)",
    border: "1px solid oklch(0.28 0.01 255)",
    color: "oklch(0.90 0.01 255)",
  };

  return (
    <div
      className="relative min-h-screen flex items-center justify-center px-4"
      style={{
        background:
          "linear-gradient(160deg, oklch(0.11 0.008 255) 0%, oklch(0.155 0.012 250) 100%)",
      }}
    >
      <BackgroundParticles />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-sm"
      >
        {/* Branding above card */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="flex items-center justify-center gap-2 mb-6"
        >
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.85 0.17 90), oklch(0.78 0.16 82))",
            }}
          >
            <Gamepad2
              className="w-4.5 h-4.5"
              style={{ color: "oklch(0.14 0.005 255)" }}
            />
          </div>
          <span
            className="text-base font-extrabold tracking-wide"
            style={{ color: "oklch(0.83 0.16 87)" }}
          >
            Gamer Earn
          </span>
        </motion.div>

        {/* Glass card */}
        <div
          className="rounded-3xl overflow-hidden"
          style={{
            background: "oklch(0.17 0.012 252 / 90%)",
            border: "1px solid oklch(0.96 0.005 250 / 10%)",
            backdropFilter: "blur(20px)",
            boxShadow:
              "0 24px 64px oklch(0 0 0 / 50%), 0 0 0 1px oklch(0.83 0.16 87 / 8%)",
          }}
        >
          {/* Card header with gold gradient top */}
          <div
            className="h-1 w-full"
            style={{
              background:
                "linear-gradient(90deg, oklch(0.85 0.17 90), oklch(0.78 0.16 82), oklch(0.85 0.17 90))",
            }}
          />

          <div className="px-8 pt-8 pb-8 flex flex-col gap-6">
            {/* Admin icon + title */}
            <div className="flex flex-col items-center gap-4">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{
                  background:
                    "linear-gradient(135deg, oklch(0.85 0.17 90), oklch(0.78 0.16 82))",
                  boxShadow: "0 8px 24px oklch(0.83 0.16 87 / 30%)",
                }}
              >
                <Shield
                  className="w-8 h-8"
                  style={{ color: "oklch(0.14 0.005 255)" }}
                />
              </div>
              <div className="text-center">
                <h1
                  className="text-xl font-extrabold"
                  style={{ color: "oklch(0.83 0.16 87)" }}
                >
                  Admin Panel
                </h1>
                <p className="text-muted-foreground text-xs mt-0.5">
                  Secure access — authorized personnel only
                </p>
              </div>
            </div>

            {/* Form */}
            <div className="flex flex-col gap-4">
              <div>
                <label
                  htmlFor="admin-email"
                  className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5 flex items-center gap-1.5"
                >
                  <Gamepad2
                    className="w-3 h-3"
                    style={{ color: "oklch(0.83 0.16 87)" }}
                  />
                  Email Address
                </label>
                <Input
                  id="admin-email"
                  data-ocid="admin.input"
                  type="email"
                  placeholder="Admin email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  className="h-11 rounded-xl text-sm"
                  style={inputStyle}
                />
              </div>
              <div>
                <label
                  htmlFor="admin-pass"
                  className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5 flex items-center gap-1.5"
                >
                  <Lock
                    className="w-3 h-3"
                    style={{ color: "oklch(0.83 0.16 87)" }}
                  />
                  Password
                </label>
                <div className="relative">
                  <Input
                    id="admin-pass"
                    data-ocid="admin.password_input"
                    type={showPassword ? "text" : "password"}
                    placeholder="Admin password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                    className="pr-10 h-11 rounded-xl text-sm"
                    style={inputStyle}
                  />
                  <button
                    type="button"
                    data-ocid="admin.toggle"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded text-muted-foreground hover:text-yellow-400 transition-colors"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
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

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -6, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, y: -6, height: 0 }}
                  data-ocid="admin.error_state"
                  className="rounded-xl px-4 py-3 text-sm text-red-400 bg-red-950/50 border border-red-500/30 flex items-center gap-2"
                >
                  <XCircle className="w-4 h-4 shrink-0" />
                  Invalid credentials. Please try again.
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <Button
              data-ocid="admin.submit_button"
              onClick={handleLogin}
              disabled={!email || !password || isLoading}
              className="w-full h-12 rounded-xl font-bold text-sm transition-all hover:opacity-90 active:scale-[0.98]"
              style={{
                background:
                  !email || !password
                    ? "oklch(0.28 0.01 255)"
                    : "linear-gradient(135deg, oklch(0.85 0.17 90), oklch(0.78 0.16 82))",
                color:
                  !email || !password
                    ? "oklch(0.50 0.01 255)"
                    : "oklch(0.14 0.005 255)",
                border: "none",
                boxShadow:
                  !email || !password
                    ? "none"
                    : "0 4px 16px oklch(0.83 0.16 87 / 25%)",
              }}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                  Verifying...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Login to Admin Panel
                </span>
              )}
            </Button>
          </div>
        </div>

        <p className="text-center text-[10px] text-muted-foreground/40 mt-4">
          Admin access only · Gamer Earn © {new Date().getFullYear()}
        </p>
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
