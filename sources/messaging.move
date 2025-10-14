module devhub::messaging {
    use std::string::{Self, String};
    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};

    public struct MessageNotification has key, store {
        id: UID,
        from: address,
        to: address,
        message_hash: String, // Hash of the off-chain message content
    }

    public entry fun send_message_notification(
        to: address,
        message_hash: vector<u8>,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        let notification = MessageNotification {
            id: object::new(ctx),
            from: sender,
            to: to,
            message_hash: string::utf8(message_hash),
        };
        transfer::transfer(notification, to);
    }
}
