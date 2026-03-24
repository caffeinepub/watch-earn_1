import { Bell, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { Notice } from "../backend.d";

const SEEN_KEY = "seenNoticeIds";

function getSeenIds(): Set<string> {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function saveSeenIds(ids: Set<string>) {
  localStorage.setItem(SEEN_KEY, JSON.stringify([...ids]));
}

export function NotificationsPanel({ notices }: { notices: Notice[] }) {
  const [open, setOpen] = useState(false);
  const [seenIds, setSeenIds] = useState<Set<string>>(getSeenIds);
  const panelRef = useRef<HTMLDivElement>(null);

  const unreadCount = notices.filter((n) => !seenIds.has(String(n.id))).length;

  const handleOpen = () => {
    setOpen(true);
    // Mark all current notices as seen
    const newSeen = new Set(seenIds);
    for (const n of notices) newSeen.add(String(n.id));
    setSeenIds(newSeen);
    saveSeenIds(newSeen);
  };

  const handleClose = () => setOpen(false);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Button */}
      <button
        type="button"
        data-ocid="notifications.bell_button"
        onClick={open ? handleClose : handleOpen}
        aria-label="Notifications"
        className="relative w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-white/10"
        style={{ color: "oklch(0.70 0.015 250)" }}
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span
            className="absolute top-0.5 right-0.5 w-2.5 h-2.5 rounded-full border-2"
            style={{
              background: "oklch(0.60 0.22 25)",
              borderColor: "oklch(0.14 0.005 255)",
            }}
          />
        )}
      </button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            data-ocid="notifications.panel"
            className="absolute right-0 top-10 w-80 max-w-[calc(100vw-2rem)] rounded-2xl shadow-2xl overflow-hidden z-50"
            style={{
              background: "oklch(0.16 0.010 255)",
              border: "1px solid oklch(0.28 0.01 255)",
            }}
          >
            {/* Panel Header */}
            <div
              className="flex items-center justify-between px-4 py-3 border-b"
              style={{ borderColor: "oklch(0.24 0.01 255)" }}
            >
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 gold-text" />
                <span className="font-bold text-sm text-foreground">
                  News & Updates
                </span>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
                style={{ color: "oklch(0.55 0.01 255)" }}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Notice List */}
            <div className="max-h-72 overflow-y-auto">
              {notices.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <p className="text-2xl mb-2">📭</p>
                  <p className="text-muted-foreground text-sm">
                    No updates yet
                  </p>
                </div>
              ) : (
                <div
                  className="flex flex-col divide-y"
                  style={{ borderColor: "oklch(0.22 0.01 255)" }}
                >
                  {notices.map((notice, i) => {
                    const date = new Date(
                      Number(notice.timestamp) / 1_000_000,
                    ).toLocaleString("en-IN", {
                      timeZone: "Asia/Kolkata",
                      dateStyle: "medium",
                      timeStyle: "short",
                    });
                    return (
                      <motion.div
                        key={String(notice.id)}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className="px-4 py-3"
                        data-ocid={`notification.item.${i + 1}`}
                      >
                        <p className="text-xs font-bold gold-text mb-0.5">
                          {notice.title}
                        </p>
                        <p className="text-xs text-foreground/80 leading-relaxed">
                          {notice.message}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {date}
                        </p>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
