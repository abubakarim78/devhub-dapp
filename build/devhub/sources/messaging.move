module devhub::messaging {
    use std::string::{Self, String};
    use sui::object::{Self, ID, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::clock::{Self, Clock};
    use sui::event;
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

    // --- Events ---

    public struct ConversationCreated has copy, drop {
        conversation_id: ID,
        participant1: address,
        participant2: address,
        timestamp: u64,
    }

    public struct MessageSent has copy, drop {
        conversation_id: ID,
        sender: address,
        receiver: address,
        message_index: u64,
        timestamp: u64,
    }

    public struct MessageRead has copy, drop {
        conversation_id: ID,
        message_index: u64,
        reader: address,
        original_sender: address,
        timestamp: u64,
    }

    // --- Functions ---

    public entry fun start_conversation(
        participant2: address,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let participant1 = tx_context::sender(ctx);
        let conversation = Conversation {
            id: object::new(ctx),
            participant1,
            participant2,
            messages: vector::empty(),
        };
        
        let conversation_id = object::uid_to_inner(&conversation.id);
        
        // Emit event
        event::emit(ConversationCreated {
            conversation_id,
            participant1,
            participant2,
            timestamp: clock::timestamp_ms(clock),
        });

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

        let timestamp = clock::timestamp_ms(clock);
        let message = Message {
            sender,
            content: string::utf8(content),
            timestamp,
            is_read: false,
        };
        
        vector::push_back(&mut conversation.messages, message);
        let message_index = vector::length(&conversation.messages) - 1;

        // Determine receiver
        let receiver = if (sender == conversation.participant1) {
            conversation.participant2
        } else {
            conversation.participant1
        };

        // Emit event
        event::emit(MessageSent {
            conversation_id: object::uid_to_inner(&conversation.id),
            sender,
            receiver,
            message_index,
            timestamp,
        });
    }

    public entry fun mark_as_read(
        conversation: &mut Conversation,
        message_index: u64,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        assert!(sender == conversation.participant1 || sender == conversation.participant2, E_NOT_PARTICIPANT);

        let message = vector::borrow_mut(&mut conversation.messages, message_index);
        // only the receiver can mark as read
        assert!(sender != message.sender, E_NOT_PARTICIPANT);
        
        let original_sender = message.sender;
        message.is_read = true;

        // Emit event
        event::emit(MessageRead {
            conversation_id: object::uid_to_inner(&conversation.id),
            message_index,
            reader: sender,
            original_sender,
            timestamp: clock::timestamp_ms(clock),
        });
    }

    public fun get_conversation_messages(conversation: &Conversation): &vector<Message> {
        &conversation.messages
    }
}