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
     * / Admin: Manual coin adjustment for user
     */
    adjustUserCoins(user: Principal, coins: bigint): Promise<UserProfile>;
    /**
     * / Approve a redeem request (admin only)
     */
    approveRedeemRequest(requestId: bigint): Promise<RedeemRequest | null>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    /**
     * / Earn coins by watching an ad - with cooldown checks
     */
    earnCoins(): Promise<UserProfile>;
    /**
     * / Get all redeem requests (admin only)
     */
    getAllRedeemRequests(): Promise<Array<RedeemRequest>>;
    /**
     * / Admin: Get all user profiles (admin only)
     */
    getAllUserProfiles(): Promise<Array<UserProfile>>;
    /**
     * / Returns the current user's profile, creating it if it doesn't exist
     */
    getCallerUserProfile(): Promise<UserProfile>;
    getCallerUserRole(): Promise<UserRole>;
    /**
     * / Utility: Get current date (YYYY-MM-DD)
     */
    getCurrentDateTimestamp(): Promise<bigint>;
    /**
     * / Admin: Get user profile by Principal (admin only)
     */
    getUserProfile(user: Principal): Promise<UserProfile>;
    /**
     * / Get user's redeem history
     */
    getUserRedeemHistory(): Promise<Array<RedeemRequest>>;
    isCallerAdmin(): Promise<boolean>;
    /**
     * / Reject a redeem request (admin only)
     */
    rejectRedeemRequest(requestId: bigint): Promise<RedeemRequest | null>;
    /**
     * / Submit a redeem request for coins
     */
    submitRedeemRequest(amount: bigint, rewardType: string, userName: string, userEmail: string): Promise<string>;
}
