module devhub::devcard {
    use std::string::{Self, String};
    use sui::url::{Self, Url};
    use sui::object::{UID, ID};
    use sui::event;
    use sui::tx_context::TxContext;
    use sui::table::{Self, Table};

    // Constants for availability status
    const AVAILABLE: vector<u8> = b"Available";

    public struct PortfolioProject has store, copy, drop {
        title: String,
        url: Url,
        thumbnail_url: Url,
    }

    public struct Links has store, copy, drop {
        github: Url,
        website: Url,
        email: String,
        twitter: Url,
    }


    public struct DevCard has key, store {
        id: UID,
        owner: address,
        first_name: String,
        last_name: String,
        bio: String,
        title: String,
        location: String,
        timezone: String,
        primary_language: String,
        hourly_rate: u64,
        avatar_url: Url,
        years_of_experience: u8,
        skills: vector<String>,
        cv_link: Url,
        expertise_level: String,
        collaboration_mode: String,
        portfolio: vector<PortfolioProject>,
        links: Links,
        rating: u8,
        verified: bool,
        availability: String,
        is_active: bool,
        // Walrus blob IDs for file storage
        avatar_walrus_blob_id: Option<String>,
        cv_walrus_blob_id: Option<String>,
        portfolio_walrus_blob_ids: vector<String>,
    }

    // Global registry to ensure one card per user
    public struct DevCardRegistry has key, store {
        id: UID,
        user_cards: Table<address, ID>, // Maps user address to their card ID
    }

    // Events
    public struct DevCardCreated has copy, drop {
        card_id: ID,
        owner: address,
        name: String,
    }

    public struct DevCardUpdated has copy, drop {
        card_id: ID,
    }

    public struct DevCardDeleted has copy, drop {
        card_id: ID,
    }

    public struct WalrusBlobUpdated has copy, drop {
        card_id: ID,
        owner: address,
        blob_type: String, // "avatar", "cv", or "portfolio"
        new_blob_id: Option<String>,
    }

    public struct DevCardRegistryInitialized has copy, drop {
        registry_id: ID,
    }

    // Initialize the global registry (should be called once)
    public fun init_registry(ctx: &mut TxContext): DevCardRegistry {
        let registry = DevCardRegistry {
            id: object::new(ctx),
            user_cards: table::new(ctx),
        };
        
        event::emit(DevCardRegistryInitialized {
            registry_id: object::id(&registry),
        });
        
        registry
    }

    public fun create_dev_card(
        registry: &mut DevCardRegistry,
        owner: address,
        first_name: vector<u8>,
        last_name: vector<u8>,
        bio: vector<u8>,
        title: vector<u8>,
        location: vector<u8>,
        timezone: vector<u8>,
        primary_language: vector<u8>,
        hourly_rate: u64,
        avatar_url: vector<u8>,
        years_of_experience: u8,
        skills: vector<vector<u8>>,
        cv_link: vector<u8>,
        expertise_level: vector<u8>,
        collaboration_mode: vector<u8>,
        portfolio_titles: vector<vector<u8>>,
        portfolio_urls: vector<vector<u8>>,
        portfolio_thumbnails: vector<vector<u8>>,
        github_url: vector<u8>,
        website_url: vector<u8>,
        email: vector<u8>,
        twitter_url: vector<u8>,
        // Walrus blob parameters
        avatar_walrus_blob_id: Option<vector<u8>>,
        cv_walrus_blob_id: Option<vector<u8>>,
        portfolio_walrus_blob_ids: vector<vector<u8>>,
        ctx: &mut TxContext
    ): DevCard {
        // Check if user already has a card
        assert!(!table::contains(&registry.user_cards, owner), 0); // CARD_ALREADY_EXISTS
        let mut portfolio = vector::empty<PortfolioProject>();
        let num_projects = vector::length(&portfolio_titles);
        let mut i = 0;
        while (i < num_projects) {
            vector::push_back(&mut portfolio, PortfolioProject {
                title: string::utf8(*vector::borrow(&portfolio_titles, i)),
                url: url::new_unsafe_from_bytes(*vector::borrow(&portfolio_urls, i)),
                thumbnail_url: url::new_unsafe_from_bytes(*vector::borrow(&portfolio_thumbnails, i)),
            });
            i = i + 1;
        };

        let mut skills_str = vector::empty<String>();
        let num_skills = vector::length(&skills);
        let mut j = 0;
        while (j < num_skills) {
            vector::push_back(&mut skills_str, string::utf8(*vector::borrow(&skills, j)));
            j = j + 1;
        };

        // Process Walrus blob IDs
        let avatar_blob_id = if (std::option::is_some(&avatar_walrus_blob_id)) {
            std::option::some(string::utf8(*std::option::borrow(&avatar_walrus_blob_id)))
        } else {
            std::option::none()
        };

        let cv_blob_id = if (std::option::is_some(&cv_walrus_blob_id)) {
            std::option::some(string::utf8(*std::option::borrow(&cv_walrus_blob_id)))
        } else {
            std::option::none()
        };

        let mut portfolio_blob_ids = vector::empty<String>();
        let num_portfolio_blobs = vector::length(&portfolio_walrus_blob_ids);
        let mut k = 0;
        while (k < num_portfolio_blobs) {
            vector::push_back(&mut portfolio_blob_ids, string::utf8(*vector::borrow(&portfolio_walrus_blob_ids, k)));
            k = k + 1;
        };

        let card = DevCard {
            id: object::new(ctx),
            owner,
            first_name: string::utf8(first_name),
            last_name: string::utf8(last_name),
            bio: string::utf8(bio),
            title: string::utf8(title),
            location: string::utf8(location),
            timezone: string::utf8(timezone),
            primary_language: string::utf8(primary_language),
            hourly_rate,
            avatar_url: url::new_unsafe_from_bytes(avatar_url),
            years_of_experience,
            skills: skills_str,
            cv_link: url::new_unsafe_from_bytes(cv_link),
            expertise_level: string::utf8(expertise_level),
            collaboration_mode: string::utf8(collaboration_mode),
            portfolio,
            links: Links {
                github: url::new_unsafe_from_bytes(github_url),
                website: url::new_unsafe_from_bytes(website_url),
                email: string::utf8(email),
                twitter: url::new_unsafe_from_bytes(twitter_url),
            },
            rating: 0,
            verified: false,
            availability: string::utf8(AVAILABLE),
            is_active: true,
            // Walrus blob IDs
            avatar_walrus_blob_id: avatar_blob_id,
            cv_walrus_blob_id: cv_blob_id,
            portfolio_walrus_blob_ids: portfolio_blob_ids,
        };

        // Register the card in the global registry
        table::add(&mut registry.user_cards, owner, object::id(&card));
        
        event::emit(DevCardCreated {
            card_id: object::id(&card),
            owner,
            name: card.first_name
        });

        card
    }

    // Update avatar Walrus blob
    public entry fun update_avatar_walrus_blob(
        _registry: &mut DevCardRegistry,
        card: &mut DevCard,
        new_blob_id: Option<vector<u8>>,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        assert!(sender == card.owner, 1); // NOT_THE_OWNER

        let new_blob_id_option = if (std::option::is_some(&new_blob_id)) {
            std::option::some(string::utf8(*std::option::borrow(&new_blob_id)))
        } else {
            std::option::none()
        };

        card.avatar_walrus_blob_id = new_blob_id_option;

        event::emit(WalrusBlobUpdated {
            card_id: object::id(card),
            owner: sender,
            blob_type: string::utf8(b"avatar"),
            new_blob_id: new_blob_id_option,
        });
    }

    // Update CV Walrus blob
     public entry fun update_cv_walrus_blob(
        _registry: &mut DevCardRegistry,
        card: &mut DevCard,
        new_blob_id: Option<vector<u8>>,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        assert!(sender == card.owner, 1); // NOT_THE_OWNER

        let new_blob_id_option = if (std::option::is_some(&new_blob_id)) {
            std::option::some(string::utf8(*std::option::borrow(&new_blob_id)))
        } else {
            std::option::none()
        };

        card.cv_walrus_blob_id = new_blob_id_option;

        event::emit(WalrusBlobUpdated {
            card_id: object::id(card),
            owner: sender,
            blob_type: string::utf8(b"cv"),
            new_blob_id: new_blob_id_option,
        });
    }

    // Delete a DevCard (allows user to create a new one)
     public entry fun delete_dev_card(
        registry: &mut DevCardRegistry,
        card: DevCard,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        assert!(sender == card.owner, 1); // NOT_THE_OWNER

        let card_id = object::id(&card);
        
        // Remove from registry
        table::remove(&mut registry.user_cards, sender);

        event::emit(DevCardDeleted {
            card_id,
        });

        // Destroy the card object
        let DevCard { 
            id, 
            owner: _, 
            first_name: _, 
            last_name: _, 
            bio: _, 
            title: _, 
            location: _, 
            timezone: _, 
            primary_language: _, 
            hourly_rate: _, 
            avatar_url: _, 
            years_of_experience: _, 
            skills: _, 
            cv_link: _, 
            expertise_level: _, 
            collaboration_mode: _, 
            portfolio: _, 
            links: _, 
            rating: _, 
            verified: _, 
            availability: _, 
            is_active: _,
            avatar_walrus_blob_id: _,
            cv_walrus_blob_id: _,
            portfolio_walrus_blob_ids: _,
        } = card;
        object::delete(id);
    }

    // View functions
    public fun get_user_card_id(registry: &DevCardRegistry, user: address): Option<ID> {
        if (table::contains(&registry.user_cards, user)) {
            std::option::some(*table::borrow(&registry.user_cards, user))
        } else {
            std::option::none()
        }
    }

    public fun user_has_card(registry: &DevCardRegistry, user: address): bool {
        table::contains(&registry.user_cards, user)
    }

    public fun get_avatar_walrus_blob_id(card: &DevCard): Option<String> {
        card.avatar_walrus_blob_id
    }

    public fun get_cv_walrus_blob_id(card: &DevCard): Option<String> {
        card.cv_walrus_blob_id
    }

    public fun get_portfolio_walrus_blob_ids(card: &DevCard): vector<String> {
        card.portfolio_walrus_blob_ids
    }

    // Getter and setter functions for rating (needed by review module)
    public fun get_rating(card: &DevCard): u8 {
        card.rating
    }

    public fun set_rating(card: &mut DevCard, new_rating: u8) {
        card.rating = new_rating;
    }
}
