module devhub::channels {

use std::string::{Self, String};
use sui::event;
use sui::clock::{Self, Clock};

const E_NOT_PARTICIPANT: u64 = 10;

#[allow(unused_field)]
public struct EncryptionKey has store, copy, drop {
    version: u64,
    encrypted_bytes: vector<u8>,
    created_at: u64,
}

public struct Channel has key, store {
    id: UID,
    name: String,
    members: vector<address>,
    encryption_key_history: vector<EncryptionKey>,
    messages: vector<devhub::messaging::Message>,
    created_at: u64,
    last_activity: u64,
}

public struct MemberCap has key, store {
    id: UID,
    channel_id: ID,
    member: address,
    permissions: vector<String>,
    created_at: u64,
}

public struct ChannelCreated has copy, drop {
    channel_id: ID,
    creator: address,
    members: vector<address>,
    timestamp: u64,
}

public struct ChannelMessageSent has copy, drop {
    channel_id: ID,
    sender: address,
    message_index: u64,
    timestamp: u64,
}

public struct MemberAdded has copy, drop {
    channel_id: ID,
    member: address,
    added_by: address,
    timestamp: u64,
}

public struct MemberRemoved has copy, drop {
    channel_id: ID,
    member: address,
    removed_by: address,
    timestamp: u64,
}

entry fun create_channel(
    name: vector<u8>,
    initial_members: vector<address>,
    clock: &Clock,
    ctx: &mut TxContext
) {
    let creator = tx_context::sender(ctx);
    let current_time = clock::timestamp_ms(clock);

    let channel = Channel {
        id: object::new(ctx),
        name: string::utf8(name),
        members: initial_members,
        encryption_key_history: vector::empty(),
        messages: vector::empty(),
        created_at: current_time,
        last_activity: current_time,
    };

    let channel_id = object::uid_to_inner(&channel.id);

    let mut i = 0;
    while (i < vector::length(&channel.members)) {
        let member = *vector::borrow(&channel.members, i);
        let member_cap = MemberCap {
            id: object::new(ctx),
            channel_id,
            member,
            permissions: vector::empty(),
            created_at: current_time,
        };
        transfer::transfer(member_cap, member);
        i = i + 1;
    };

    event::emit(ChannelCreated { channel_id, creator, members: channel.members, timestamp: current_time });
    transfer::share_object(channel);
}

entry fun send_message_to_channel(
    channel: &mut Channel,
    member_cap: &MemberCap,
    encrypted_content: vector<u8>,
    content_hash: vector<u8>,
    clock: &Clock,
    ctx: &TxContext
) {
    let sender = tx_context::sender(ctx);
    assert!(member_cap.member == sender, E_NOT_PARTICIPANT);
    assert!(vector::contains(&channel.members, &sender), E_NOT_PARTICIPANT);

    let timestamp = clock::timestamp_ms(clock);
    let message = devhub::messaging::new_message(sender, encrypted_content, content_hash, timestamp);
    vector::push_back(&mut channel.messages, message);
    let message_index = vector::length(&channel.messages) - 1;
    channel.last_activity = timestamp;

    event::emit(ChannelMessageSent { channel_id: object::uid_to_inner(&channel.id), sender, message_index, timestamp });
}

entry fun add_member_to_channel(
    channel: &mut Channel,
    new_member: address,
    clock: &Clock,
    ctx: &mut TxContext
) {
    let sender = tx_context::sender(ctx);
    assert!(vector::contains(&channel.members, &sender), E_NOT_PARTICIPANT);
    assert!(!vector::contains(&channel.members, &new_member), E_NOT_PARTICIPANT);

    let current_time = clock::timestamp_ms(clock);
    vector::push_back(&mut channel.members, new_member);

    let member_cap = MemberCap {
        id: object::new(ctx),
        channel_id: object::uid_to_inner(&channel.id),
        member: new_member,
        permissions: vector::empty(),
        created_at: current_time,
    };
    transfer::transfer(member_cap, new_member);

    channel.last_activity = current_time;
    event::emit(MemberAdded { channel_id: object::uid_to_inner(&channel.id), member: new_member, added_by: sender, timestamp: current_time });
}

entry fun remove_member_from_channel(
    channel: &mut Channel,
    member_to_remove: address,
    clock: &Clock,
    ctx: &TxContext
) {
    let sender = tx_context::sender(ctx);
    assert!(vector::contains(&channel.members, &sender), E_NOT_PARTICIPANT);

    let mut i = 0;
    let mut found = false;
    while (i < vector::length(&channel.members)) {
        if (*vector::borrow(&channel.members, i) == member_to_remove) {
            vector::remove(&mut channel.members, i);
            found = true;
            break
        };
        i = i + 1;
    };
    assert!(found, E_NOT_PARTICIPANT);

    let current_time = clock::timestamp_ms(clock);
    channel.last_activity = current_time;
    event::emit(MemberRemoved { channel_id: object::uid_to_inner(&channel.id), member: member_to_remove, removed_by: sender, timestamp: current_time });
}

public fun get_channel_messages(channel: &Channel): &vector<devhub::messaging::Message> { &channel.messages }
public fun get_channel_members(channel: &Channel): &vector<address> { &channel.members }

// ===== SEAL ACCESS CONTROL (channels) =====
entry fun seal_approve_channel_message(
    _id: vector<u8>,
    channel: &Channel,
    member_cap: &MemberCap,
    ctx: &TxContext,
) {
    let sender = tx_context::sender(ctx);
    assert!(vector::contains(&channel.members, &sender), E_NOT_PARTICIPANT);
    assert!(member_cap.member == sender, E_NOT_PARTICIPANT);
    assert!(member_cap.channel_id == object::uid_to_inner(&channel.id), E_NOT_PARTICIPANT);
}

}


