import Int "mo:core/Int";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Array "mo:core/Array";

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

  let dailyLimit = 15;
  let coinsPerAd = 10;
  let minRedeemCoins = 5000;
  let redeemCooldownNs : Int = 86_400_000_000_000;

  let userProfiles = Map.empty<Principal, UserProfile>();
  let redeemRequests = Map.empty<Nat, RedeemRequest>();
  var nextRedeemRequestId = 1;

  func getCurrentDate() : Int {
    Time.now() / 86_400_000_000_000;
  };

  func generateCode(id : Nat) : Text {
    let raw = (Time.now() % 9000).toNat() + 1000 + id;
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

  /// Returns the current user's profile, creating it if it doesn't exist
  public query ({ caller }) func getCallerUserProfile() : async UserProfile {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized");
    };
    getOrCreateProfile(caller);
  };

  /// Earn coins by watching an ad - with cooldown checks
  public shared ({ caller }) func earnCoins() : async UserProfile {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized");
    };
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
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized");
    };
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
    userProfiles.add(caller, { profile with coins = profile.coins - requiredCoins; lastRedeemTime = currentTime });
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
  public shared ({ caller }) func approveRedeemRequest(requestId : Nat) : async ?RedeemRequest {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized");
    };
    switch (redeemRequests.get(requestId)) {
      case (null) { null };
      case (?request) {
        let updated = { request with status = #approved };
        redeemRequests.add(requestId, updated);
        ?updated;
      };
    };
  };

  /// Reject a redeem request
  public shared ({ caller }) func rejectRedeemRequest(requestId : Nat) : async ?RedeemRequest {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized");
    };
    switch (redeemRequests.get(requestId)) {
      case (null) { null };
      case (?request) {
        let updated = { request with status = #rejected };
        redeemRequests.add(requestId, updated);
        ?updated;
      };
    };
  };

  /// Get user's own redeem history
  public query ({ caller }) func getUserRedeemHistory() : async [RedeemRequest] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized");
    };
    redeemRequests.values().toArray()
      .filter(func(req : RedeemRequest) : Bool { req.userId == caller })
      .sort();
  };

  /// Get all redeem requests
  public query ({ caller }) func getAllRedeemRequests() : async [RedeemRequest] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized");
    };
    redeemRequests.values().toArray().sort();
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

  /// Utility: Get current date timestamp
  public query func getCurrentDateTimestamp() : async Int {
    getCurrentDate();
  };
};
