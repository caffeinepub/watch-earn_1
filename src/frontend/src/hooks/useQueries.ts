import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Notice, RedeemRequest, UserProfile } from "../backend.d";
import {
  demoEarnCoins,
  demoSubmitRedeem,
  getDemoOrders,
  getDemoProfile,
  isDemoLoggedIn,
} from "../utils/demoMode";
import { useActor } from "./useActor";

// ── Demo helpers ────────────────────────────────────────────────────────────

function makeDemoProfile(): UserProfile | null {
  const s = getDemoProfile();
  if (!s) return null;
  return {
    id: "demo",
    email: s.email,
    username: "DemoUser",
    coins: BigInt(s.coins),
    // Demo account: no cooldowns ever
    nextAllowedAdTime: BigInt(0),
    fastClickDisabledUntil: BigInt(0),
    dailyAdsWatched: BigInt(0),
    lastAdDate: "",
    lastRedeemTime: BigInt(0),
    fastClickCount: BigInt(0),
  } as unknown as UserProfile;
}

function makeDemoOrders(): RedeemRequest[] {
  return getDemoOrders().map(
    (o) =>
      ({
        id: BigInt(o.id),
        redeemCode: o.redeemCode,
        amount: BigInt(o.amount),
        rewardType: o.rewardType,
        status: o.status,
        userEmail: getDemoProfile()?.email ?? "",
        userName: "DemoUser",
        createdAt: BigInt(o.createdAt),
      }) as unknown as RedeemRequest,
  );
}

// ── Hooks ────────────────────────────────────────────────────────────────────

export function useUserProfile() {
  const { actor, isFetching } = useActor();
  const demo = isDemoLoggedIn();
  return useQuery<UserProfile | null>({
    queryKey: ["userProfile"],
    queryFn: async () => {
      if (demo) return makeDemoProfile();
      if (!actor) return null;
      return actor.getCallerUserProfile();
    },
    enabled: demo || (!!actor && !isFetching),
    refetchInterval: false,
  });
}

export function useEarnCoins() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const demo = isDemoLoggedIn();
  return useMutation({
    mutationFn: async () => {
      if (demo) {
        const result = demoEarnCoins(100);
        if (!result.success) throw new Error(result.message);
        return result;
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
    }) => {
      if (demo) {
        // Save locally for demo user's own order history
        const result = demoSubmitRedeem(Number(amount), rewardType);
        if (!result.success) throw new Error(result.message);
        // Also submit to backend (best-effort) so admin panel can see it
        // Ignore backend errors (cooldown etc.) - demo UX always succeeds
        if (actor) {
          try {
            await actor.submitRedeemRequest(
              amount,
              rewardType,
              "Demo User",
              "demo@gamerearn.com",
            );
          } catch {
            // silently ignore backend errors for demo account
          }
        }
        return result;
      }
      if (!actor) throw new Error("Not connected");
      return actor.submitRedeemRequest(amount, rewardType, userName, userEmail);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
      queryClient.invalidateQueries({ queryKey: ["redeemHistory"] });
      queryClient.invalidateQueries({ queryKey: ["allRedeemRequests"] });
    },
  });
}

export function useUserRedeemHistory() {
  const { actor, isFetching } = useActor();
  const demo = isDemoLoggedIn();
  return useQuery<RedeemRequest[]>({
    queryKey: ["redeemHistory"],
    queryFn: async () => {
      if (demo) return makeDemoOrders();
      if (!actor) return [];
      return actor.getUserRedeemHistory();
    },
    enabled: demo || (!!actor && !isFetching),
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
    refetchInterval: 30_000,
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
      queryClient.invalidateQueries({ queryKey: ["allRedeemRequests"] });
      queryClient.invalidateQueries({ queryKey: ["redeemHistory"] });
    },
  });
}

// Notice hooks
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
    refetchInterval: 60_000,
    refetchOnMount: true,
  });
}

export function usePostNotice() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      title,
      message,
    }: { title: string; message: string }) => {
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
    }: { id: bigint; title: string; message: string }) => {
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
