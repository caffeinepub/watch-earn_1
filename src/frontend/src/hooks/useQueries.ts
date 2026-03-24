import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Notice, RedeemRequest, UserProfile } from "../backend.d";
import { RedeemStatus } from "../backend.d";
import {
  demoEarnCoins,
  demoSubmitRedeem,
  getDemoProfile,
  isDemoLoggedIn,
} from "../utils/demoMode";
import { useActor } from "./useActor";

export { RedeemStatus };

function getLoggedInEmail(): string {
  // Demo account
  const demo = isDemoLoggedIn();
  if (demo) return "demo@gamerearn.com";
  // Regular user
  return localStorage.getItem("ge_user_email") ?? "";
}

export function useUserProfile() {
  const { actor, isFetching } = useActor();
  const demo = isDemoLoggedIn();
  return useQuery<UserProfile | null>({
    queryKey: ["userProfile"],
    queryFn: async () => {
      if (demo) {
        const p = getDemoProfile();
        if (!p) return null;
        // Map demo session to UserProfile shape
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
      if (!actor) return null;
      return actor.getCallerUserProfile();
    },
    enabled: demo || (!!actor && !isFetching),
  });
}

// Alias for backward compat
export const useCallerProfile = useUserProfile;

export function useEarnCoins() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const demo = isDemoLoggedIn();
  return useMutation({
    mutationFn: async () => {
      if (demo) {
        const result = demoEarnCoins(100);
        if (!result.success) throw new Error(result.message);
        return result.newCoins;
      }
      if (!actor) throw new Error("Not connected");
      return actor.earnCoins();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
    },
  });
}

export function useSubmitRedeemRequest() {
  const { actor } = useActor();
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
      if (demo) {
        const result = demoSubmitRedeem(Number(amount), rewardType);
        if (!result.success) throw new Error(result.message);
        const code = result.redeemCode!;
        // Save to backend so admin panel sees it and status can be updated
        if (actor) {
          await actor
            .logRedeemRecord(
              code,
              amount,
              rewardType,
              userName || "Demo User",
              "demo@gamerearn.com", // Always use demo email for filtering consistency
            )
            .catch((e: unknown) =>
              console.warn("Backend log failed (demo):", e),
            );
        }
        return code;
      }

      // Non-demo users: use submitRedeemRequest which deducts coins properly.
      if (!actor) throw new Error("Not connected to backend");
      const code = await actor.submitRedeemRequest(
        amount,
        rewardType,
        userName || "User",
        userEmail || "",
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

export function useUserRedeemHistory() {
  const { actor } = useActor();
  return useQuery<RedeemRequest[]>({
    queryKey: ["redeemHistory"],
    queryFn: async () => {
      // Always fetch from backend and filter by email so that admin
      // approve/reject status is always up-to-date.
      if (!actor) return [];
      const email = getLoggedInEmail();
      if (!email) return [];
      const all = await actor.getAllRedeemRequests();
      return all.filter(
        (r) => r.userEmail.toLowerCase() === email.toLowerCase(),
      );
    },
    enabled: !!actor,
    staleTime: 0,
    refetchOnMount: true,
    refetchInterval: 10_000, // auto-refresh every 10s so status updates appear
  });
}

export function useAllRedeemRequests() {
  const { actor, isFetching } = useActor();
  return useQuery<RedeemRequest[]>({
    queryKey: ["allRedeemRequests"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllRedeemRequests();
    },
    enabled: !!actor && !isFetching,
    refetchOnMount: true,
    refetchInterval: 5_000,
  });
}

export function useApproveRedeemRequest() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (requestId: bigint) => {
      if (!actor) throw new Error("Not connected");
      return actor.approveRedeemRequest(requestId);
    },
    onSuccess: () => {
      // Invalidate both admin list AND user order history so status updates everywhere
      queryClient.invalidateQueries({ queryKey: ["allRedeemRequests"] });
      queryClient.invalidateQueries({ queryKey: ["redeemHistory"] });
    },
  });
}

export function useRejectRedeemRequest() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (requestId: bigint) => {
      if (!actor) throw new Error("Not connected");
      return actor.rejectRedeemRequest(requestId);
    },
    onSuccess: () => {
      // Invalidate both admin list AND user order history so status updates everywhere
      queryClient.invalidateQueries({ queryKey: ["allRedeemRequests"] });
      queryClient.invalidateQueries({ queryKey: ["redeemHistory"] });
    },
  });
}

export function useAllNotices() {
  const { actor, isFetching } = useActor();
  const demo = isDemoLoggedIn();
  return useQuery<Notice[]>({
    queryKey: ["notices"],
    queryFn: async () => {
      if (demo) return [];
      if (!actor) return [];
      return actor.getAllNotices();
    },
    enabled: demo || (!!actor && !isFetching),
    refetchInterval: 5_000,
  });
}

export function usePostNotice() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      title,
      message,
    }: {
      title: string;
      message: string;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.postNotice(title, message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notices"] });
    },
  });
}

export function useEditNotice() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      title,
      message,
    }: {
      id: bigint;
      title: string;
      message: string;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.editNotice(id, title, message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notices"] });
    },
  });
}

export function useDeleteNotice() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Not connected");
      return actor.deleteNotice(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notices"] });
    },
  });
}

export function useTotalUserCount() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["totalUserCount"],
    queryFn: async () => {
      if (!actor) return BigInt(0);
      return actor.getTotalUserCount();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 5_000,
  });
}
