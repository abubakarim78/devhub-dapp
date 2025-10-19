module devhub::devhub {
    use sui::object::{Self, ID, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;

    use devhub::devcard::{Self, Profile, ProfileRegistry};
    use devhub::project::{Self, Project, Application};
    use devhub::proposal::{Self, Proposal, PlatformStatistics, ProposalsByStatus, UserProposals, Deliverable, Milestone, TeamMember, Link};
    use devhub::escrow::{Self, Escrow};
    use devhub::review::{Self, Review};
    use sui::clock::{Self, Clock};
    use sui::table::{Self, Table};
    use sui::balance::{Self, Balance};
    use std::vector;
    use std::option::{Self, Option};

    use devhub::admin::{Self, SuperAdminCapability, PlatformConfig, AdminDirectory, AccruedFees, WithdrawalLog, ActivityLog};
    use devhub::connections::{Self, ConnectionStore};
    use devhub::messaging::{Self, Conversation};

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

        // Initialize Admin module
        admin::create_super_admin_capability(ctx);
        admin::create_admin_directory(ctx);
        admin::create_platform_config(ctx);
        admin::create_accrued_fees(ctx);
        admin::create_withdrawal_log(ctx);
        admin::create_activity_log(ctx);

        // Initialize Proposal module
        proposal::create_platform_statistics(ctx);
        proposal::create_proposals_by_status(ctx);
    }

    // Profile functions
    entry fun create_profile(
        registry: &mut ProfileRegistry,
        platform_config: &PlatformConfig,
        accrued_fees: &mut AccruedFees,
        payment: Coin<SUI>,
        display_name: vector<u8>,
        handle: vector<u8>,
        role: vector<u8>,
        location: vector<u8>,
        bio: vector<u8>,
        profile_image_url: vector<u8>,
        website_url: vector<u8>,
        github_username: vector<u8>,
        twitter_handle: vector<u8>,
        email: vector<u8>,
        ens_handle: vector<u8>,
        hourly_rate: u64,
        availability_status: bool,
        public_profile: bool,
        terms_accepted: bool,
        avatar_walrus_blob_id: Option<vector<u8>>,
        cv_walrus_blob_id: Option<vector<u8>>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        admin::collect_profile_card_fee(payment, accrued_fees, platform_config, ctx);
        let owner = tx_context::sender(ctx);
        let profile = devcard::create_profile(
            registry, display_name, handle, role, location, bio,
            profile_image_url, website_url, github_username, twitter_handle,
            email, ens_handle, hourly_rate, availability_status,
            public_profile, terms_accepted, avatar_walrus_blob_id, cv_walrus_blob_id, clock, ctx
        );
        transfer::public_transfer(profile, owner);
    }

    // Project functions
    entry fun create_project(
        platform_config: &PlatformConfig,
        accrued_fees: &mut AccruedFees,
        payment: Coin<SUI>,
        title: vector<u8>,
        short_summary: vector<u8>,
        description: vector<u8>,
        category: vector<u8>,
        experience_level: vector<u8>,
        budget_min: u64,
        budget_max: u64,
        timeline_weeks: u64,
        required_skills: vector<vector<u8>>,
        attachments_count: u64,
        escrow_enabled: bool,
        visibility: vector<u8>,
        applications_status: vector<u8>,
        devhub_messages_enabled: bool,
        attachments_walrus_blob_ids: vector<vector<u8>>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        admin::collect_project_posting_fee(payment, accrued_fees, platform_config, ctx);
        project::create_project(
            title, short_summary, description, category, experience_level,
            budget_min, budget_max, timeline_weeks, required_skills,
            attachments_count, escrow_enabled, visibility, applications_status,
            devhub_messages_enabled, attachments_walrus_blob_ids, clock, ctx
        );
    }

    entry fun apply_to_project(
        project: &mut Project,
        your_role: vector<u8>,
        availability_hrs_per_week: u64,
        start_date: vector<u8>,
        expected_duration_weeks: u64,
        proposal_summary: vector<u8>,
        requested_compensation: u64,
        milestones_count: u64,
        github_repo_link: vector<u8>,
        on_chain_address: address,
        team_members: vector<vector<u8>>,
        cover_letter_walrus_blob_id: Option<vector<u8>>,
        portfolio_walrus_blob_ids: vector<vector<u8>>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        project::apply_to_project(
            project, your_role, availability_hrs_per_week, start_date,
            expected_duration_weeks, proposal_summary, requested_compensation,
            milestones_count, github_repo_link, on_chain_address, team_members,
            cover_letter_walrus_blob_id, portfolio_walrus_blob_ids, clock, ctx
        );
    }

    entry fun create_user_proposals_object(ctx: &mut TxContext) {
        proposal::create_user_proposals_object(ctx);
    }

    // Proposal functions
    entry fun create_proposal(
        user_proposals: &mut UserProposals,
        proposals_by_status: &mut ProposalsByStatus,
        opportunity_title: vector<u8>,
        proposal_title: vector<u8>,
        team_name: vector<u8>,
        contact_email: vector<u8>,
        summary: vector<u8>,
        budget: u64,
        timeline_weeks: u64,
        methodology: vector<u8>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        proposal::create_proposal(
            user_proposals,
            proposals_by_status,
            opportunity_title,
            proposal_title,
            team_name,
            contact_email,
            summary,
            budget,
            timeline_weeks,
            methodology,
            clock,
            ctx
        );
    }

    entry fun add_attachment(
        proposal: &mut Proposal,
        name: vector<u8>,
        file_type: vector<u8>,
        size_kb: u64,
        url: vector<u8>,
        walrus_blob_id: Option<vector<u8>>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        proposal::add_attachment(proposal, name, file_type, size_kb, url, walrus_blob_id, clock, ctx);
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
        profile: &mut Profile,
        rating: u8,
        comment: vector<u8>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        review::leave_review_for_project(project_id, profile, rating, comment, clock, ctx);
    }

    // Connection functions
    entry fun create_connection_store(ctx: &mut TxContext) {
        connections::create_connection_store(ctx);
    }

    entry fun send_connection_request(
        to: address,
        intro_message: vector<u8>,
        shared_context: vector<u8>,
        is_public: bool,
        ctx: &mut TxContext
    ) {
        connections::send_connection_request(to, intro_message, shared_context, is_public, ctx);
    }

    entry fun accept_connection_request(
        store: &mut ConnectionStore,
        req: connections::ConnectionRequest,
        ctx: &mut TxContext
    ) {
        connections::accept_connection_request(store, req, ctx);
    }

    entry fun decline_connection_request(req: connections::ConnectionRequest, ctx: &mut TxContext) {
        connections::decline_connection_request(req, ctx);
    }

    entry fun update_connection_preferences(
        store: &mut ConnectionStore,
        connected_user: address,
        notifications_enabled: bool,
        profile_shared: bool,
        messages_allowed: bool,
        ctx: &mut TxContext
    ) {
        connections::update_connection_preferences(store, connected_user, notifications_enabled, profile_shared, messages_allowed, ctx);
    }

    entry fun update_connection_status(
        store: &mut ConnectionStore,
        connected_user: address,
        new_status: vector<u8>,
        ctx: &mut TxContext
    ) {
        connections::update_connection_status(store, connected_user, new_status, ctx);
    }

    // Messaging functions
    entry fun start_conversation(participant2: address, ctx: &mut TxContext) {
        messaging::start_conversation(participant2, ctx);
    }

    entry fun send_message(
        conversation: &mut Conversation,
        content: vector<u8>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        messaging::send_message(conversation, content, clock, ctx);
    }

    // Profile Walrus blob management functions
    entry fun update_avatar_walrus_blob(
        profile: &mut Profile,
        new_blob_id: Option<vector<u8>>,
        ctx: &mut TxContext
    ) {
        devcard::update_avatar_walrus_blob(profile, new_blob_id, ctx);
    }

    entry fun update_cv_walrus_blob(
        profile: &mut Profile,
        new_blob_id: Option<vector<u8>>,
        ctx: &mut TxContext
    ) {
        devcard::update_cv_walrus_blob(profile, new_blob_id, ctx);
    }

    entry fun update_project_cover_image_walrus_blob(
        project: &mut devcard::Project,
        profile: &Profile,
        new_blob_id: Option<vector<u8>>,
        ctx: &mut TxContext
    ) {
        devcard::update_project_cover_image_walrus_blob(project, profile, new_blob_id, ctx);
    }

    // View functions
    public fun user_has_profile(registry: &ProfileRegistry, user: address): bool {
        devcard::user_has_profile(registry, user)
    }

    public fun get_user_profile_id(registry: &ProfileRegistry, user: address): Option<ID> {
        devcard::get_user_profile_id(registry, user)
    }

}