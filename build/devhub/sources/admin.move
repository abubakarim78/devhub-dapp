module devhub::admin {
    use sui::object::{Self, ID, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::balance::{Self, Balance};
    use std::option::{Self, Option};
    use sui::clock::{Self, Clock};
    use sui::table::{Self, Table};
    use std::vector;

    // --- Constants ---

    // Roles
    const SUPER_ADMIN_ROLE_ID: u8 = 1;
    const ADMIN_ROLE_ID: u8 = 2;
    const SUSPENDED_ROLE_ID: u8 = 3;

    // Statuses
    const ACTIVE_STATUS_ID: u8 = 1;
    const SUSPENDED_STATUS_ID: u8 = 2;

    // Fees
    const PROFILE_CARD_CREATION_FEE: u64 = 100_000_000; // 0.1 SUI
    const PROJECT_POSTING_FEE: u64 = 200_000_000; // 0.2 SUI

    // --- Errors ---
    const E_UNAUTHORIZED: u64 = 1;
    const E_INVALID_ROLE: u64 = 2;
    const E_ADMIN_EXISTS: u64 = 3;
    const E_ADMIN_NOT_FOUND: u64 = 4;
    const E_INSUFFICIENT_FUNDS: u64 = 5;
    const E_INVALID_FEE_AMOUNT: u64 = 6;

    // --- Structs ---

    public struct SuperAdminCapability has key, store {
        id: UID,
    }

    public struct Admin has store, copy {
        address: address,
        role: u8,
        status: u8,
        notes: vector<u8>,
        last_active_timestamp: u64,
    }

    public struct AdminDirectory has key {
        id: UID,
        admins: Table<address, Admin>,
    }

    public struct PlatformConfig has key, store {
        id: UID,
        profile_card_creation_fee_sui_m: u64,
        project_posting_fee_sui_m: u64,
        last_updated_timestamp: u64,
    }

    public struct AccruedFees has key {
        id: UID,
        balance: Balance<SUI>,
    }

    public struct Withdrawal has store {
        amount: u64,
        destination: address,
        timestamp: u64,
    }

    public struct WithdrawalLog has key {
        id: UID,
        withdrawals: vector<Withdrawal>,
    }

    public struct ActivityEvent has store {
        timestamp: u64,
        admin_address: address,
        action: vector<u8>,
        details: vector<u8>,
    }

    public struct ActivityLog has key {
        id: UID,
        events: vector<ActivityEvent>,
    }

    // --- Initialization Functions ---

    public fun add_initial_super_admin(
        admins: &mut Table<address, Admin>,
        super_admin: address,
        clock: &Clock
    ) {
        let admin = Admin {
            address: super_admin,
            role: SUPER_ADMIN_ROLE_ID,
            status: ACTIVE_STATUS_ID,
            notes: b"Initial Super Admin",
            last_active_timestamp: clock::timestamp_ms(clock),
        };
        table::add(admins, super_admin, admin);
    }

    public fun create_super_admin_capability(ctx: &mut TxContext) {
        transfer::transfer(SuperAdminCapability { id: object::new(ctx) }, tx_context::sender(ctx));
    }

    public fun create_admin_directory(ctx: &mut TxContext) {
        let mut admins = table::new<address, Admin>(ctx);
        table::add(&mut admins, tx_context::sender(ctx), Admin {
            address: tx_context::sender(ctx),
            role: SUPER_ADMIN_ROLE_ID,
            status: ACTIVE_STATUS_ID,
            notes: b"Initial Super Admin",
            last_active_timestamp: tx_context::epoch_timestamp_ms(ctx),
        });
        transfer::share_object(AdminDirectory {
            id: object::new(ctx),
            admins: admins,
        });
    }

    public fun create_platform_config(ctx: &mut TxContext) {
        transfer::share_object(PlatformConfig {
            id: object::new(ctx),
            profile_card_creation_fee_sui_m: PROFILE_CARD_CREATION_FEE,
            project_posting_fee_sui_m: PROJECT_POSTING_FEE,
            last_updated_timestamp: tx_context::epoch_timestamp_ms(ctx),
        });
    }

    public fun create_accrued_fees(ctx: &mut TxContext) {
        transfer::share_object(AccruedFees {
            id: object::new(ctx),
            balance: balance::zero(),
        });
    }

    public fun create_withdrawal_log(ctx: &mut TxContext) {
        transfer::share_object(WithdrawalLog {
            id: object::new(ctx),
            withdrawals: vector::empty(),
        });
    }

    public fun create_activity_log(ctx: &mut TxContext) {
        transfer::share_object(ActivityLog {
            id: object::new(ctx),
            events: vector::empty(),
        });
    }

    // --- SuperAdmin-Only Functions ---

    public entry fun grant_admin_role(
        _cap: &SuperAdminCapability,
        admin_directory: &mut AdminDirectory,
        activity_log: &mut ActivityLog,
        clock: &Clock,
        target_address: address,
        role: u8,
        notes: vector<u8>,
        ctx: &mut TxContext
    ) {
        assert!(role == ADMIN_ROLE_ID || role == SUSPENDED_ROLE_ID, E_INVALID_ROLE);
        assert!(!table::contains(&admin_directory.admins, target_address), E_ADMIN_EXISTS);

        let admin = Admin {
            address: target_address,
            role,
            status: ACTIVE_STATUS_ID,
            notes,
            last_active_timestamp: clock::timestamp_ms(clock),
        };
        table::add(&mut admin_directory.admins, target_address, admin);

        log_activity(activity_log, clock, tx_context::sender(ctx), b"grant_admin_role", vector::empty());
    }

    public entry fun revoke_admin_role(
        _cap: &SuperAdminCapability,
        admin_directory: &mut AdminDirectory,
        activity_log: &mut ActivityLog,
        clock: &Clock,
        target_address: address,
        _reason: vector<u8>,
        ctx: &mut TxContext
    ) {
        assert!(table::contains(&admin_directory.admins, target_address), E_ADMIN_NOT_FOUND);
        let admin = table::borrow_mut(&mut admin_directory.admins, target_address);
        admin.role = SUSPENDED_ROLE_ID;
        admin.status = SUSPENDED_STATUS_ID;

        log_activity(activity_log, clock, tx_context::sender(ctx), b"revoke_admin_role", vector::empty());
    }

    public entry fun update_platform_fee_parameters(
        _cap: &SuperAdminCapability,
        platform_config: &mut PlatformConfig,
        activity_log: &mut ActivityLog,
        clock: &Clock,
        new_profile_fee_sui_m: u64,
        new_project_fee_sui_m: u64,
        ctx: &mut TxContext
    ) {
        platform_config.profile_card_creation_fee_sui_m = new_profile_fee_sui_m;
        platform_config.project_posting_fee_sui_m = new_project_fee_sui_m;
        platform_config.last_updated_timestamp = clock::timestamp_ms(clock);

        log_activity(activity_log, clock, tx_context::sender(ctx), b"update_platform_fee_parameters", vector::empty());
    }

    public entry fun initiate_platform_fee_withdrawal(
        _cap: &SuperAdminCapability,
        accrued_fees: &mut AccruedFees,
        withdrawal_log: &mut WithdrawalLog,
        activity_log: &mut ActivityLog,
        clock: &Clock,
        amount_sui_m: u64,
        destination_address: address,
        ctx: &mut TxContext
    ) {
        let balance = balance::value(&accrued_fees.balance);
        assert!(balance >= amount_sui_m, E_INSUFFICIENT_FUNDS);

        let withdrawal_coin = coin::from_balance(balance::split(&mut accrued_fees.balance, amount_sui_m), ctx);
        transfer::public_transfer(withdrawal_coin, destination_address);

        let withdrawal = Withdrawal {
            amount: amount_sui_m,
            destination: destination_address,
            timestamp: clock::timestamp_ms(clock),
        };
        vector::push_back(&mut withdrawal_log.withdrawals, withdrawal);

        log_activity(activity_log, clock, tx_context::sender(ctx), b"initiate_platform_fee_withdrawal", vector::empty());
    }

    // --- Public Functions ---

    public fun collect_profile_card_fee(
        payment: Coin<SUI>,
        accrued_fees: &mut AccruedFees,
        platform_config: &PlatformConfig,
        _ctx: &mut TxContext
    ) {
        let fee_amount = platform_config.profile_card_creation_fee_sui_m;
        assert!(coin::value(&payment) == fee_amount, E_INVALID_FEE_AMOUNT);
        balance::join(&mut accrued_fees.balance, coin::into_balance(payment));
    }

    public fun collect_project_posting_fee(
        payment: Coin<SUI>,
        accrued_fees: &mut AccruedFees,
        platform_config: &PlatformConfig,
        _ctx: &mut TxContext
    ) {
        let fee_amount = platform_config.project_posting_fee_sui_m;
        assert!(coin::value(&payment) == fee_amount, E_INVALID_FEE_AMOUNT);
        balance::join(&mut accrued_fees.balance, coin::into_balance(payment));
    }

    // --- Internal Functions ---

    fun log_activity(
        activity_log: &mut ActivityLog,
        clock: &Clock,
        admin_address: address,
        action: vector<u8>,
        details: vector<u8>
    ) {
        let event = ActivityEvent {
            timestamp: clock::timestamp_ms(clock),
            admin_address,
            action,
            details,
        };
        vector::push_back(&mut activity_log.events, event);
    }

    // --- View Functions ---

    public fun get_admin_details(admin_directory: &AdminDirectory, admin_address: address): Option<Admin> {
        if (table::contains(&admin_directory.admins, admin_address)) {
            let admin = table::borrow(&admin_directory.admins, admin_address);
            option::some(*admin)
        } else {
            option::none<Admin>()
        }
    }

    public fun get_all_admins(admin_directory: &AdminDirectory): &Table<address, Admin> {
        &admin_directory.admins
    }

    public fun get_current_fee_parameters(platform_config: &PlatformConfig): (u64, u64) {
        (platform_config.profile_card_creation_fee_sui_m, platform_config.project_posting_fee_sui_m)
    }

    public fun get_accrued_sui_balance(accrued_fees: &AccruedFees): u64 {
        balance::value(&accrued_fees.balance)
    }

    public fun get_activity_log(activity_log: &ActivityLog): &vector<ActivityEvent> {
        &activity_log.events
    }

    public fun get_pending_withdrawals(withdrawal_log: &WithdrawalLog): &vector<Withdrawal> {
        &withdrawal_log.withdrawals
    }
}