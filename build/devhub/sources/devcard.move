// defining the devhub module

module devhub::devcard;

use std::option::{Self, Option};
use std::string::{Self, String};
use sui::balance::{Self, Balance};
use sui::coin::{Self, Coin};
use sui::event;
use sui::object::{Self, UID};
use sui::sui::SUI;
use sui::table::{Self, Table};
use sui::transfer;
use sui::tx_context::{Self, TxContext};
use sui::url::{Self, Url};

// creating error codes
const NOT_THE_OWNER: u64 = 0;
const INSUFFICIENT_FUNDS: u64 = 1;
const NOT_ADMIN: u64 = 2;
const PLATFORM_FEE: u64 = 100_000_000; // 0.1 SUI platform fee for card creation

// creatng DevCard struct
public struct DevCard has key, store {
    id: UID,
    owner: address,
    name: String,
    description: Option<String>,
    image_url: Url,
    title: String,
    years_of_experience: u8,
    technologies: String,
    contact: String,
    portfolio: String,
    open_to_work: bool,
}
// created the admin struct
public struct DevHub has key, store {
    id: UID,
    admin: address,
    counter: u64,
    cards: Table<u64, DevCard>,
    platform_fees: Balance<SUI>, // Collected platform fees from card creation
}

// created struct to handle created cards
public struct CardCreated has copy, drop {
    card_id: u64,
    owner: address,
    name: String,
    title: String,
    contact: String,
    platform_fee_paid: u64, // Track platform fee paid
}

// created struct for updating description
public struct DescriptionUpdated has copy, drop {
    name: String,
    owner: address,
    new_description: String,
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

// created initilization function which will run once

fun init(ctx: &mut TxContext) {
    transfer::share_object(DevHub {
        id: object::new(ctx),
        admin: tx_context::sender(ctx),
        counter: 0,
        cards: table::new(ctx),
        platform_fees: balance::zero(),
    });
}

/// Create a new developer card with platform fee payment
public entry fun create_card(
    name: vector<u8>,
    title: vector<u8>,
    image_url: vector<u8>,
    years_of_experience: u8,
    technologies: vector<u8>,
    portfolio: vector<u8>,
    contact: vector<u8>,
    mut payment: Coin<SUI>, // Payment must include platform fee
    devhub: &mut DevHub,
    ctx: &mut TxContext,
) {
    let value = coin::value(&payment);
    assert!(value >= PLATFORM_FEE, INSUFFICIENT_FUNDS);

    // Collect platform fee
    let platform_fee_coin = coin::split(&mut payment, PLATFORM_FEE, ctx);
    let platform_fee_balance = coin::into_balance(platform_fee_coin);
    balance::join(&mut devhub.platform_fees, platform_fee_balance);

    // Return any excess payment to the sender
    if (coin::value(&payment) > 0) {
        transfer::public_transfer(payment, tx_context::sender(ctx));
    } else {
        coin::destroy_zero(payment);
    };

    devhub.counter = devhub.counter + 1;
    let id = object::new(ctx);

    event::emit(CardCreated {
        card_id: devhub.counter,
        name: string::utf8(name),
        owner: tx_context::sender(ctx),
        title: string::utf8(title),
        contact: string::utf8(contact),
        platform_fee_paid: PLATFORM_FEE,
    });

    let devcard = DevCard {
        id: id,
        name: string::utf8(name),
        owner: tx_context::sender(ctx),
        title: string::utf8(title),
        image_url: url::new_unsafe_from_bytes(image_url),
        description: option::none(),
        years_of_experience,
        technologies: string::utf8(technologies),
        portfolio: string::utf8(portfolio),
        contact: string::utf8(contact),
        open_to_work: true,
    };

    table::add(&mut devhub.cards, devhub.counter, devcard);
}

// created function to update card description
public entry fun update_card_description(
    devhub: &mut DevHub,
    new_description: vector<u8>,
    id: u64,
    ctx: &mut TxContext,
) {
    let user_card = table::borrow_mut(&mut devhub.cards, id);
    assert!(tx_context::sender(ctx) == user_card.owner, NOT_THE_OWNER);
    let old_value = option::swap_or_fill(&mut user_card.description, string::utf8(new_description));

    event::emit(DescriptionUpdated {
        name: user_card.name,
        owner: user_card.owner,
        new_description: string::utf8(new_description),
    });

    _ = old_value;
}

// created function to activate card
public entry fun activate_card(devhub: &mut DevHub, id: u64, ctx: &mut TxContext) {
    let card = table::borrow_mut(&mut devhub.cards, id);
    assert!(card.owner == tx_context::sender(ctx), NOT_THE_OWNER);
    card.open_to_work = true;
}

// created function to deactivate card
public entry fun deactivate_card(devhub: &mut DevHub, id: u64, ctx: &mut TxContext) {
    let card = table::borrow_mut(&mut devhub.cards, id);
    assert!(card.owner == tx_context::sender(ctx), NOT_THE_OWNER);
    card.open_to_work = false;
}

// === Platform Fee Management (Admin Only) ===

/// Withdraw collected platform fees to a specified address (admin only)
public entry fun withdraw_platform_fees(
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
public entry fun withdraw_all_platform_fees(devhub: &mut DevHub, ctx: &mut TxContext) {
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
public entry fun transfer_admin(devhub: &mut DevHub, new_admin: address, ctx: &mut TxContext) {
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
): (String, address, String, Url, Option<String>, u8, String, String, String, bool) {
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
    )
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

/// Get the platform fee amount for card creation
public fun get_platform_fee(): u64 {
    PLATFORM_FEE
}

/// Check if an address is the admin
public fun is_admin(devhub: &DevHub, addr: address): bool {
    devhub.admin == addr
}
