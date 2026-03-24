# Gamer Earn

## Current State
Backend uses non-stable Map storage for redeemRequests, notices, and userProfiles. Every new deployment wipes all data. Sort calls use `.sort()` without comparison function which may cause runtime issues.

## Requested Changes (Diff)

### Add
- `stable var` entries arrays for redeemRequests, notices, userProfiles, nextRedeemRequestId, nextNoticeId
- `system func preupgrade()` to save data before upgrade
- `system func postupgrade()` to restore data after upgrade

### Modify
- Make nextRedeemRequestId and nextNoticeId stable vars
- Fix all `.sort()` calls to use proper comparison functions

### Remove
- Non-stable Map declarations (replaced with stable-backed versions)

## Implementation Plan
1. Add stable storage vars for all Maps
2. Add preupgrade/postupgrade system functions
3. Fix sort calls to use module compare functions
