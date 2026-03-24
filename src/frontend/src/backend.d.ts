import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Notice {
    id: bigint;
    title: string;
    message: string;
    timestamp: bigint;
}
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
    /**
     * / Admin: Manual coin adjustment
     */
    adjustUserCoins(user: Principal, coins: bigint): Promise<UserProfile>;
    /**
     * / Approve a redeem request
     */
    approveRedeemRequest(requestId: bigint): Promise<RedeemRequest | null>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    /**
     * / Delete a notice
     */
    deleteNotice(id: bigint): Promise<boolean>;
    /**
     * / Earn coins by watching an ad - with cooldown checks
     */
    earnCoins(): Promise<UserProfile>;
    /**
     * / Edit a notice
     */
    editNotice(id: bigint, title: string, message: string): Promise<Notice | null>;
    /**
     * / Get all notices (public)
     */
    getAllNotices(): Promise<Array<Notice>>;
    /**
     * / Get all redeem requests (admin)
     */
    getAllRedeemRequests(): Promise<Array<RedeemRequest>>;
    /**
     * / Admin: Get all user profiles
     */
    getAllUserProfiles(): Promise<Array<UserProfile>>;
    /**
     * / Returns the current user's profile
     */
    getCallerUserProfile(): Promise<UserProfile>;
    getCallerUserRole(): Promise<UserRole>;
    /**
     * / Utility: Get current date timestamp
     */
    getCurrentDateTimestamp(): Promise<bigint>;
    /**
     * / Get total user count
     */
    getTotalUserCount(): Promise<bigint>;
    /**
     * / Admin: Get user profile by Principal
     */
    getUserProfile(user: Principal): Promise<UserProfile>;
    /**
     * / Get user's own redeem history
     */
    getUserRedeemHistory(): Promise<Array<RedeemRequest>>;
    isCallerAdmin(): Promise<boolean>;
    /**
     * / Post a new notice (admin validated in frontend)
     */
    postNotice(title: string, message: string): Promise<Notice>;
    /**
     * / Reject a redeem request
     */
    rejectRedeemRequest(requestId: bigint): Promise<RedeemRequest | null>;
    /**
     * / Submit a redeem request
     */
    submitRedeemRequest(amount: bigint, rewardType: string, userName: string, userEmail: string): Promise<string>;
}
