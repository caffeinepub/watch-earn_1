import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { RedeemRequest, UserProfile } from "../backend.d";
import { RedeemStatus } from "../backend.d";
import type { Notice } from "../backend.d";
import * as backend from "../utils/backendService";
import {
  demoEarnCoins,
  demoSubmitRedeem,
  getDemoOrders,
  getDemoProfile,
  isDemoLoggedIn,
} from "../utils/demoMode";

export { RedeemStatus };

function getLoggedInEmail(): string {
  if (isDemoLoggedIn()) return "demo@gamerearn.com";
  return localStorage.getItem("ge_user_email") ?? "";
}

// ─── User Profile ───────────────────────────────────────────────────────────────

export function useUserProfile() {
  const demo = isDemoLoggedIn();
  return useQuery<UserProfile | null>({
    queryKey: ["userProfile"],
    queryFn: async () => {
      if (demo) {
        const p = getDemoProfile();
        if (!p) return null;
        return {
          coins: BigInt(p.coins),
          dailyAdsWatched: BigInt(p.dailyAdsWatched),
          lastAdDate: "",
          nextAllowedAdTime: BigInt(0),
          fastClickCount: BigInt(0),
          fastClickDisabledUntil: BigInt(0),
          lastRedeemTime: BigInt(0),
        } as unknown as UserProfile;
      }
      return backend.getCallerUserProfile();
    },
    enabled: true,
    staleTime: 0,
    refetchOnMount: true,
  });
}

export const useCallerProfile = useUserProfile;

// ─── Earn Coins ────────────────────────────────────────────────────────────────

export function useEarnCoins() {
  const queryClient = useQueryClient();
  const demo = isDemoLoggedIn();
  return useMutation({
    mutationFn: async () => {
      if (demo) {
        const result = demoEarnCoins(100);
        if (!result.success) throw new Error(result.message);
        return result.newCoins;
      }
      return backend.earnCoins();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
    },
  });
}

// ─── Submit Redeem ──────────────────────────────────────────────────────────

export function useSubmitRedeemRequest() {
  const queryClient = useQueryClient();
  const demo = isDemoLoggedIn();
  return useMutation({
    mutationFn: async ({
      amount,
      rewardType,
      userName,
      userEmail,
    }: {
      amount: bigint;
      rewardType: string;
      userName: string;
      userEmail: string;
    }): Promise<string> => {
      // Generate a unique code (used for both localStorage and backend)
      const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      let suffix = "";
      for (let i = 0; i < 4; i++)
        suffix += chars[Math.floor(Math.random() * chars.length)];
      const code = `#GE-${suffix}`;

      if (demo) {
        // Save to localStorage with the generated code
        const result = demoSubmitRedeem(Number(amount), rewardType, code);
        if (!result.success) throw new Error(result.message);

        // Also log to backend for admin panel visibility (fire and forget)
        backend
          .logRedeemRecord(
            code,
            amount,
            rewardType,
            "Demo User",
            "demo@gamerearn.com",
          )
          .catch(() => {
            // Silently ignore - order history works via localStorage
          });

        return code;
      }

      // Real user: log to backend
      const effectiveName = userName || "User";
      const effectiveEmail = userEmail || getLoggedInEmail() || "";
      await backend.logRedeemRecord(
        code,
        amount,
        rewardType,
        effectiveName,
        effectiveEmail,
      );
      return code;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
      queryClient.invalidateQueries({ queryKey: ["redeemHistory"] });
      queryClient.invalidateQueries({ queryKey: ["allRedeemRequests"] });
    },
  });
}

// ─── User Order History ────────────────────────────────────────────────────────

export function useUserRedeemHistory() {
  const demo = isDemoLoggedIn();
  return useQuery<RedeemRequest[]>({
    queryKey: ["redeemHistory"],
    queryFn: async () => {
      if (demo) {
        // Demo: always read from localStorage — no backend dependency
        const orders = getDemoOrders();
        return orders.map(
          (o) =>
            ({
              id: BigInt(o.id),
              userId: {} as RedeemRequest["userId"],
              code: o.redeemCode,
              status: o.status as unknown as RedeemStatus,
              amount: BigInt(o.amount),
              rewardType: o.rewardType,
              userName: "Demo User",
              userEmail: "demo@gamerearn.com",
              coins: BigInt(o.amount * 100),
              timestamp: BigInt(o.createdAt * 1_000_000),
            }) as RedeemRequest,
        );
      }

      const email = getLoggedInEmail();
      if (!email) return [];
      const all = await backend.getAllRedeemRequests();
      return all.filter(
        (r) => r.userEmail.toLowerCase() === email.toLowerCase(),
      );
    },
    enabled: true,
    staleTime: 0,
    refetchOnMount: true,
    refetchInterval: 10_000,
  });
}

// ─── Admin: All Requests ────────────────────────────────────────────────────────

export function useAllRedeemRequests() {
  return useQuery<RedeemRequest[]>({
    queryKey: ["allRedeemRequests"],
    queryFn: () => backend.getAllRedeemRequests(),
    enabled: true,
    staleTime: 0,
    refetchOnMount: true,
    // Auto-refresh disabled — use manual refresh button
  });
}

// ─── Admin: Approve / Reject ───────────────────────────────────────────────────

export function useApproveRedeemRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (requestId: bigint) => backend.approveRedeemRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allRedeemRequests"] });
      queryClient.invalidateQueries({ queryKey: ["redeemHistory"] });
    },
  });
}

export function useRejectRedeemRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (requestId: bigint) => backend.rejectRedeemRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allRedeemRequests"] });
      queryClient.invalidateQueries({ queryKey: ["redeemHistory"] });
    },
  });
}

// ─── Notices ────────────────────────────────────────────────────────────────────

export function useAllNotices() {
  return useQuery<Notice[]>({
    queryKey: ["notices"],
    queryFn: () => backend.getAllNotices(),
    enabled: true,
    staleTime: 0,
    refetchOnMount: true,
    refetchInterval: 30_000, // 30s for users to see new notices
  });
}

export function usePostNotice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ title, message }: { title: string; message: string }) =>
      backend.postNotice(title, message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notices"] });
    },
  });
}

export function useEditNotice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      title,
      message,
    }: {
      id: bigint;
      title: string;
      message: string;
    }) => backend.editNotice(id, title, message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notices"] });
    },
  });
}

export function useDeleteNotice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: bigint) => backend.deleteNotice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notices"] });
    },
  });
}

// ─── Stats ─────────────────────────────────────────────────────────────────────

export function useTotalUserCount() {
  return useQuery({
    queryKey: ["totalUserCount"],
    queryFn: () => backend.getTotalUserCount(),
    enabled: true,
    staleTime: 0,
    refetchOnMount: true,
    refetchInterval: 30_000,
  });
}
