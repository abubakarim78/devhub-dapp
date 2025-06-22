module devhub::devcard {
    use std::string::{Self, String};
    use sui::tx_context::{Self, TxContext};
    use sui::object::{Self, UID};
    use sui::coin::{Self, Coin};
    use sui::url::{Self, Url};
    use sui::event;
    use sui::table::{Self, Table};
    use sui::sui::SUI;
    use sui::transfer;
    use std::option::{Self, Option};

    const NOT_THE_OWNER: u64 = 0;
    const INSUFFICIENT_FUNDS: u64 = 1;
    const MIN_CARD_COST: u64 = 1;

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

    public struct DevHub has key, store {
        id: UID,
        owner: address,
        counter: u64,
        cards: Table<u64, DevCard>,
    }

    public struct CardCreated has copy, drop {
        card_id: u64, // Changed from id to card_id to avoid confusion
        owner: address,
        name: String,
        title: String,
        contact: String,
    }

    public struct DescriptionUpdated has copy, drop {
        name: String,
        owner: address,
        new_description: String,
    }

    // Fixed: Made init function private (fun instead of public fun)
    fun init(ctx: &mut TxContext) {
        transfer::share_object(
            DevHub {
                id: object::new(ctx),
                owner: tx_context::sender(ctx),
                counter: 0,
                cards: table::new(ctx),
            }
        );
    }

    public entry fun create_card(
        name: vector<u8>,
        title: vector<u8>,
        image_url: vector<u8>,
        years_of_experience: u8,
        technologies: vector<u8>,
        portfolio: vector<u8>,
        contact: vector<u8>,
        payment: Coin<SUI>,
        devhub: &mut DevHub,
        ctx: &mut TxContext
    ) {
        let value = coin::value(&payment);
        assert!(value == MIN_CARD_COST, INSUFFICIENT_FUNDS);
        transfer::public_transfer(payment, devhub.owner);

        devhub.counter = devhub.counter + 1;
        let id = object::new(ctx);

        // Fixed: Use counter as the event id instead of UID
        event::emit(
            CardCreated {
                card_id: devhub.counter, // Use the counter value
                name: string::utf8(name),
                owner: tx_context::sender(ctx),
                title: string::utf8(title),
                contact: string::utf8(contact)
            }
        );

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

    public entry fun update_card_description(
        devhub: &mut DevHub,
        new_description: vector<u8>,
        id: u64,
        ctx: &mut TxContext
    ) {
        let user_card = table::borrow_mut(&mut devhub.cards, id);
        assert!(tx_context::sender(ctx) == user_card.owner, NOT_THE_OWNER);
        let old_value = option::swap_or_fill(&mut user_card.description, string::utf8(new_description));

        event::emit(DescriptionUpdated {
            name: user_card.name,
            owner: user_card.owner,
            new_description: string::utf8(new_description)
        });

        _ = old_value;
    }

    public entry fun activate_card(devhub: &mut DevHub, id: u64, ctx: &mut TxContext) {
        let card = table::borrow_mut(&mut devhub.cards, id);
        assert!(card.owner == tx_context::sender(ctx), NOT_THE_OWNER);
        card.open_to_work = true;
    }

    public entry fun deactivate_card(devhub: &mut DevHub, id: u64, ctx: &mut TxContext) {
        let card = table::borrow_mut(&mut devhub.cards, id);
        assert!(card.owner == tx_context::sender(ctx), NOT_THE_OWNER);
        card.open_to_work = false;
    }

    public fun get_card_info(devhub: &DevHub, id: u64): (
        String,
        address,
        String,
        Url,
        Option<String>,
        u8,
        String,
        String,
        String,
        bool,
    ) {
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
            card.open_to_work
        )
    }

    // Additional helper function to get total number of cards
    public fun get_card_count(devhub: &DevHub): u64 {
        devhub.counter
    }
}