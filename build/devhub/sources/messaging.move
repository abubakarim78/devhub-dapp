module devhub::messaging {
    use std::string::{Self, String};
    use sui::object::{Self, ID, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::clock::{Self, Clock};
    use std::vector;

    // --- Errors ---
    const E_NOT_PARTICIPANT: u64 = 1;

    // --- Structs ---

    public struct Message has store {
        sender: address,
        content: String, // or hash of content
        timestamp: u64,
        is_read: bool,
    }

    public struct Conversation has key, store {
        id: UID,
        participant1: address,
        participant2: address,
        messages: vector<Message>,
    }

    // --- Functions ---

    public entry fun start_conversation(
        participant2: address,
        ctx: &mut TxContext
    ) {
        let participant1 = tx_context::sender(ctx);
        let conversation = Conversation {
            id: object::new(ctx),
            participant1,
            participant2,
            messages: vector::empty(),
        };
        transfer::transfer(conversation, participant1);
    }

    public entry fun send_message(
        conversation: &mut Conversation,
        content: vector<u8>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        assert!(sender == conversation.participant1 || sender == conversation.participant2, E_NOT_PARTICIPANT);

        let message = Message {
            sender,
            content: string::utf8(content),
            timestamp: clock::timestamp_ms(clock),
            is_read: false,
        };
        vector::push_back(&mut conversation.messages, message);
    }

    public entry fun mark_as_read(
        conversation: &mut Conversation,
        message_index: u64,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        assert!(sender == conversation.participant1 || sender == conversation.participant2, E_NOT_PARTICIPANT);

        let message = vector::borrow_mut(&mut conversation.messages, message_index);
        // only the receiver can mark as read
        assert!(sender != message.sender, E_NOT_PARTICIPANT);
        message.is_read = true;
    }

    public fun get_conversation_messages(conversation: &Conversation): &vector<Message> {
        &conversation.messages
    }
}