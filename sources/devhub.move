// defining the devhub module

module devhub::devcard {

use std::string::{Self, String};
use sui::balance::{Self, Balance};
use sui::coin::{Self, Coin};
use sui::event;
use sui::sui::SUI;
use sui::table::{Self, Table};
use sui::url::{Self, Url};

// creating error codes
const NOT_THE_OWNER: u64 = 0;
const INSUFFICIENT_FUNDS: u64 = 1;
const NOT_ADMIN: u64 = 2;
const CARD_ALREADY_EXISTS: u64 = 3;
const CARD_NOT_FOUND: u64 = 4;

// creating DevCard struct
public struct DevCard has key, store {
    id: UID,
    owner: address,
    name: String,
    description: String, // Now required field
    image_url: Url,
    title: String,
    years_of_experience: u8,
    technologies: String,
    contact: String,
    portfolio: String,
    open_to_work: bool,
    is_active: bool, // New field for card activation status
}

// created the admin struct
public struct DevHub has key, store {
    id: UID,
    admin: address,
    counter: u64,
    cards: Table<u64, DevCard>,
    user_cards: Table<address, u64>, // Maps user address to their card ID
    platform_fees: Balance<SUI>,
    platform_fee: u64, // Dynamic platform fee
}

// created struct to handle created cards
public struct CardCreated has copy, drop {
    card_id: u64,
    owner: address,
    name: String,
    title: String,
    contact: String,
    description: String,
    platform_fee_paid: u64,
}

// created struct for updating description
public struct DescriptionUpdated has copy, drop {
    name: String,
    owner: address,
    new_description: String,
}

// created struct to handle card deletion
public struct CardDeleted has copy, drop {
    card_id: u64,
    owner: address,
    name: String,
}

// created struct to handle card activation/deactivation
public struct CardStatusChanged has copy, drop {
    card_id: u64,
    owner: address,
    name: String,
    is_active: bool,
    open_to_work: bool,
}

//created struct to handle platform withdrawal fees
public struct PlatformFeesWithdrawn has copy, drop {
    admin: address,
    amount: u64,
    recipient: address,
}

// created struct to handle admin transfers
public struct AdminTransferred has copy, drop {
    old_admin: address,
    new_admin: address,
}

// created struct to handle platform fee changes
public struct PlatformFeeChanged has copy, drop {
    admin: address,
    old_fee: u64,
    new_fee: u64,
}

// created initialization function which will run once
fun init(ctx: &mut TxContext) {
    transfer::share_object(DevHub {
        id: object::new(ctx),
        admin: tx_context::sender(ctx),
        counter: 0,
        cards: table::new(ctx),
        user_cards: table::new(ctx),
        platform_fees: balance::zero(),
        platform_fee: 100_000_000, // Default 0.1 SUI platform fee
    });
}

/// Create a new developer card with platform fee payment
entry fun create_card(
entry fun create_card(
    name: vector<u8>,
    description: vector<u8>, // Now required
    title: vector<u8>,
    image_url: vector<u8>,
    years_of_experience: u8,
    technologies: vector<u8>,
    portfolio: vector<u8>,
    contact: vector<u8>,
    mut payment: Coin<SUI>,
    devhub: &mut DevHub,
    ctx: &mut TxContext,
) {
    let sender = tx_context::sender(ctx);
    
    // Check if user already has a card
    assert!(!table::contains(&devhub.user_cards, sender), CARD_ALREADY_EXISTS);
    
    let value = coin::value(&payment);
    assert!(value >= devhub.platform_fee, INSUFFICIENT_FUNDS);

    // Collect platform fee
    let platform_fee_coin = coin::split(&mut payment, devhub.platform_fee, ctx);
    let platform_fee_balance = coin::into_balance(platform_fee_coin);
    balance::join(&mut devhub.platform_fees, platform_fee_balance);

    // Return any excess payment to the sender
    if (coin::value(&payment) > 0) {
        transfer::public_transfer(payment, sender);
    } else {
        coin::destroy_zero(payment);
    };

    devhub.counter = devhub.counter + 1;
    let id = object::new(ctx);
    let card_id = devhub.counter;

    let name_str = string::utf8(name);
    let description_str = string::utf8(description);

    event::emit(CardCreated {
        card_id,
        name: name_str,
        owner: sender,
        title: string::utf8(title),
        contact: string::utf8(contact),
        description: description_str,
        platform_fee_paid: devhub.platform_fee,
    });

    let devcard = DevCard {
        id: id,
        name: name_str,
        owner: sender,
        title: string::utf8(title),
        image_url: url::new_unsafe_from_bytes(image_url),
        description: description_str,
        years_of_experience,
        technologies: string::utf8(technologies),
        portfolio: string::utf8(portfolio),
        contact: string::utf8(contact),
        open_to_work: true,
        is_active: true, // Card is active by default
    };

    table::add(&mut devhub.cards, card_id, devcard);
    table::add(&mut devhub.user_cards, sender, card_id);
}

/// Delete user's card (allows them to create a new one)
entry fun delete_card(devhub: &mut DevHub, ctx: &mut TxContext) {
    let sender = tx_context::sender(ctx);
    
    // Check if user has a card
    assert!(table::contains(&devhub.user_cards, sender), CARD_NOT_FOUND);
    
    let card_id = table::remove(&mut devhub.user_cards, sender);
    let card = table::remove(&mut devhub.cards, card_id);
    
    // Verify ownership (extra safety check)
    assert!(card.owner == sender, NOT_THE_OWNER);

    event::emit(CardDeleted {
        card_id,
        owner: sender,
        name: card.name,
    });

    // Destroy the card object
    let DevCard { 
        id, 
        owner: _, 
        name: _, 
        description: _, 
        image_url: _, 
        title: _, 
        years_of_experience: _, 
        technologies: _, 
        contact: _, 
        portfolio: _, 
        open_to_work: _, 
        is_active: _ 
    } = card;
    object::delete(id);
}

// created function to update card description
entry fun update_card_description(
    devhub: &mut DevHub,
    new_description: vector<u8>,
    ctx: &mut TxContext,
) {
    let sender = tx_context::sender(ctx);
    
    // Check if user has a card
    assert!(table::contains(&devhub.user_cards, sender), CARD_NOT_FOUND);
    
    let card_id = *table::borrow(&devhub.user_cards, sender);
    let user_card = table::borrow_mut(&mut devhub.cards, card_id);
    assert!(sender == user_card.owner, NOT_THE_OWNER);
    
    let new_desc_str = string::utf8(new_description);
    user_card.description = new_desc_str;

    event::emit(DescriptionUpdated {
        name: user_card.name,
        owner: user_card.owner,
        new_description: new_desc_str,
    });
}

// created function to activate card (sets both is_active and open_to_work to true)
entry fun activate_card(devhub: &mut DevHub, ctx: &mut TxContext) {
    let sender = tx_context::sender(ctx);
    
    // Check if user has a card
    assert!(table::contains(&devhub.user_cards, sender), CARD_NOT_FOUND);
    
    let card_id = *table::borrow(&devhub.user_cards, sender);
    let card = table::borrow_mut(&mut devhub.cards, card_id);
    assert!(card.owner == sender, NOT_THE_OWNER);
    
    card.is_active = true;
    card.open_to_work = true;

    event::emit(CardStatusChanged {
        card_id,
        owner: sender,
        name: card.name,
        is_active: true,
        open_to_work: true,
    });
}

// created function to deactivate card (sets both is_active and open_to_work to false)
entry fun deactivate_card(devhub: &mut DevHub, ctx: &mut TxContext) {
    let sender = tx_context::sender(ctx);
    
    // Check if user has a card
    assert!(table::contains(&devhub.user_cards, sender), CARD_NOT_FOUND);
    
    let card_id = *table::borrow(&devhub.user_cards, sender);
    let card = table::borrow_mut(&mut devhub.cards, card_id);
    assert!(card.owner == sender, NOT_THE_OWNER);
    
    card.is_active = false;
    card.open_to_work = false;

    event::emit(CardStatusChanged {
        card_id,
        owner: sender,
        name: card.name,
        is_active: false,
        open_to_work: false,
    });
}

// created function to set open_to_work status while keeping card active
entry fun set_work_availability(devhub: &mut DevHub, available: bool, ctx: &mut TxContext) {
    let sender = tx_context::sender(ctx);
    
    // Check if user has a card
    assert!(table::contains(&devhub.user_cards, sender), CARD_NOT_FOUND);
    
    let card_id = *table::borrow(&devhub.user_cards, sender);
    let card = table::borrow_mut(&mut devhub.cards, card_id);
    assert!(card.owner == sender, NOT_THE_OWNER);
    
    // Only allow setting work availability if card is active
    if (card.is_active) {
        card.open_to_work = available;

        event::emit(CardStatusChanged {
            card_id,
            owner: sender,
            name: card.name,
            is_active: card.is_active,
            open_to_work: available,
        });
    };
}

// === Platform Fee Management (Admin Only) ===

/// Change platform fee (admin only)
entry fun set_platform_fee(devhub: &mut DevHub, new_fee: u64, ctx: &mut TxContext) {
    assert!(tx_context::sender(ctx) == devhub.admin, NOT_ADMIN);

    let old_fee = devhub.platform_fee;
    devhub.platform_fee = new_fee;

    event::emit(PlatformFeeChanged {
        admin: devhub.admin,
        old_fee,
        new_fee,
    });
}

/// Withdraw collected platform fees to a specified address (admin only)
entry fun withdraw_platform_fees(
    devhub: &mut DevHub,
    recipient: address,
    amount: u64,
    ctx: &mut TxContext,
) {
    assert!(tx_context::sender(ctx) == devhub.admin, NOT_ADMIN);

    let current_balance = balance::value(&devhub.platform_fees);
    assert!(amount <= current_balance, INSUFFICIENT_FUNDS);

    let withdrawal_balance = balance::split(&mut devhub.platform_fees, amount);
    let withdrawal_coin = coin::from_balance(withdrawal_balance, ctx);

    transfer::public_transfer(withdrawal_coin, recipient);

    event::emit(PlatformFeesWithdrawn {
        admin: tx_context::sender(ctx),
        amount,
        recipient,
    });
}

/// Withdraw all collected platform fees to admin's address
entry fun withdraw_all_platform_fees(devhub: &mut DevHub, ctx: &mut TxContext) {
    assert!(tx_context::sender(ctx) == devhub.admin, NOT_ADMIN);

    let amount = balance::value(&devhub.platform_fees);
    if (amount > 0) {
        let withdrawal_balance = balance::withdraw_all(&mut devhub.platform_fees);
        let withdrawal_coin = coin::from_balance(withdrawal_balance, ctx);

        transfer::public_transfer(withdrawal_coin, devhub.admin);

        event::emit(PlatformFeesWithdrawn {
            admin: devhub.admin,
            amount,
            recipient: devhub.admin,
        });
    };
}

/// Transfer admin privileges to a new address (admin only)
entry fun transfer_admin(devhub: &mut DevHub, new_admin: address, ctx: &mut TxContext) {
    assert!(tx_context::sender(ctx) == devhub.admin, NOT_ADMIN);

    let old_admin = devhub.admin;
    devhub.admin = new_admin;

    event::emit(AdminTransferred {
        old_admin,
        new_admin,
    });
}

// === View Functions ===

public fun get_card_info(
    devhub: &DevHub,
    id: u64,
): (String, address, String, Url, String, u8, String, String, String, bool, bool) {
    let card = table::borrow(&devhub.cards, id);
    (
        card.name,
        card.owner,
        card.title,
        card.image_url,
        card.description,
        card.years_of_experience,
        card.technologies,
        card.portfolio,
        card.contact,
        card.open_to_work,
        card.is_active,
    )
}

/// Get user's card ID if they have one
public fun get_user_card_id(devhub: &DevHub, user: address): Option<u64> {
    if (table::contains(&devhub.user_cards, user)) {
        option::some(*table::borrow(&devhub.user_cards, user))
    } else {
        option::none()
    }
}

/// Check if user has a card
public fun user_has_card(devhub: &DevHub, user: address): bool {
    table::contains(&devhub.user_cards, user)
}

/// Get total number of cards
public fun get_card_count(devhub: &DevHub): u64 {
    devhub.counter
}

/// Get current admin address
public fun get_admin(devhub: &DevHub): address {
    devhub.admin
}

/// Get current platform fee balance
public fun get_platform_fee_balance(devhub: &DevHub): u64 {
    balance::value(&devhub.platform_fees)
}

/// Get the current platform fee amount for card creation
public fun get_platform_fee(devhub: &DevHub): u64 {
    devhub.platform_fee
}

/// Check if an address is the admin
public fun is_admin(devhub: &DevHub, addr: address): bool {
    devhub.admin == addr
}

/// Check if a card exists and is active (for browse page filtering)
public fun is_card_active(devhub: &DevHub, id: u64): bool {
    if (table::contains(&devhub.cards, id)) {
        let card = table::borrow(&devhub.cards, id);
        card.is_active
    } else {
        false
    }
}

/// Check if a card is open to work (only meaningful if card is active)
public fun is_card_open_to_work(devhub: &DevHub, id: u64): bool {
    if (table::contains(&devhub.cards, id)) {
        let card = table::borrow(&devhub.cards, id);
        card.is_active && card.open_to_work
    } else {
        false
    }
}

}