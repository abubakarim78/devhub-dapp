module devhub::devhub {
    use sui::object::{Self, ID, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;

    use devhub::devcard::{Self, DevCard, DevCardRegistry};
    use devhub::project::{Self, Project, Application};
    use devhub::proposal::{Self, Proposal};
    use devhub::escrow::{Self, Escrow};
    use devhub::review::{Self, Review};
    use devhub::admin::{Self, SuperAdminCap, PlatformConfig};
    use devhub::connections::{Self, ConnectionStore};
    use devhub::messaging;

    public struct DevHub has key {
        id: UID,
        version: u64,
    }

    fun init(ctx: &mut TxContext) {
        transfer::share_object(DevHub {
            id: object::new(ctx),
            version: 1,
        });

        // Initialize DevCard registry
        let registry = devcard::init_registry(ctx);
        transfer::public_share_object(registry);
    }

    // DevCard functions
     entry fun create_dev_card(
        registry: &mut DevCardRegistry,
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
    ) {
        let owner = tx_context::sender(ctx);
        let card = devcard::create_dev_card(
            registry, owner, first_name, last_name, bio, title, location, timezone, 
            primary_language, hourly_rate, avatar_url, years_of_experience, skills, 
            cv_link, expertise_level, collaboration_mode, portfolio_titles, 
            portfolio_urls, portfolio_thumbnails, github_url, website_url, email, twitter_url,
            avatar_walrus_blob_id, cv_walrus_blob_id, portfolio_walrus_blob_ids, ctx
        );
        transfer::public_transfer(card, owner);
    }

    // Project functions
     entry fun create_project(
        title: vector<u8>,
        description: vector<u8>,
        skills: vector<vector<u8>>,
        budget: u64,
        timeline: vector<u8>,
        milestones: vector<vector<u8>>,
        project_type: vector<u8>,
        file_hashes: vector<vector<u8>>,
        walrus_file_blob_ids: vector<vector<u8>>,
        ctx: &mut TxContext
    ) {
        let client = tx_context::sender(ctx);
        project::create_project(
            client, title, description, skills, budget, timeline, milestones, 
            project_type, file_hashes, walrus_file_blob_ids, ctx
        );
    }

     entry fun apply_to_project(
        project: &mut Project,
        dev_card_id: ID,
        cover_letter_hash: vector<u8>,
        proposed_timeline: vector<u8>,
        bid_amount: u64,
        portfolio_references: vector<vector<u8>>,
        cover_letter_walrus_blob_id: Option<vector<u8>>,
        portfolio_walrus_blob_ids: vector<vector<u8>>,
        ctx: &mut TxContext
    ) {
        project::apply_to_project(
            project, dev_card_id, cover_letter_hash, proposed_timeline, 
            bid_amount, portfolio_references, cover_letter_walrus_blob_id, 
            portfolio_walrus_blob_ids, ctx
        );
    }

    // Proposal functions
     entry fun create_proposal(
        developer: address,
        dev_card_id: ID,
        title: vector<u8>,
        timeline: vector<u8>,
        milestones: vector<vector<u8>>,
        ctx: &mut TxContext
    ) {
        let client = tx_context::sender(ctx);
        let proposal = proposal::create_proposal(
            client, developer, dev_card_id, title, timeline, milestones, ctx
        );
        proposal::send_proposal(proposal, developer);
    }

    // Escrow functions
     entry fun create_escrow(
        project_id: ID,
        developer: address,
        milestone_descriptions: vector<vector<u8>>,
        milestone_amounts: vector<u64>,
        payment: Coin<SUI>,
        ctx: &mut TxContext
    ) {
        let client = tx_context::sender(ctx);
        escrow::create_escrow(
            project_id, client, developer, milestone_descriptions, milestone_amounts, payment, ctx
        );
    }

    // Review functions
     entry fun leave_review(
        project_id: ID,
        dev_card: &mut DevCard,
        rating: u8,
        comment: vector<u8>,
        ctx: &mut TxContext
    ) {
        review::leave_review(project_id, dev_card, rating, comment, ctx);
    }

    // Connection functions
     entry fun send_connection_request(to: address, ctx: &mut TxContext) {
        connections::send_connection_request(to, ctx);
    }

     entry fun accept_connection_request(store: &mut ConnectionStore, req: connections::ConnectionRequest, ctx: &mut TxContext) {
        connections::accept_connection_request(store, req, ctx);
    }

    // Messaging functions
     entry fun send_message_notification(to: address, message_hash: vector<u8>, ctx: &mut TxContext) {
        messaging::send_message_notification(to, message_hash, ctx);
    }

    // DevCard Walrus blob management functions
     entry fun update_avatar_walrus_blob(
        registry: &mut DevCardRegistry,
        card: &mut DevCard,
        new_blob_id: Option<vector<u8>>,
        ctx: &mut TxContext
    ) {
        devcard::update_avatar_walrus_blob(registry, card, new_blob_id, ctx);
    }

     entry fun update_cv_walrus_blob(
        registry: &mut DevCardRegistry,
        card: &mut DevCard,
        new_blob_id: Option<vector<u8>>,
        ctx: &mut TxContext
    ) {
        devcard::update_cv_walrus_blob(registry, card, new_blob_id, ctx);
    }

     entry fun delete_dev_card(
        registry: &mut DevCardRegistry,
        card: DevCard,
        ctx: &mut TxContext
    ) {
        devcard::delete_dev_card(registry, card, ctx);
    }

    // View functions
    public fun user_has_card(registry: &DevCardRegistry, user: address): bool {
        devcard::user_has_card(registry, user)
    }

    public fun get_user_card_id(registry: &DevCardRegistry, user: address): Option<ID> {
        devcard::get_user_card_id(registry, user)
    }
}
