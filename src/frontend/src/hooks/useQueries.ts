import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Notice, RedeemRequest, UserProfile } from "../backend.d";
import { useActor } from "./useActor";

export function useUserProfile() {
  const { actor, isFetching } = useActor();
  return useQuery<UserProfile | null>({
    queryKey: ["userProfile"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: false,
  });
}

export function useEarnCoins() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
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
      if (!actor) throw new Error("Not connected");
      return actor.submitRedeemRequest(amount, rewardType, userName, userEmail);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
      queryClient.invalidateQueries({ queryKey: ["redeemHistory"] });
    },
  });
}

export function useUserRedeemHistory() {
  const { actor, isFetching } = useActor();
  return useQuery<RedeemRequest[]>({
    queryKey: ["redeemHistory"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getUserRedeemHistory();
    },
    enabled: !!actor && !isFetching,
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
  return useQuery<Notice[]>({
    queryKey: ["notices"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllNotices();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 60_000,
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
