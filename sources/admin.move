// Admin module for DevHub platform management
module devhub::admin;

use std::string::{Self, String};
use sui::clock::{Self, Clock};
use sui::event;

// Error codes
const NOT_ADMIN: u64 = 100;
const INSUFFICIENT_BALANCE: u64 = 101;

// Admin capabilities struct
public struct AdminCap has key, store {
    id: UID,
    admin: address,
    created_at: u64,
}

// Platform statistics struct
public struct PlatformStats has key, store {
    id: UID,
    total_cards: u64,
    total_users: u64,
    total_fees_collected: u64,
    active_cards: u64,
    last_updated: u64,
}

// Admin action history
public struct AdminAction has key, store {
    id: UID,
    action_type: String,
    admin: address,
    amount: Option<u64>,
    timestamp: u64,
    details: String,
}

// Events
public struct AdminCapCreated has copy, drop {
    admin: address,
    cap_id: address,
    timestamp: u64,
}

public struct AdminCapTransferred has copy, drop {
    old_admin: address,
    new_admin: address,
    timestamp: u64,
}

public struct FeesWithdrawn has copy, drop {
    admin: address,
    amount: u64,
    recipient: address,
    timestamp: u64,
}

public struct PlatformStatsUpdated has copy, drop {
    total_cards: u64,
    total_users: u64,
    total_fees_collected: u64,
    active_cards: u64,
    timestamp: u64,
}

public struct AdminActionLogged has copy, drop {
    action_type: String,
    admin: address,
    amount: Option<u64>,
    timestamp: u64,
    details: String,
}

// Initialize admin capabilities
public entry fun create_admin_cap(admin: address, clock: &Clock, ctx: &mut TxContext) {
    let timestamp = clock::timestamp_ms(clock);
    let cap_id = object::new(ctx);
    let cap_id_for_event = object::uid_to_address(&cap_id);

    let admin_cap = AdminCap {
        id: cap_id,
        admin,
        created_at: timestamp,
    };

    event::emit(AdminCapCreated {
        admin,
        cap_id: cap_id_for_event,
        timestamp,
    });

    transfer::transfer(admin_cap, admin);
}

// Initialize platform statistics
public entry fun init_platform_stats(_admin_cap: &AdminCap, clock: &Clock, ctx: &mut TxContext) {
    let timestamp = clock::timestamp_ms(clock);

    let stats = PlatformStats {
        id: object::new(ctx),
        total_cards: 0,
        total_users: 0,
        total_fees_collected: 0,
        active_cards: 0,
        last_updated: timestamp,
    };

    transfer::share_object(stats);
}

// Transfer admin capabilities
public entry fun transfer_admin_cap(
    admin_cap: AdminCap,
    new_admin: address,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    let old_admin = admin_cap.admin;
    let timestamp = clock::timestamp_ms(clock);

    let new_cap = AdminCap {
        id: object::new(ctx),
        admin: new_admin,
        created_at: timestamp,
    };

    event::emit(AdminCapTransferred {
        old_admin,
        new_admin,
        timestamp,
    });

    // Destroy old cap
    let AdminCap { id, admin: _, created_at: _ } = admin_cap;
    object::delete(id);

    transfer::transfer(new_cap, new_admin);
}

// Withdraw specific amount of platform fees
public entry fun withdraw_platform_fees(
    admin_cap: &AdminCap,
    devhub: &mut devhub::devcard::DevHub,
    recipient: address,
    amount: u64,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    // Verify admin permissions
    assert!(admin_cap.admin == tx_context::sender(ctx), NOT_ADMIN);

    let timestamp = clock::timestamp_ms(clock);

    // Call the devcard module's withdraw function
    devhub::devcard::withdraw_platform_fees(devhub, recipient, amount, ctx);

    // Log the action
    log_admin_action(
        string::utf8(b"WITHDRAW_FEES"),
        admin_cap.admin,
        option::some(amount),
        timestamp,
        string::utf8(b"Platform fees withdrawn"),
        ctx,
    );

    event::emit(FeesWithdrawn {
        admin: admin_cap.admin,
        amount,
        recipient,
        timestamp,
    });
}

// Withdraw all platform fees
public entry fun withdraw_all_platform_fees(
    admin_cap: &AdminCap,
    devhub: &mut devhub::devcard::DevHub,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    // Verify admin permissions
    assert!(admin_cap.admin == tx_context::sender(ctx), NOT_ADMIN);

    let timestamp = clock::timestamp_ms(clock);
    let amount = devhub::devcard::get_platform_fee_balance(devhub);

    assert!(amount > 0, INSUFFICIENT_BALANCE);

    // Call the devcard module's withdraw all function
    devhub::devcard::withdraw_all_platform_fees(devhub, ctx);

    // Log the action
    log_admin_action(
        string::utf8(b"WITHDRAW_ALL_FEES"),
        admin_cap.admin,
        option::some(amount),
        timestamp,
        string::utf8(b"All platform fees withdrawn"),
        ctx,
    );

    event::emit(FeesWithdrawn {
        admin: admin_cap.admin,
        amount,
        recipient: admin_cap.admin,
        timestamp,
    });
}

// Update platform statistics
public entry fun update_platform_stats(
    admin_cap: &AdminCap,
    stats: &mut PlatformStats,
    devhub: &devhub::devcard::DevHub,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    // Verify admin permissions
    assert!(admin_cap.admin == tx_context::sender(ctx), NOT_ADMIN);

    let timestamp = clock::timestamp_ms(clock);

    // Update stats from devhub
    stats.total_cards = devhub::devcard::get_card_count(devhub);
    stats.total_fees_collected = devhub::devcard::get_platform_fee_balance(devhub);
    stats.last_updated = timestamp;

    // Log the action
    log_admin_action(
        string::utf8(b"UPDATE_STATS"),
        admin_cap.admin,
        option::none(),
        timestamp,
        string::utf8(b"Platform statistics updated"),
        ctx,
    );

    event::emit(PlatformStatsUpdated {
        total_cards: stats.total_cards,
        total_users: stats.total_users,
        total_fees_collected: stats.total_fees_collected,
        active_cards: stats.active_cards,
        timestamp,
    });
}

// Log admin actions for audit trail
fun log_admin_action(
    action_type: String,
    admin: address,
    amount: Option<u64>,
    timestamp: u64,
    details: String,
    ctx: &mut TxContext,
) {
    let action = AdminAction {
        id: object::new(ctx),
        action_type,
        admin,
        amount,
        timestamp,
        details,
    };

    event::emit(AdminActionLogged {
        action_type,
        admin,
        amount,
        timestamp,
        details,
    });

    transfer::share_object(action);
}

// === View Functions ===

// Get admin address from capability
public fun get_admin_address(admin_cap: &AdminCap): address {
    admin_cap.admin
}

// Get platform statistics
public fun get_platform_stats(stats: &PlatformStats): (u64, u64, u64, u64, u64) {
    (
        stats.total_cards,
        stats.total_users,
        stats.total_fees_collected,
        stats.active_cards,
        stats.last_updated,
    )
}

// Check if address is admin
public fun is_platform_admin(admin_cap: &AdminCap, addr: address): bool {
    admin_cap.admin == addr
}

// Get admin capability creation timestamp
public fun get_admin_cap_created_at(admin_cap: &AdminCap): u64 {
    admin_cap.created_at
}

// Get current platform fee rate
public fun get_platform_fee_rate(): u64 {
    devhub::devcard::get_platform_fee()
}

// Calculate platform fee for given amount
public fun calculate_platform_fee(_amount: u64): u64 {
    // For now, return the fixed platform fee
    // This can be enhanced to support percentage-based fees
    devhub::devcard::get_platform_fee()
}

// Get admin action details
public fun get_admin_action_details(
    action: &AdminAction,
): (String, address, Option<u64>, u64, String) {
    (action.action_type, action.admin, action.amount, action.timestamp, action.details)
}

// === Emergency Functions ===

// Emergency pause function (for future implementation)
public entry fun emergency_pause(admin_cap: &AdminCap, clock: &Clock, ctx: &mut TxContext) {
    // Verify admin permissions
    assert!(admin_cap.admin == tx_context::sender(ctx), NOT_ADMIN);

    let timestamp = clock::timestamp_ms(clock);

    // Log the emergency action
    log_admin_action(
        string::utf8(b"EMERGENCY_PAUSE"),
        admin_cap.admin,
        option::none(),
        timestamp,
        string::utf8(b"Emergency pause activated"),
        ctx,
    );

    // Implementation for emergency pause would go here
    // This could involve setting a global pause state
}

// Batch operations for efficiency
public entry fun batch_update_stats_and_withdraw(
    admin_cap: &AdminCap,
    stats: &mut PlatformStats,
    devhub: &mut devhub::devcard::DevHub,
    withdrawal_amount: u64,
    recipient: address,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    // Verify admin permissions
    assert!(admin_cap.admin == tx_context::sender(ctx), NOT_ADMIN);

    let timestamp = clock::timestamp_ms(clock);

    // Update stats first
    stats.total_cards = devhub::devcard::get_card_count(devhub);
    stats.total_fees_collected = devhub::devcard::get_platform_fee_balance(devhub);
    stats.last_updated = timestamp;

    // Then withdraw if amount is valid
    if (withdrawal_amount > 0) {
        devhub::devcard::withdraw_platform_fees(devhub, recipient, withdrawal_amount, ctx);

        event::emit(FeesWithdrawn {
            admin: admin_cap.admin,
            amount: withdrawal_amount,
            recipient,
            timestamp,
        });
    };

    // Log the batch action
    log_admin_action(
        string::utf8(b"BATCH_UPDATE_WITHDRAW"),
        admin_cap.admin,
        option::some(withdrawal_amount),
        timestamp,
        string::utf8(b"Batch stats update and fee withdrawal"),
        ctx,
    );
}
