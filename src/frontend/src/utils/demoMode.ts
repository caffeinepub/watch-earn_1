// Demo account credentials stored as SHA-256 hashes
// Email: demo@gamerearn.com
// Password: GamerDemo@Test2026#99
const DEMO_EMAIL_HASH =
  "e2bf237e37f6d6b901b24baf194bec8cdbfa52d84d19054f4fdb1b17b4d1e325";
const DEMO_PASS_HASH =
  "c8948bd271841504d4dde42f10a043eb872c24718b1aca29b70dd11f5ab1086b";

const DEMO_SESSION_KEY = "ge_demo_session";
const DEMO_COINS_DEFAULT = 99999999;

async function hashString(str: string): Promise<string> {
  const data = new TextEncoder().encode(str);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function getTodayDateStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export interface DemoOrder {
  id: string;
  redeemCode: string;
  amount: number;
  rewardType: string;
  status: "pending" | "approved" | "rejected";
  createdAt: number;
}

export interface DemoSession {
  email: string;
  coins: number;
  lastResetDate: string;
  orders: DemoOrder[];
  adCooldownUntil: number;
  dailyAdsWatched: number;
  redeemCooldownUntil: number;
}

function loadSession(): DemoSession | null {
  try {
    const raw = localStorage.getItem(DEMO_SESSION_KEY);
    if (!raw) return null;
    const session: DemoSession = JSON.parse(raw);
    // Midnight reset
    const today = getTodayDateStr();
    if (session.lastResetDate !== today) {
      session.coins = DEMO_COINS_DEFAULT;
      session.lastResetDate = today;
      session.dailyAdsWatched = 0;
      session.adCooldownUntil = 0;
      session.redeemCooldownUntil = 0;
      saveSession(session);
    }
    return session;
  } catch {
    return null;
  }
}

function saveSession(session: DemoSession) {
  localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(session));
}

export function isDemoLoggedIn(): boolean {
  return loadSession() !== null;
}

export async function attemptDemoLogin(
  email: string,
  password: string,
): Promise<boolean> {
  const [eh, ph] = await Promise.all([
    hashString(email.trim().toLowerCase()),
    hashString(password),
  ]);
  if (eh === DEMO_EMAIL_HASH && ph === DEMO_PASS_HASH) {
    const existing = loadSession();
    if (!existing) {
      const session: DemoSession = {
        email: email.trim(),
        coins: DEMO_COINS_DEFAULT,
        lastResetDate: getTodayDateStr(),
        orders: [],
        adCooldownUntil: 0,
        dailyAdsWatched: 0,
        redeemCooldownUntil: 0,
      };
      saveSession(session);
    }
    return true;
  }
  return false;
}

export function demoLogout() {
  localStorage.removeItem(DEMO_SESSION_KEY);
}

export function getDemoProfile(): DemoSession | null {
  return loadSession();
}

export function demoEarnCoins(amount: number): {
  success: boolean;
  message: string;
  newCoins: number;
} {
  const session = loadSession();
  if (!session)
    return { success: false, message: "Not logged in", newCoins: 0 };

  // Demo account: no cooldowns, no daily limits
  session.coins += amount;
  session.dailyAdsWatched += 1;
  session.adCooldownUntil = 0; // no cooldown for demo
  saveSession(session);
  return { success: true, message: "Coins earned!", newCoins: session.coins };
}

export function demoSubmitRedeem(
  amount: number,
  rewardType: string,
): { success: boolean; message: string; redeemCode?: string } {
  const session = loadSession();
  if (!session) return { success: false, message: "Not logged in" };

  const coinsNeeded = Math.floor(amount / 0.01); // 100 coins = ₹1
  if (session.coins < coinsNeeded) {
    return { success: false, message: "Insufficient coins" };
  }

  // Demo account: no redeem cooldown
  const redeemCode = `#GE-${Math.floor(1000 + Math.random() * 9000)}`;
  const order: DemoOrder = {
    id: String(Date.now()),
    redeemCode,
    amount,
    rewardType,
    status: "pending",
    createdAt: Date.now(),
  };

  session.coins -= coinsNeeded;
  session.redeemCooldownUntil = 0; // no cooldown for demo
  session.orders.unshift(order);
  saveSession(session);

  return { success: true, message: "Redeem submitted!", redeemCode };
}

export function getDemoOrders(): DemoOrder[] {
  const session = loadSession();
  return session?.orders ?? [];
}
