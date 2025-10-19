module devhub::connections {
    use std::string::{Self, String};
    use sui::object::{Self, ID, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::table::{Self, Table};
    use sui::event;

    // Connection Status
    const PENDING: vector<u8> = b"Pending";
    const CONNECTED: vector<u8> = b"Connected";
    const DECLINED: vector<u8> = b"Declined";
    const UNFOLLOWED: vector<u8> = b"Unfollowed";
    const MUTED: vector<u8> = b"Muted";

    // Errors
    const E_INVALID_RECIPIENT: u64 = 1;
    const E_NOT_CONNECTED: u64 = 2;
    const E_INVALID_STATUS: u64 = 3;

    public struct ConnectionStore has key, store {
        id: UID,
        connections: Table<address, vector<Connection>>,
    }

    public struct ConnectionRequest has key, store {
        id: UID,
        from: address,
        to: address,
        intro_message: String,
        shared_context: String,
        is_public: bool,
    }

    public struct Connection has store, copy, drop {
        user: address,
        status: String,
        notifications_enabled: bool,
        profile_shared: bool,
        messages_allowed: bool,
    }

    // Events
    public struct ConnectionRequestSent has copy, drop {
        from: address,
        to: address,
    }

    public struct ConnectionAccepted has copy, drop {
        user1: address,
        user2: address,
    }

    public struct ConnectionDeclined has copy, drop {
        from: address,
        to: address,
    }

    public struct ConnectionStatusUpdated has copy, drop {
        user: address,
        connected_user: address,
        new_status: String,
    }

    public struct ConnectionPreferencesUpdated has copy, drop {
        user: address,
        connected_user: address,
    }

    public entry fun create_connection_store(ctx: &mut TxContext) {
        transfer::share_object(ConnectionStore {
            id: object::new(ctx),
            connections: table::new(ctx),
        });
    }

    public entry fun send_connection_request(
        to: address,
        intro_message: vector<u8>,
        shared_context: vector<u8>,
        is_public: bool,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        let req = ConnectionRequest {
            id: object::new(ctx),
            from: sender,
            to: to,
            intro_message: string::utf8(intro_message),
            shared_context: string::utf8(shared_context),
            is_public,
        };
        event::emit(ConnectionRequestSent { from: sender, to });
        transfer::transfer(req, to);
    }

    public entry fun accept_connection_request(store: &mut ConnectionStore, req: ConnectionRequest, ctx: &mut TxContext) {
        let ConnectionRequest { id, from, to, is_public, .. } = req;
        object::delete(id);

        let sender = tx_context::sender(ctx);
        assert!(sender == to, E_INVALID_RECIPIENT);

        // Add connection for 'from' user
        if (!table::contains(&store.connections, from)) {
            table::add(&mut store.connections, from, vector::empty<Connection>());
        };
        let from_connections = table::borrow_mut(&mut store.connections, from);
        vector::push_back(from_connections, Connection {
            user: to,
            status: string::utf8(CONNECTED),
            notifications_enabled: true,
            profile_shared: is_public,
            messages_allowed: true,
        });

        // Add connection for 'to' user
        if (!table::contains(&store.connections, to)) {
            table::add(&mut store.connections, to, vector::empty<Connection>());
        };
        let to_connections = table::borrow_mut(&mut store.connections, to);
        vector::push_back(to_connections, Connection {
            user: from,
            status: string::utf8(CONNECTED),
            notifications_enabled: true,
            profile_shared: is_public,
            messages_allowed: true,
        });

        event::emit(ConnectionAccepted { user1: from, user2: to });
    }

    public entry fun decline_connection_request(req: ConnectionRequest, ctx: &mut TxContext) {
        let ConnectionRequest { id, from, to, .. } = req;
        object::delete(id);
        event::emit(ConnectionDeclined { from, to });
    }

    public entry fun update_connection_preferences(
        store: &mut ConnectionStore,
        connected_user: address,
        notifications_enabled: bool,
        profile_shared: bool,
        messages_allowed: bool,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        assert!(table::contains(&store.connections, sender), E_NOT_CONNECTED);

        let connections = table::borrow_mut(&mut store.connections, sender);
        let mut i = 0;
        let len = vector::length(connections);
        let mut found = false;
        while (i < len) {
            let conn = vector::borrow_mut(connections, i);
            if (conn.user == connected_user) {
                conn.notifications_enabled = notifications_enabled;
                conn.profile_shared = profile_shared;
                conn.messages_allowed = messages_allowed;
                found = true;
                break
            };
            i = i + 1;
        };
        assert!(found, E_NOT_CONNECTED);
        event::emit(ConnectionPreferencesUpdated { user: sender, connected_user });
    }

    public entry fun update_connection_status(
        store: &mut ConnectionStore,
        connected_user: address,
        new_status: vector<u8>,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        assert!(table::contains(&store.connections, sender), E_NOT_CONNECTED);
        let new_status_str = string::utf8(new_status);
        assert!(new_status_str == string::utf8(UNFOLLOWED) || new_status_str == string::utf8(MUTED), E_INVALID_STATUS);

        let connections = table::borrow_mut(&mut store.connections, sender);
        let mut i = 0;
        let len = vector::length(connections);
        let mut found = false;
        while (i < len) {
            let conn = vector::borrow_mut(connections, i);
            if (conn.user == connected_user) {
                conn.status = new_status_str;
                found = true;
                break
            };
            i = i + 1;
        };
        assert!(found, E_NOT_CONNECTED);
        event::emit(ConnectionStatusUpdated { user: sender, connected_user, new_status: new_status_str });
    }

    // View functions
    public fun is_connected(store: &ConnectionStore, user1: address, user2: address): bool {
        if (table::contains(&store.connections, user1)) {
            let connections = table::borrow(&store.connections, user1);
            let mut i = 0;
            while (i < vector::length(connections)) {
                let conn = vector::borrow(connections, i);
                if (conn.user == user2 && conn.status == string::utf8(CONNECTED)) {
                    return true
                };
                i = i + 1;
            };
        };
        false
    }

    public fun get_connections(store: &ConnectionStore, user: address): &vector<Connection> {
        assert!(table::contains(&store.connections, user), E_NOT_CONNECTED);
        table::borrow(&store.connections, user)
    }

    public fun recommend_related_people(_store: &ConnectionStore, _user: address): vector<address> {
        // Placeholder for recommendation logic.
        // This would be implemented off-chain by indexing the graph.
        vector::empty<address>()
    }
}