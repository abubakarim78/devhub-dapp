module devhub::admin;

use sui::event;



public struct AdminRoleGranted has copy, drop {
    admin: address,
}

public struct AdminRoleRevoked has copy, drop {
    admin: address,
}

public struct PlatformFeesWithdrawn has copy, drop {
    admin: address,
    amount: u64,
    recipient: address,
}



public fun is_super_admin(super_admin: address, user: address): bool {
    super_admin == user
}

public fun is_admin(admins: &vector<address>, user: address): bool {
    vector::contains(admins, &user)
}

public fun is_admin_or_super_admin(super_admin: address, admins: &vector<address>, user: address): bool {
    is_super_admin(super_admin, user) || is_admin(admins, user)
}



public fun add_admin(admins: &mut vector<address>, new_admin: address) {
    vector::push_back(admins, new_admin);
}

public fun remove_admin(admins: &mut vector<address>, admin_to_revoke: address) {
    let mut i = 0;
    while (i < vector::length(admins)) {
        if (*vector::borrow(admins, i) == admin_to_revoke) {
            vector::remove(admins, i);
            return
        };
        i = i + 1;
    };
}



public fun emit_admin_role_granted(admin: address) {
    event::emit(AdminRoleGranted { admin });
}

public fun emit_admin_role_revoked(admin: address) {
    event::emit(AdminRoleRevoked { admin });
}

public fun emit_platform_fees_withdrawn(admin: address, amount: u64, recipient: address) {
    event::emit(PlatformFeesWithdrawn { admin, amount, recipient });
}

