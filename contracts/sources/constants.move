module devhub::constants;

// ===== PUBLIC GETTER FUNCTIONS =====
// Constants are exposed as public functions to allow cross-module access

// Error codes
public fun NOT_THE_OWNER(): u64 { 0 }
public fun INSUFFICIENT_FUNDS(): u64 { 1 }
public fun NOT_ADMIN(): u64 { 2 }
public fun E_NOT_OWNER(): u64 { 3 }
public fun INVALID_SKILL_LEVEL(): u64 { 3 }
public fun CANNOT_DELETE_ACTIVE_CARD(): u64 { 7 }
public fun E_NOT_CONNECTED(): u64 { 12 }
public fun E_INVALID_STATUS(): u64 { 13 }
public fun INVALID_RATING(): u64 { 14 }
public fun SELF_REVIEW_NOT_ALLOWED(): u64 { 15 }
public fun ALREADY_REVIEWED(): u64 { 16 }
public fun E_APPLICATIONS_NOT_OPEN(): u64 { 17 }
public fun E_APPLICATIONS_ALREADY_OPEN(): u64 { 18 }
public fun E_APPLICATIONS_ALREADY_CLOSED(): u64 { 19 }
public fun E_INVALID_PROPOSAL_STATUS(): u64 { 20 }
public fun NOT_SUPER_ADMIN(): u64 { 21 }
public fun INVALID_CUSTOM_NICHE(): u64 { 22 }
public fun USER_ALREADY_HAS_CARD(): u64 { 23 }

// Fee constants
public fun PLATFORM_FEE(): u64 { 100_000_000 }
public fun PROJECT_POSTING_FEE(): u64 { 200_000_000 }
