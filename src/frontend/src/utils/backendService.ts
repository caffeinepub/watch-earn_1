import type { Notice, RedeemRequest, backendInterface } from "../backend.d";
/**
 * backendService.ts
 * Singleton backend actor — initialized once, reused everywhere.
 * External actors set via setSharedActor() take priority (set by useActor hook).
 */
import { createActorWithConfig } from "../config";

let sharedActor: backendInterface | null = null;
let actorPromise: Promise<backendInterface> | null = null;

/** Called by useActor() once it has a ready actor — this takes priority */
export function setSharedActor(actor: backendInterface) {
  sharedActor = actor;
  actorPromise = Promise.resolve(actor);
}

/** Reset the singleton (used after network errors) */
export function resetActor() {
  sharedActor = null;
  actorPromise = null;
}

function getActor(): Promise<backendInterface> {
  if (sharedActor) return Promise.resolve(sharedActor);
  if (!actorPromise) {
    actorPromise = createActorWithConfig().catch((err) => {
      // Reset so next call retries
      actorPromise = null;
      throw err;
    });
  }
  return actorPromise;
}

// ─── Redeem ───────────────────────────────────────────────────────────────────

export async function logRedeemRecord(
  code: string,
  amount: bigint,
  rewardType: string,
  userName: string,
  userEmail: string,
): Promise<string> {
  const actor = await getActor();
  return actor.logRedeemRecord(code, amount, rewardType, userName, userEmail);
}

export async function getAllRedeemRequests(): Promise<RedeemRequest[]> {
  const actor = await getActor();
  return actor.getAllRedeemRequests();
}

export async function approveRedeemRequest(
  id: bigint,
): Promise<RedeemRequest | null> {
  const actor = await getActor();
  return actor.approveRedeemRequest(id);
}

export async function rejectRedeemRequest(
  id: bigint,
): Promise<RedeemRequest | null> {
  const actor = await getActor();
  return actor.rejectRedeemRequest(id);
}

// ─── Notices ──────────────────────────────────────────────────────────────────

export async function getAllNotices(): Promise<Notice[]> {
  const actor = await getActor();
  return actor.getAllNotices();
}

export async function postNotice(
  title: string,
  message: string,
): Promise<Notice> {
  const actor = await getActor();
  return actor.postNotice(title, message);
}

export async function editNotice(
  id: bigint,
  title: string,
  message: string,
): Promise<Notice | null> {
  const actor = await getActor();
  return actor.editNotice(id, title, message);
}

export async function deleteNotice(id: bigint): Promise<boolean> {
  const actor = await getActor();
  return actor.deleteNotice(id);
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export async function getTotalUserCount(): Promise<bigint> {
  const actor = await getActor();
  return actor.getTotalUserCount();
}

// ─── User Profile (anonymous) ─────────────────────────────────────────────────

export async function getCallerUserProfile() {
  const actor = await getActor();
  return actor.getCallerUserProfile();
}

export async function earnCoins() {
  const actor = await getActor();
  return actor.earnCoins();
}
