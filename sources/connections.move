module devhub::connections {
    use sui::object::{Self, ID, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::table::{Self, Table};

    public struct ConnectionStore has key, store {
        id: UID,
        connections: Table<address, vector<address>>,
    }

    public struct ConnectionRequest has key, store {
        id: UID,
        from: address,
        to: address,
    }

    fun init(ctx: &mut TxContext) {
        transfer::share_object(ConnectionStore {
            id: object::new(ctx),
            connections: table::new(ctx),
        });
    }

    public entry fun send_connection_request(to: address, ctx: &mut TxContext) {
        let sender = tx_context::sender(ctx);
        let req = ConnectionRequest {
            id: object::new(ctx),
            from: sender,
            to: to,
        };
        transfer::transfer(req, to);
    }

    public entry fun accept_connection_request(store: &mut ConnectionStore, req: ConnectionRequest, ctx: &mut TxContext) {
        let ConnectionRequest { id, from, to } = req;
        object::delete(id);

        let sender = tx_context::sender(ctx);
        assert!(sender == to, 1); // E_INVALID_RECIPIENT

        if (!table::contains(&store.connections, from)) {
            table::add(&mut store.connections, from, vector::empty<address>());
        };
        if (!table::contains(&store.connections, to)) {
            table::add(&mut store.connections, to, vector::empty<address>());
        };

        let from_connections = table::borrow_mut(&mut store.connections, from);
        vector::push_back(from_connections, to);

        let to_connections = table::borrow_mut(&mut store.connections, to);
        vector::push_back(to_connections, from);
    }

    public entry fun reject_connection_request(req: ConnectionRequest) {
        let ConnectionRequest { id, from, to } = req;
        object::delete(id);
    }
}
