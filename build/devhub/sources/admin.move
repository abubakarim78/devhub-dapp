module devhub::admin {
    use sui::object::{Self, ID, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::balance::{Self, Balance};
    use sui::sui::SUI;
    use sui::coin::{Self, Coin};

    const E_NOT_SUPER_ADMIN: u64 = 1;
    const E_NOT_ADMIN: u64 = 2;

    public struct SuperAdminCap has key, store {
        id: UID,
    }

    public struct AdminCap has key, store {
        id: UID,
    }

    public struct PlatformConfig has key, store {
        id: UID,
        platform_fee_percent: u64,
        minimum_fee: u64,
        treasury: Balance<SUI>,
    }

    fun init(ctx: &mut TxContext) {
        transfer::transfer(SuperAdminCap { id: object::new(ctx) }, tx_context::sender(ctx));
        transfer::share_object(PlatformConfig {
            id: object::new(ctx),
            platform_fee_percent: 250, // 2.5% (in basis points)
            minimum_fee: 200_000_000, // 0.2 SUI
            treasury: balance::zero(),
        });
    }

    public entry fun grant_admin_role(super_admin_cap: &SuperAdminCap, recipient: address, ctx: &mut TxContext) {
        transfer::transfer(AdminCap { id: object::new(ctx) }, recipient);
    }

    public entry fun revoke_admin_role(super_admin_cap: &SuperAdminCap, admin_cap: AdminCap) {
        let AdminCap { id } = admin_cap;
        object::delete(id);
    }

    public entry fun update_platform_fees(
        admin_cap: &AdminCap,
        config: &mut PlatformConfig,
        new_fee_percent: u64,
        new_minimum_fee: u64
    ) {
        config.platform_fee_percent = new_fee_percent;
        config.minimum_fee = new_minimum_fee;
    }

    public entry fun withdraw_fees(
        admin_cap: &AdminCap,
        config: &mut PlatformConfig,
        amount: u64,
        recipient: address,
        ctx: &mut TxContext
    ) {
        let withdrawal = coin::from_balance(balance::split(&mut config.treasury, amount), ctx);
        transfer::public_transfer(withdrawal, recipient);
    }
}
