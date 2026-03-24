import Int "mo:core/Int";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";

import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";


actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  type UserProfile = {
    coins : Nat;
    dailyAdsWatched : Nat;
    lastAdDate : Text;
    nextAllowedAdTime : Int;
    fastClickCount : Nat;
    fastClickDisabledUntil : Int;
    lastRedeemTime : Int;
  };

  module UserProfile {
    public func compare(x : UserProfile, y : UserProfile) : { #less; #equal; #greater } {
      Int.compare(x.nextAllowedAdTime, y.nextAllowedAdTime);
    };
  };

  type RedeemStatus = { #pending; #approved; #rejected };

  type RedeemRequest = {
    id : Nat;
    userId : Principal;
    code : Text;
    status : RedeemStatus;
    amount : Nat;
    rewardType : Text;
    userName : Text;
    userEmail : Text;
    coins : Nat;
    timestamp : Int;
  };

  module RedeemRequest {
    public func compare(x : RedeemRequest, y : RedeemRequest) : { #less; #equal; #greater } {
      Int.compare(y.timestamp, x.timestamp);
    };
  };

  type Notice = {
    id : Nat;
    title : Text;
    message : Text;
    timestamp : Int;
  };

  module Notice {
    public func compare(x : Notice, y : Notice) : { #less; #equal; #greater } {
      Int.compare(y.timestamp, x.timestamp);
    };
  };

  let dailyLimit = 15;
  let coinsPerAd = 10;
  let minRedeemCoins = 5000;
  let redeemCooldownNs : Int = 86_400_000_000_000;
  let deleteAfterNs : Int = 86_400_000_000_000; // 24 hours

  // Stable storage for persistence across upgrades
  stable var userProfileEntries : [(Principal, UserProfile)] = [];
  stable var redeemRequestEntries : [(Nat, RedeemRequest)] = [];
  stable var noticeEntries : [(Nat, Notice)] = [];
  stable var resolvedAtEntries : [(Nat, Int)] = []; // tracks when a request was approved/rejected
  stable var nextRedeemRequestId : Nat = 1;
  stable var nextNoticeId : Nat = 1;

  let userProfiles = Map.empty<Principal, UserProfile>();
  let redeemRequests = Map.empty<Nat, RedeemRequest>();
  let notices = Map.empty<Nat, Notice>();
  let resolvedAt = Map.empty<Nat, Int>(); // requestId -> resolution timestamp

  // Restore data from stable storage after upgrade
  system func postupgrade() {
    for ((k, v) in userProfileEntries.vals()) {
      userProfiles.add(k, v);
    };
    for ((k, v) in redeemRequestEntries.vals()) {
      redeemRequests.add(k, v);
    };
    for ((k, v) in noticeEntries.vals()) {
      notices.add(k, v);
    };
    for ((k, v) in resolvedAtEntries.vals()) {
      resolvedAt.add(k, v);
    };
    userProfileEntries := [];
    redeemRequestEntries := [];
    noticeEntries := [];
    resolvedAtEntries := [];
  };

  // Save data to stable storage before upgrade
  system func preupgrade() {
    userProfileEntries := userProfiles.entries().toArray();
    redeemRequestEntries := redeemRequests.entries().toArray();
    noticeEntries := notices.entries().toArray();
    resolvedAtEntries := resolvedAt.entries().toArray();
  };

  // Remove approved/rejected requests that are older than 24 hours
  func cleanupResolvedRequests() {
    let now = Time.now();
    for ((id, resolveTime) in resolvedAt.entries()) {
      if (now - resolveTime >= deleteAfterNs) {
        redeemRequests.remove(id);
        resolvedAt.remove(id);
      };
    };
  };

  func getCurrentDate() : Int {
    Time.now() / 86_400_000_000_000;
  };

  func generateCode(id : Nat) : Text {
    let nowNat : Nat = Int.abs(Time.now());
    let raw = (nowNat % 9000) + 1000 + id;
    let num = raw % 10000;
    let padded = if (num < 1000) { "0" # num.toText() } else { num.toText() };
    "#GE-" # padded;
  };

  func getOrCreateProfile(user : Principal) : UserProfile {
    switch (userProfiles.get(user)) {
      case (null) {
        let newProfile = {
          coins = 0;
          dailyAdsWatched = 0;
          lastAdDate = getCurrentDate().toText();
          nextAllowedAdTime = 0;
          fastClickCount = 0;
          fastClickDisabledUntil = 0;
          lastRedeemTime = 0;
        };
        userProfiles.add(user, newProfile);
        newProfile;
      };
      case (?profile) { profile };
    };
  };

  /// Returns the current user's profile
  public query ({ caller }) func getCallerUserProfile() : async UserProfile {
    getOrCreateProfile(caller);
  };

  /// Earn coins by watching an ad - with cooldown checks
  public shared ({ caller }) func earnCoins() : async UserProfile {
    let currentTime = Time.now();
    let today = getCurrentDate().toText();
    switch (userProfiles.get(caller)) {
      case (null) {
        let newProfile = {
          coins = coinsPerAd;
          dailyAdsWatched = 1;
          lastAdDate = today;
          nextAllowedAdTime = currentTime + 30_000_000_000;
          fastClickCount = 0;
          fastClickDisabledUntil = 0;
          lastRedeemTime = 0;
        };
        userProfiles.add(caller, newProfile);
        newProfile;
      };
      case (?profile) {
        if (currentTime < profile.nextAllowedAdTime) {
          let newFastClickCount = profile.fastClickCount + 1;
          var fastClickDisabledUntil = profile.fastClickDisabledUntil;
          if (newFastClickCount >= 5) {
            fastClickDisabledUntil := currentTime + 120_000_000_000;
          };
          userProfiles.add(caller, { profile with fastClickCount = newFastClickCount; fastClickDisabledUntil });
          Runtime.trap("Please wait for the cooldown period");
        };
        if (currentTime < profile.fastClickDisabledUntil) {
          Runtime.trap("You are suspended for fast clicking");
        };
        let dailyAdsWatched = if (today != profile.lastAdDate) { 0 } else { profile.dailyAdsWatched };
        if (dailyAdsWatched >= dailyLimit) {
          Runtime.trap("You have reached the daily ad limit");
        };
        let updatedProfile = {
          coins = profile.coins + coinsPerAd;
          dailyAdsWatched = dailyAdsWatched + 1;
          lastAdDate = today;
          nextAllowedAdTime = currentTime + 30_000_000_000;
          fastClickCount = 0;
          fastClickDisabledUntil = profile.fastClickDisabledUntil;
          lastRedeemTime = profile.lastRedeemTime;
        };
        userProfiles.add(caller, updatedProfile);
        updatedProfile;
      };
    };
  };

  /// Submit a redeem request
  public shared ({ caller }) func submitRedeemRequest(amount : Nat, rewardType : Text, userName : Text, userEmail : Text) : async Text {
    let profile = getOrCreateProfile(caller);
    let requiredCoins = amount * 100;
    if (requiredCoins < minRedeemCoins) {
      Runtime.trap("Minimum redemption is 5000 coins");
    };
    if (profile.coins < requiredCoins) {
      Runtime.trap("Not enough coins to redeem");
    };
    let currentTime = Time.now();
    if (currentTime < profile.lastRedeemTime + redeemCooldownNs) {
      Runtime.trap("Can only redeem once every 24 hours");
    };
    let requestId = nextRedeemRequestId;
    nextRedeemRequestId += 1;
    let newCoins : Nat = if (profile.coins >= requiredCoins) { profile.coins - requiredCoins } else { 0 };
    userProfiles.add(caller, { profile with coins = newCoins; lastRedeemTime = currentTime });
    let code = generateCode(requestId);
    redeemRequests.add(requestId, {
      id = requestId;
      userId = caller;
      code;
      status = #pending;
      amount;
      rewardType;
      userName;
      userEmail;
      coins = requiredCoins;
      timestamp = currentTime;
    });
    code;
  };

  /// Approve a redeem request
  public shared func approveRedeemRequest(requestId : Nat) : async ?RedeemRequest {
    switch (redeemRequests.get(requestId)) {
      case (null) { null };
      case (?request) {
        let updated = { request with status = #approved };
        redeemRequests.add(requestId, updated);
        // Record approval time - request will be auto-deleted 24 hours later
        resolvedAt.add(requestId, Time.now());
        ?updated;
      };
    };
  };

  /// Reject a redeem request
  public shared func rejectRedeemRequest(requestId : Nat) : async ?RedeemRequest {
    switch (redeemRequests.get(requestId)) {
      case (null) { null };
      case (?request) {
        let updated = { request with status = #rejected };
        redeemRequests.add(requestId, updated);
        // Record rejection time - request will be auto-deleted 24 hours later
        resolvedAt.add(requestId, Time.now());
        ?updated;
      };
    };
  };

  /// Get user's own redeem history - only pending + recently resolved (< 24h)
  public query ({ caller }) func getUserRedeemHistory() : async [RedeemRequest] {
    redeemRequests.values().toArray()
      .filter(func(req : RedeemRequest) : Bool { req.userId == caller })
      .sort();
  };

  /// Get all redeem requests (admin) - auto-cleans up resolved requests older than 24h
  public shared func getAllRedeemRequests() : async [RedeemRequest] {
    cleanupResolvedRequests();
    redeemRequests.values().toArray().sort();
  };

  /// Log a redeem entry without coin checks (for demo account submissions)
  public shared func logRedeemRecord(code : Text, amount : Nat, rewardType : Text, userName : Text, userEmail : Text) : async Text {
    let requestId = nextRedeemRequestId;
    nextRedeemRequestId += 1;
    redeemRequests.add(requestId, {
      id = requestId;
      userId = Principal.fromText("2vxsx-fae");
      code;
      status = #pending;
      amount;
      rewardType;
      userName;
      userEmail;
      coins = amount * 100;
      timestamp = Time.now();
    });
    code;
  };

    /// Get total user count
  public query func getTotalUserCount() : async Nat {
    userProfiles.size();
  };

  /// Admin: Manual coin adjustment
  public shared ({ caller }) func adjustUserCoins(user : Principal, coins : Nat) : async UserProfile {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized");
    };
    let updatedProfile = {
      coins;
      dailyAdsWatched = 0;
      lastAdDate = getCurrentDate().toText();
      nextAllowedAdTime = 0;
      fastClickCount = 0;
      fastClickDisabledUntil = 0;
      lastRedeemTime = 0;
    };
    userProfiles.add(user, updatedProfile);
    updatedProfile;
  };

  /// Admin: Get user profile by Principal
  public query ({ caller }) func getUserProfile(user : Principal) : async UserProfile {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized");
    };
    getOrCreateProfile(user);
  };

  /// Admin: Get all user profiles
  public query ({ caller }) func getAllUserProfiles() : async [UserProfile] {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized");
    };
    userProfiles.values().toArray().sort();
  };

  /// Get all notices (public)
  public query func getAllNotices() : async [Notice] {
    notices.values().toArray().sort();
  };

  /// Post a new notice (admin validated in frontend)
  public shared func postNotice(title : Text, message : Text) : async Notice {
    let id = nextNoticeId;
    nextNoticeId += 1;
    let notice = { id; title; message; timestamp = Time.now() };
    notices.add(id, notice);
    notice;
  };

  /// Edit a notice
  public shared func editNotice(id : Nat, title : Text, message : Text) : async ?Notice {
    switch (notices.get(id)) {
      case (null) { null };
      case (?n) {
        let updated = { n with title; message };
        notices.add(id, updated);
        ?updated;
      };
    };
  };

  /// Delete a notice
  public shared func deleteNotice(id : Nat) : async Bool {
    switch (notices.get(id)) {
      case (null) { false };
      case (?_) {
        notices.remove(id);
        true;
      };
    };
  };

  /// Utility: Get current date timestamp
  public query func getCurrentDateTimestamp() : async Int {
    getCurrentDate();
  };
};
