import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface RedeemRequest {
    id: bigint;
    status: RedeemStatus;
    userName: string;
    userEmail: string;
    code: string;
    userId: Principal;
    coins: bigint;
    rewardType: string;
    timestamp: bigint;
    amount: bigint;
}
export interface UserProfile {
    dailyAdsWatched: bigint;
    coins: bigint;
    lastAdDate: string;
    lastRedeemTime: bigint;
    fastClickCount: bigint;
    nextAllowedAdTime: bigint;
    fastClickDisabledUntil: bigint;
}
export interface Notice {
    id: bigint;
    title: string;
    message: string;
    timestamp: bigint;
}
export enum RedeemStatus {
    pending = "pending",
    approved = "approved",
    rejected = "rejected"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    adjustUserCoins(user: Principal, coins: bigint): Promise<UserProfile>;
    approveRedeemRequest(requestId: bigint): Promise<RedeemRequest | null>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    earnCoins(): Promise<UserProfile>;
    getAllRedeemRequests(): Promise<Array<RedeemRequest>>;
    getAllUserProfiles(): Promise<Array<UserProfile>>;
    getCallerUserProfile(): Promise<UserProfile>;
    getCallerUserRole(): Promise<UserRole>;
    getCurrentDateTimestamp(): Promise<bigint>;
    getTotalUserCount(): Promise<bigint>;
    getUserProfile(user: Principal): Promise<UserProfile>;
    getUserRedeemHistory(): Promise<Array<RedeemRequest>>;
    isCallerAdmin(): Promise<boolean>;
    rejectRedeemRequest(requestId: bigint): Promise<RedeemRequest | null>;
    submitRedeemRequest(amount: bigint, rewardType: string, userName: string, userEmail: string): Promise<string>;
    getAllNotices(): Promise<Array<Notice>>;
    postNotice(title: string, message: string): Promise<Notice>;
    editNotice(id: bigint, title: string, message: string): Promise<Notice | null>;
    deleteNotice(id: bigint): Promise<boolean>;
}
