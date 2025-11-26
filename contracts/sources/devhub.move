module devhub::devhub;

use std::string::{Self, String};

use sui::balance::{Self, Balance};
use sui::coin::{Self, Coin};
use sui::sui::SUI;
use sui::table::{Self, Table};
use sui::url;
use sui::clock::{Self, Clock};

// Import our modules
use devhub::constants;
use devhub::card;
use devhub::project;
use devhub::proposal;
use devhub::admin;

// Re-export types for external use
use devhub::card::{DevCard, SkillLevel, Review};
use devhub::project::{Project, ProjectApplication};
use devhub::proposal::{Proposal, PlatformStatistics, UserProposals, ProposalsByStatus};

// ===== MAIN DEVHUB STRUCT =====

public struct DevHub has key, store {
    id: UID,
    super_admin: address,
    admins: vector<address>,
    card_counter: u64,
    project_counter: u64,
    cards: Table<u64, DevCard>,
    projects: Table<u64, Project>,
    project_applications: Table<u64, vector<ProjectApplication>>,
    platform_fees: Balance<SUI>,
    user_cards: Table<address, u64>, // Maps user address to their card ID
    platform_fee: u64,
    project_posting_fee: u64,
}

// ===== INITIALIZATION =====

fun init(ctx: &mut TxContext) {
    transfer::share_object(DevHub {
        id: object::new(ctx),
        super_admin: tx_context::sender(ctx),
        admins: vector::empty(),
        card_counter: 0,
        project_counter: 0,
        cards: table::new(ctx),
        projects: table::new(ctx),
        project_applications: table::new(ctx),
        platform_fees: balance::zero(),
        user_cards: table::new(ctx),
        platform_fee: constants::PLATFORM_FEE(),
        project_posting_fee: constants::PROJECT_POSTING_FEE(),
    });
}

// ===== CARD FUNCTIONS =====

entry fun create_card(
    name: vector<u8>,
    niche: vector<u8>,
    custom_niche: Option<vector<u8>>,
    image_url: vector<u8>,
    years_of_experience: u8,
    technologies: vector<u8>,
    portfolio: vector<u8>,
    about: vector<u8>,
    featured_projects: vector<String>,
    contact: vector<u8>,
    github: vector<u8>,
    linkedin: vector<u8>,
    twitter: vector<u8>,
    personal_website: vector<u8>,
    work_types: vector<String>,
    hourly_rate: Option<u64>,
    location_preference: vector<u8>,
    availability: vector<u8>,
    languages: vector<String>,
    avatar_walrus_blob_id: Option<vector<u8>>,
    mut payment: Coin<SUI>,
    clock: &Clock,
    devhub: &mut DevHub,
    ctx: &mut TxContext,
) {
    let sender = tx_context::sender(ctx);
    assert!(!table::contains(&devhub.user_cards, sender), constants::USER_ALREADY_HAS_CARD());
    
    let value = coin::value(&payment);
    assert!(value >= devhub.platform_fee, constants::INSUFFICIENT_FUNDS());

    // Validate and process niche
    let final_niche = if (string::utf8(niche) == string::utf8(b"Custom")) {
        assert!(option::is_some(&custom_niche), constants::INVALID_CUSTOM_NICHE());
        let custom_niche_input = *option::borrow(&custom_niche);
        assert!(card::validate_custom_niche(&custom_niche_input), constants::INVALID_CUSTOM_NICHE());
        string::utf8(custom_niche_input)
    } else {
        string::utf8(niche)
    };

    // Collect platform fee
    let platform_fee_coin = coin::split(&mut payment, devhub.platform_fee, ctx);
    balance::join(&mut devhub.platform_fees, coin::into_balance(platform_fee_coin));

    // Return excess payment
    if (coin::value(&payment) > 0) {
        transfer::public_transfer(payment, sender);
    } else {
        coin::destroy_zero(payment);
    };

    devhub.card_counter = devhub.card_counter + 1;
    let current_time = clock::timestamp_ms(clock);

    let social_links = card::new_social_links(
        if (vector::length(&github) > 0) option::some(string::utf8(github)) else option::none(),
        if (vector::length(&linkedin) > 0) option::some(string::utf8(linkedin)) else option::none(),
        if (vector::length(&twitter) > 0) option::some(string::utf8(twitter)) else option::none(),
        if (vector::length(&personal_website) > 0) option::some(string::utf8(personal_website)) else option::none(),
    );

    let work_preferences = card::new_work_preferences(
        work_types,
        hourly_rate,
        string::utf8(location_preference),
        string::utf8(availability),
    );

    card::emit_card_created(
        devhub.card_counter,
        sender,
        string::utf8(name),
        final_niche,
        string::utf8(contact),
        devhub.platform_fee,
        current_time,
    );

    let devcard = card::create_card(
        sender,
        string::utf8(name),
        final_niche,
        url::new_unsafe_from_bytes(image_url),
        option::some(string::utf8(about)),
        years_of_experience,
        string::utf8(technologies),
        string::utf8(portfolio),
        featured_projects,
        string::utf8(contact),
        social_links,
        work_preferences,
        languages,
        avatar_walrus_blob_id,
        current_time,
        ctx,
    );

    table::add(&mut devhub.cards, devhub.card_counter, devcard);
    table::add(&mut devhub.user_cards, sender, devhub.card_counter);
}

entry fun update_card(
    devhub: &mut DevHub,
    card_id: u64,
    name: vector<u8>,
    niche: vector<u8>,
    custom_niche: Option<vector<u8>>,
    about: vector<u8>,
    image_url: vector<u8>,
    technologies: vector<u8>,
    contact: vector<u8>,
    portfolio: vector<u8>,
    featured_projects: vector<String>,
    languages: vector<String>,
    open_to_work: bool,
    years_of_experience: u8,
    work_types: vector<String>,
    hourly_rate: Option<u64>,
    location_preference: vector<u8>,
    availability: vector<u8>,
    github: vector<u8>,
    linkedin: vector<u8>,
    twitter: vector<u8>,
    personal_website: vector<u8>,
    clock: &Clock,
    ctx: &TxContext
) {
    let card = table::borrow_mut(&mut devhub.cards, card_id);
    assert!(card::get_owner(card) == tx_context::sender(ctx), constants::NOT_THE_OWNER());

    let final_niche = if (string::utf8(niche) == string::utf8(b"Custom")) {
        assert!(option::is_some(&custom_niche), constants::INVALID_CUSTOM_NICHE());
        let custom_niche_input = *option::borrow(&custom_niche);
        assert!(card::validate_custom_niche(&custom_niche_input), constants::INVALID_CUSTOM_NICHE());
        string::utf8(custom_niche_input)
    } else {
        string::utf8(niche)
    };

    let current_time = clock::timestamp_ms(clock);
    
    card::update_basic_info(
        card,
        string::utf8(name),
        final_niche,
        string::utf8(about),
        url::new_unsafe_from_bytes(image_url),
        string::utf8(technologies),
        string::utf8(contact),
        string::utf8(portfolio),
        years_of_experience,
        current_time,
    );

    card::update_work_preferences(
        card,
        card::new_work_preferences(
            work_types,
            hourly_rate,
            string::utf8(location_preference),
            string::utf8(availability),
        ),
        current_time,
    );

    card::update_social_links(
        card,
        card::new_social_links(
            if (vector::length(&github) > 0) option::some(string::utf8(github)) else option::none(),
            if (vector::length(&linkedin) > 0) option::some(string::utf8(linkedin)) else option::none(),
            if (vector::length(&twitter) > 0) option::some(string::utf8(twitter)) else option::none(),
            if (vector::length(&personal_website) > 0) option::some(string::utf8(personal_website)) else option::none(),
        ),
        current_time,
    );

    card::update_lists(card, featured_projects, languages, current_time);
    card::set_open_to_work(card, open_to_work);

    card::emit_card_updated(
        card_id,
        card::get_owner(card),
        string::utf8(b"card_updated"),
        current_time,
    );
}

entry fun update_avatar_walrus_blob(
    devhub: &mut DevHub,
    card_id: u64,
    new_blob_id: Option<vector<u8>>,
    clock: &Clock,
    ctx: &TxContext,
) {
    let card = table::borrow_mut(&mut devhub.cards, card_id);
    assert!(card::get_owner(card) == tx_context::sender(ctx), constants::NOT_THE_OWNER());
    
    let current_time = clock::timestamp_ms(clock);
    card::update_avatar_blob(card, new_blob_id, current_time);
    card::emit_avatar_updated(card_id, card::get_owner(card), new_blob_id, current_time);
}

entry fun add_skill(
    devhub: &mut DevHub,
    card_id: u64,
    skill_name: vector<u8>,
    proficiency: u8,
    years_exp: u8,
    clock: &Clock,
    ctx: &TxContext,
) {
    assert!(proficiency >= 1 && proficiency <= 10, constants::INVALID_SKILL_LEVEL());
    let card = table::borrow_mut(&mut devhub.cards, card_id);
    assert!(card::get_owner(card) == tx_context::sender(ctx), constants::NOT_THE_OWNER());

    let skill = card::create_skill_level(
        string::utf8(skill_name),
        proficiency,
        years_exp
    );

    let current_time = clock::timestamp_ms(clock);
    card::add_skill(card, skill, current_time);
    card::emit_card_updated(card_id, card::get_owner(card), string::utf8(b"skills"), current_time);
}

entry fun remove_skill(
    devhub: &mut DevHub,
    card_id: u64,
    skill_index: u64,
    clock: &Clock,
    ctx: &TxContext,
) {
    let card = table::borrow_mut(&mut devhub.cards, card_id);
    assert!(card::get_owner(card) == tx_context::sender(ctx), constants::NOT_THE_OWNER());
    
    let current_time = clock::timestamp_ms(clock);
    card::remove_skill(card, skill_index, current_time);
    card::emit_card_updated(card_id, card::get_owner(card), string::utf8(b"skills_removed"), current_time);
}

entry fun add_review(
    devhub: &mut DevHub,
    card_id: u64,
    rating: u8,
    review_text: Option<String>,
    clock: &Clock,
    ctx: &TxContext,
) {
    let card = table::borrow_mut(&mut devhub.cards, card_id);
    let reviewer = tx_context::sender(ctx);
    let current_time = clock::timestamp_ms(clock);
    
    card::add_review(card, reviewer, rating, review_text, current_time);
    card::emit_review_added(card_id, reviewer, rating, review_text, current_time);
}

entry fun track_profile_view_entry(
    devhub: &mut DevHub,
    card_id: u64,
    clock: &Clock,
    ctx: &TxContext,
) {
    let card = table::borrow_mut(&mut devhub.cards, card_id);
    let viewer = tx_context::sender(ctx);
    let current_time = clock::timestamp_ms(clock);

    card::track_profile_view(card, current_time);
    card::emit_profile_viewed(card_id, option::some(viewer), current_time);
}

entry fun track_contact_click(
    devhub: &mut DevHub,
    card_id: u64,
    ctx: &TxContext,
) {
    let card = table::borrow_mut(&mut devhub.cards, card_id);
    card::track_contact_click(card, tx_context::sender(ctx));
}

entry fun activate_card(devhub: &mut DevHub, id: u64, ctx: &TxContext) {
    let card = table::borrow_mut(&mut devhub.cards, id);
    assert!(card::get_owner(card) == tx_context::sender(ctx), constants::NOT_THE_OWNER());
    card::set_open_to_work(card, true);
}

entry fun deactivate_card(devhub: &mut DevHub, id: u64, ctx: &TxContext) {
    let card = table::borrow_mut(&mut devhub.cards, id);
    assert!(card::get_owner(card) == tx_context::sender(ctx), constants::NOT_THE_OWNER());
    card::set_open_to_work(card, false);
}

entry fun delete_card(devhub: &mut DevHub, id: u64, ctx: &TxContext) {
    let card = table::borrow(&devhub.cards, id);
    let owner = card::get_owner(card);
    assert!(owner == tx_context::sender(ctx), constants::NOT_THE_OWNER());
    assert!(!card::get_open_to_work(card), constants::CANNOT_DELETE_ACTIVE_CARD());

    let removed_card = table::remove(&mut devhub.cards, id);
    let (card_uid, name, niche) = card::destroy_card(removed_card);

    if (table::contains(&devhub.user_cards, owner)) {
        table::remove(&mut devhub.user_cards, owner);
    };

    card::emit_card_deleted(id, owner, name, niche);
    object::delete(card_uid);
}

// ===== PROJECT FUNCTIONS =====

entry fun create_project(
    devhub: &mut DevHub,
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
    visibility: vector<u8>,
    applications_status: vector<u8>,
    devhub_messages_enabled: bool,
    attachments_walrus_blob_ids: vector<vector<u8>>,
    key_deliverables: vector<u8>,
    complexity_level: vector<u8>,
    payment_model: vector<u8>,
    preferred_start_window: vector<u8>,
    nice_to_have_skills: vector<vector<u8>>,
    repo_or_spec_link: vector<u8>,
    application_type: vector<u8>,
    final_notes: vector<u8>,
    mut payment: Coin<SUI>,
    clock: &Clock,
    ctx: &mut TxContext
) {
    let value = coin::value(&payment);
    assert!(value >= devhub.project_posting_fee, constants::INSUFFICIENT_FUNDS());

    // Collect project posting fee
    let project_fee_coin = coin::split(&mut payment, devhub.project_posting_fee, ctx);
    balance::join(&mut devhub.platform_fees, coin::into_balance(project_fee_coin));

    // Return excess payment
    if (coin::value(&payment) > 0) {
        transfer::public_transfer(payment, tx_context::sender(ctx));
    } else {
        coin::destroy_zero(payment);
    };

    let owner = tx_context::sender(ctx);
    
    // Convert skills
    let mut skills_str = vector::empty<String>();
    let mut i = 0;
    while (i < vector::length(&required_skills)) {
        vector::push_back(&mut skills_str, string::utf8(*vector::borrow(&required_skills, i)));
        i = i + 1;
    };

    // Convert blob IDs
    let mut blob_ids_str = vector::empty<String>();
    let mut j = 0;
    while (j < vector::length(&attachments_walrus_blob_ids)) {
        vector::push_back(&mut blob_ids_str, string::utf8(*vector::borrow(&attachments_walrus_blob_ids, j)));
        j = j + 1;
    };

    // Convert nice-to-have skills
    let mut nice_to_have_str = vector::empty<String>();
    let mut k = 0;
    while (k < vector::length(&nice_to_have_skills)) {
        vector::push_back(&mut nice_to_have_str, string::utf8(*vector::borrow(&nice_to_have_skills, k)));
        k = k + 1;
    };

    devhub.project_counter = devhub.project_counter + 1;
    let current_time = clock::timestamp_ms(clock);

    let proj = project::create_project(
        owner,
        string::utf8(title),
        string::utf8(short_summary),
        string::utf8(description),
        string::utf8(category),
        string::utf8(experience_level),
        budget_min,
        budget_max,
        timeline_weeks,
        skills_str,
        attachments_count,
        string::utf8(visibility),
        string::utf8(applications_status),
        devhub_messages_enabled,
        blob_ids_str,
        string::utf8(key_deliverables),
        string::utf8(complexity_level),
        string::utf8(payment_model),
        string::utf8(preferred_start_window),
        nice_to_have_str,
        string::utf8(repo_or_spec_link),
        string::utf8(application_type),
        string::utf8(final_notes),
        current_time,
        ctx,
    );

    project::emit_project_created(object::id(&proj), owner, project::get_title(&proj));
    
    table::add(&mut devhub.projects, devhub.project_counter, proj);
    table::add(&mut devhub.project_applications, devhub.project_counter, vector::empty<ProjectApplication>());
}

entry fun update_project(
    devhub: &mut DevHub,
    project_id: u64,
    title: vector<u8>,
    short_summary: vector<u8>,
    description: vector<u8>,
    category: vector<u8>,
    experience_level: vector<u8>,
    budget_min: u64,
    budget_max: u64,
    timeline_weeks: u64,
    required_skills: vector<vector<u8>>,
    applications_status: vector<u8>,
    _clock: &Clock,
    ctx: &TxContext,
) {
    let proj = table::borrow_mut(&mut devhub.projects, project_id);
    assert!(project::get_owner(proj) == tx_context::sender(ctx), constants::NOT_THE_OWNER());
    
    let mut skills_str = vector::empty<String>();
    let mut i = 0;
    while (i < vector::length(&required_skills)) {
        vector::push_back(&mut skills_str, string::utf8(*vector::borrow(&required_skills, i)));
        i = i + 1;
    };
    
    project::update_project_info(
        proj,
        string::utf8(title),
        string::utf8(short_summary),
        string::utf8(description),
        string::utf8(category),
        string::utf8(experience_level),
        budget_min,
        budget_max,
        timeline_weeks,
        skills_str,
        string::utf8(applications_status),
    );
}

entry fun open_applications(devhub: &mut DevHub, project_id: u64, ctx: &TxContext) {
    let proj = table::borrow_mut(&mut devhub.projects, project_id);
    assert!(tx_context::sender(ctx) == project::get_owner(proj), constants::NOT_THE_OWNER());
    assert!(project::get_applications_status(proj) != string::utf8(b"Open"), constants::E_APPLICATIONS_ALREADY_OPEN());
    project::set_applications_status(proj, string::utf8(b"Open"));
}

entry fun close_applications(devhub: &mut DevHub, project_id: u64, ctx: &TxContext) {
    let proj = table::borrow_mut(&mut devhub.projects, project_id);
    assert!(tx_context::sender(ctx) == project::get_owner(proj), constants::NOT_THE_OWNER());
    assert!(project::get_applications_status(proj) != string::utf8(b"Closed"), constants::E_APPLICATIONS_ALREADY_CLOSED());
    project::set_applications_status(proj, string::utf8(b"Closed"));
}

entry fun add_attachment(
    proj: &mut Project,
    blob_id: vector<u8>,
    ctx: &TxContext
) {
    assert!(tx_context::sender(ctx) == project::get_owner(proj), constants::NOT_THE_OWNER());
    project::add_attachment(proj, string::utf8(blob_id));
}

entry fun remove_attachment(
    proj: &mut Project,
    blob_id: vector<u8>,
    ctx: &TxContext
) {
    assert!(tx_context::sender(ctx) == project::get_owner(proj), constants::NOT_THE_OWNER());
    project::remove_attachment(proj, string::utf8(blob_id));
}

entry fun apply_to_project(
    devhub: &mut DevHub,
    user_proposals: &mut UserProposals,
    proposals_by_status: &mut ProposalsByStatus,
    project_id: u64,
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
    let proj = table::borrow(&devhub.projects, project_id);
    assert!(project::get_applications_status(proj) == string::utf8(b"Open"), constants::E_APPLICATIONS_NOT_OPEN());
    
    let applicant = tx_context::sender(ctx);
    let current_time = clock::timestamp_ms(clock);

    // Convert team members
    let mut team_members_str = vector::empty<String>();
    let mut i = 0;
    while (i < vector::length(&team_members)) {
        vector::push_back(&mut team_members_str, string::utf8(*vector::borrow(&team_members, i)));
        i = i + 1;
    };

    // Convert cover letter blob ID
    let cover_letter_blob_id = if (option::is_some(&cover_letter_walrus_blob_id)) {
        option::some(string::utf8(*option::borrow(&cover_letter_walrus_blob_id)))
    } else {
        option::none()
    };

    // Convert portfolio blob IDs
    let mut portfolio_blob_ids_str = vector::empty<String>();
    let mut j = 0;
    while (j < vector::length(&portfolio_walrus_blob_ids)) {
        vector::push_back(&mut portfolio_blob_ids_str, string::utf8(*vector::borrow(&portfolio_walrus_blob_ids, j)));
        j = j + 1;
    };

    // Create proposal
    let prop = proposal::create_proposal(
        applicant,
        string::utf8(opportunity_title),
        string::utf8(proposal_title),
        string::utf8(team_name),
        string::utf8(contact_email),
        string::utf8(summary),
        budget,
        timeline_weeks,
        string::utf8(methodology),
        current_time,
        ctx,
    );

    let proposal_id = object::id(&prop);
    proposal::add_user_proposal(user_proposals, proposal_id);
    proposal::add_to_draft(proposals_by_status, proposal_id);
    proposal::emit_proposal_created(proposal_id, applicant);
    
    // Transfer proposal (must be done in proposal module)
    proposal::transfer_proposal(prop, applicant);

    // Create application
    let application = project::create_application(
        object::id(proj),
        applicant,
        string::utf8(your_role),
        availability_hrs_per_week,
        string::utf8(start_date),
        expected_duration_weeks,
        string::utf8(proposal_summary),
        requested_compensation,
        milestones_count,
        string::utf8(github_repo_link),
        on_chain_address,
        team_members_str,
        cover_letter_blob_id,
        portfolio_blob_ids_str,
        option::some(proposal_id),
        current_time,
        ctx,
    );

    let application_id = object::id(&application);
    let applications = table::borrow_mut(&mut devhub.project_applications, project_id);
    vector::push_back(applications, application);

    project::emit_application_submitted(application_id, object::id(proj), applicant);
}

// ===== PROPOSAL FUNCTIONS =====

entry fun create_platform_statistics(ctx: &mut TxContext) {
    proposal::create_and_share_platform_statistics(ctx);
}

entry fun create_proposals_by_status(ctx: &mut TxContext) {
    proposal::create_and_share_proposals_by_status(ctx);
}

entry fun create_user_proposals_object(ctx: &mut TxContext) {
    proposal::create_and_transfer_user_proposals(ctx);
}

entry fun create_proposal(
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
    let sender = tx_context::sender(ctx);
    let current_time = clock::timestamp_ms(clock);
    
    let prop = proposal::create_proposal(
        sender,
        string::utf8(opportunity_title),
        string::utf8(proposal_title),
        string::utf8(team_name),
        string::utf8(contact_email),
        string::utf8(summary),
        budget,
        timeline_weeks,
        string::utf8(methodology),
        current_time,
        ctx,
    );
    
    proposal::transfer_proposal(prop, sender);
}

entry fun edit_proposal(
    prop: &mut Proposal,
    opportunity_title: vector<u8>,
    proposal_title: vector<u8>,
    team_name: vector<u8>,
    contact_email: vector<u8>,
    summary: vector<u8>,
    budget: u64,
    timeline_weeks: u64,
    methodology: vector<u8>,
    clock: &Clock,
    ctx: &TxContext
) {
    assert!(tx_context::sender(ctx) == proposal::get_owner(prop), constants::NOT_THE_OWNER());
    assert!(proposal::get_status(prop) == string::utf8(b"Draft"), constants::E_INVALID_PROPOSAL_STATUS());

    let current_time = clock::timestamp_ms(clock);
    proposal::update_proposal_info(
        prop,
        string::utf8(opportunity_title),
        string::utf8(proposal_title),
        string::utf8(team_name),
        string::utf8(contact_email),
        string::utf8(summary),
        budget,
        timeline_weeks,
        string::utf8(methodology),
        current_time,
    );
}

entry fun add_deliverable(
    prop: &mut Proposal,
    description: vector<u8>,
    due_date: u64,
    budget_allocation: u64,
    clock: &Clock,
    ctx: &TxContext
) {
    assert!(tx_context::sender(ctx) == proposal::get_owner(prop), constants::NOT_THE_OWNER());
    assert!(proposal::get_status(prop) == string::utf8(b"Draft"), constants::E_INVALID_PROPOSAL_STATUS());

    let deliverable = proposal::create_deliverable(
        string::utf8(description),
        due_date,
        budget_allocation
    );
    
    proposal::add_deliverable(prop, deliverable, clock::timestamp_ms(clock));
}

entry fun add_milestone_to_proposal(
    prop: &mut Proposal,
    description: vector<u8>,
    due_date: u64,
    budget: u64,
    clock: &Clock,
    ctx: &TxContext
) {
    assert!(tx_context::sender(ctx) == proposal::get_owner(prop), constants::NOT_THE_OWNER());
    assert!(proposal::get_status(prop) == string::utf8(b"Draft"), constants::E_INVALID_PROPOSAL_STATUS());

    let milestone = proposal::create_milestone(
        string::utf8(description),
        due_date,
        budget
    );
    
    proposal::add_milestone(prop, milestone, clock::timestamp_ms(clock));
}

entry fun add_team_member(
    prop: &mut Proposal,
    name: vector<u8>,
    sui_address: address,
    clock: &Clock,
    ctx: &TxContext
) {
    assert!(tx_context::sender(ctx) == proposal::get_owner(prop), constants::NOT_THE_OWNER());
    assert!(proposal::get_status(prop) == string::utf8(b"Draft"), constants::E_INVALID_PROPOSAL_STATUS());

    let team_member = proposal::create_team_member(
        string::utf8(name),
        sui_address
    );
    
    proposal::add_team_member(prop, team_member, clock::timestamp_ms(clock));
}

entry fun add_link(
    prop: &mut Proposal,
    url: vector<u8>,
    clock: &Clock,
    ctx: &TxContext
) {
    assert!(tx_context::sender(ctx) == proposal::get_owner(prop), constants::NOT_THE_OWNER());
    assert!(proposal::get_status(prop) == string::utf8(b"Draft"), constants::E_INVALID_PROPOSAL_STATUS());

    let link = proposal::create_link(string::utf8(url));
    
    proposal::add_link(prop, link, clock::timestamp_ms(clock));
}

entry fun add_discussion_comment(
    prop: &mut Proposal,
    text: vector<u8>,
    clock: &Clock,
    ctx: &TxContext
) {
    assert!(tx_context::sender(ctx) == proposal::get_owner(prop), constants::NOT_THE_OWNER());

    let comment = proposal::create_comment(
        tx_context::sender(ctx),
        clock::timestamp_ms(clock),
        string::utf8(text)
    );
    
    proposal::add_comment(prop, comment, clock::timestamp_ms(clock));
}

entry fun add_attachment_to_proposal(
    prop: &mut Proposal,
    name: vector<u8>,
    file_type: vector<u8>,
    size_kb: u64,
    url: vector<u8>,
    walrus_blob_id: Option<vector<u8>>,
    clock: &Clock,
    ctx: &TxContext
) {
    assert!(tx_context::sender(ctx) == proposal::get_owner(prop), constants::NOT_THE_OWNER());

    let blob_id = if (option::is_some(&walrus_blob_id)) {
        option::some(string::utf8(*option::borrow(&walrus_blob_id)))
    } else {
        option::none()
    };

    let file = proposal::create_file(
        string::utf8(name),
        string::utf8(file_type),
        size_kb,
        string::utf8(url),
        blob_id
    );
    
    proposal::add_file(prop, file, clock::timestamp_ms(clock));
}

entry fun submit_proposal(
    prop: &mut Proposal,
    stats: &mut PlatformStatistics,
    proposals_by_status: &mut ProposalsByStatus,
    clock: &Clock,
    ctx: &TxContext
) {
    assert!(tx_context::sender(ctx) == proposal::get_owner(prop), constants::NOT_THE_OWNER());
    assert!(proposal::get_status(prop) == string::utf8(b"Draft"), constants::E_INVALID_PROPOSAL_STATUS());

    let proposal_id = object::id(prop);
    let current_time = clock::timestamp_ms(clock);
    
    proposal::remove_from_draft(proposals_by_status, proposal_id);
    proposal::add_to_in_review(proposals_by_status, proposal_id);
    proposal::set_status(prop, string::utf8(b"InReview"), current_time);
    
    proposal::increment_total_submitted(stats);
    proposal::increment_active_in_review(stats);
    
    proposal::emit_proposal_status_update(proposal_id, string::utf8(b"InReview"));
}

entry fun update_proposal_status(
    devhub: &DevHub,
    prop: &mut Proposal,
    stats: &mut PlatformStatistics,
    proposals_by_status: &mut ProposalsByStatus,
    new_status: vector<u8>,
    clock: &Clock,
    ctx: &TxContext
) {
    let sender = tx_context::sender(ctx);
    assert!(
        admin::is_admin_or_super_admin(devhub.super_admin, &devhub.admins, sender),
        constants::NOT_ADMIN()
    );
    
    let new_status_str = string::utf8(new_status);
    assert!(
        new_status_str == string::utf8(b"Accepted") ||
        new_status_str == string::utf8(b"Rejected"),
        constants::E_INVALID_PROPOSAL_STATUS()
    );

    let old_status = proposal::get_status(prop);
    let proposal_id = object::id(prop);

    if (old_status == string::utf8(b"InReview")) {
        proposal::decrement_active_in_review(stats);
        proposal::remove_from_in_review(proposals_by_status, proposal_id);
    };

    if (new_status_str == string::utf8(b"Accepted")) {
        proposal::increment_accepted_count(stats);
        proposal::add_to_accepted(proposals_by_status, proposal_id);
    } else if (new_status_str == string::utf8(b"Rejected")) {
        proposal::increment_rejected_count(stats);
        proposal::add_to_rejected(proposals_by_status, proposal_id);
    };

    let current_time = clock::timestamp_ms(clock);
    proposal::set_status(prop, new_status_str, current_time);
    proposal::emit_proposal_status_update(proposal_id, new_status_str);
}

// ===== ADMIN FUNCTIONS =====

entry fun grant_admin_role(devhub: &mut DevHub, new_admin: address, ctx: &TxContext) {
    assert!(admin::is_super_admin(devhub.super_admin, tx_context::sender(ctx)), constants::NOT_SUPER_ADMIN());
    admin::add_admin(&mut devhub.admins, new_admin);
    admin::emit_admin_role_granted(new_admin);
}

entry fun revoke_admin_role(devhub: &mut DevHub, admin_to_revoke: address, ctx: &TxContext) {
    assert!(admin::is_super_admin(devhub.super_admin, tx_context::sender(ctx)), constants::NOT_SUPER_ADMIN());
    admin::remove_admin(&mut devhub.admins, admin_to_revoke);
    admin::emit_admin_role_revoked(admin_to_revoke);
}

entry fun withdraw_platform_fees(
    devhub: &mut DevHub,
    recipient: address,
    amount: u64,
    ctx: &mut TxContext,
) {
    assert!(admin::is_super_admin(devhub.super_admin, tx_context::sender(ctx)), constants::NOT_SUPER_ADMIN());

    let current_balance = balance::value(&devhub.platform_fees);
    assert!(amount <= current_balance, constants::INSUFFICIENT_FUNDS());

    let withdrawal_balance = balance::split(&mut devhub.platform_fees, amount);
        let withdrawal_coin = coin::from_balance(withdrawal_balance, ctx);

    transfer::public_transfer(withdrawal_coin, recipient);
    admin::emit_platform_fees_withdrawn(tx_context::sender(ctx), amount, recipient);
}

entry fun change_platform_fee(devhub: &mut DevHub, new_fee: u64, ctx: &TxContext) {
    assert!(admin::is_super_admin(devhub.super_admin, tx_context::sender(ctx)), constants::NOT_SUPER_ADMIN());
    devhub.platform_fee = new_fee;
}

entry fun change_project_posting_fee(devhub: &mut DevHub, new_fee: u64, ctx: &TxContext) {
    assert!(admin::is_super_admin(devhub.super_admin, tx_context::sender(ctx)), constants::NOT_SUPER_ADMIN());
    devhub.project_posting_fee = new_fee;
}

entry fun verify_professional(devhub: &mut DevHub, card_id: u64, ctx: &TxContext) {
    let sender = tx_context::sender(ctx);
    assert!(admin::is_admin_or_super_admin(devhub.super_admin, &devhub.admins, sender), constants::NOT_ADMIN());
    let card = table::borrow_mut(&mut devhub.cards, card_id);
    card::set_verified(card, true);
}

entry fun unverify_professional(devhub: &mut DevHub, card_id: u64, ctx: &TxContext) {
    let sender = tx_context::sender(ctx);
    assert!(admin::is_admin_or_super_admin(devhub.super_admin, &devhub.admins, sender), constants::NOT_ADMIN());
    let card = table::borrow_mut(&mut devhub.cards, card_id);
    card::set_verified(card, false);
}

// ===== VIEW FUNCTIONS =====

public fun get_user_card_id(devhub: &DevHub, user_address: address): Option<u64> {
    if (table::contains(&devhub.user_cards, user_address)) {
        option::some(*table::borrow(&devhub.user_cards, user_address))
    } else {
        option::none()
    }
}

public fun user_has_card(devhub: &DevHub, user_address: address): bool {
    table::contains(&devhub.user_cards, user_address)
}

public fun get_card_info(devhub: &DevHub, id: u64): (String, address, String, sui::url::Url, Option<String>, u8, String, String, String, bool, vector<String>, u64, Option<vector<u8>>, u64, u64) {
    let card = table::borrow(&devhub.cards, id);
    card::get_info(card)
}

public fun get_card_skills(devhub: &DevHub, id: u64): vector<SkillLevel> {
    let card = table::borrow(&devhub.cards, id);
    *card::get_skills(card)
}

public fun get_card_reviews(devhub: &DevHub, id: u64): vector<Review> {
    let card = table::borrow(&devhub.cards, id);
    *card::get_reviews(card)
}

public fun get_work_preferences(devhub: &DevHub, card_id: u64): card::WorkPreferences {
    let card = table::borrow(&devhub.cards, card_id);
    card::get_work_preferences(card)
}

public fun get_social_links(devhub: &DevHub, card_id: u64): card::SocialLinks {
    let card = table::borrow(&devhub.cards, card_id);
    card::get_social_links(card)
}

public fun get_languages(devhub: &DevHub, card_id: u64): vector<String> {
    let card = table::borrow(&devhub.cards, card_id);
    *card::get_languages(card)
}

public fun get_detailed_analytics(devhub: &DevHub, card_id: u64): (u64, u64, u64, u64, u64, u64) {
    let card = table::borrow(&devhub.cards, card_id);
    card::get_analytics(card)
}

public fun get_project_info(devhub: &DevHub, project_id: u64): &Project {
    table::borrow(&devhub.projects, project_id)
}

public fun get_project_applications(devhub: &DevHub, project_id: u64): &vector<ProjectApplication> {
    table::borrow(&devhub.project_applications, project_id)
}

public fun get_application_details(application: &ProjectApplication): &ProjectApplication {
    project::get_application_details(application)
}

public fun get_application_portfolio_blobs(application: &ProjectApplication): &vector<String> {
    project::get_application_portfolio_blobs(application)
}

public fun get_application_cover_letter_blob(application: &ProjectApplication): &Option<String> {
    project::get_application_cover_letter_blob(application)
}

public fun get_card_count(devhub: &DevHub): u64 { devhub.card_counter }
public fun get_project_count(devhub: &DevHub): u64 { devhub.project_counter }
public fun get_super_admin(devhub: &DevHub): address { devhub.super_admin }
public fun get_admins(devhub: &DevHub): vector<address> { devhub.admins }
public fun get_platform_fee_balance(devhub: &DevHub): u64 { balance::value(&devhub.platform_fees) }
public fun get_platform_fee(devhub: &DevHub): u64 { devhub.platform_fee }
public fun get_project_posting_fee(devhub: &DevHub): u64 { devhub.project_posting_fee }

public fun get_proposal_details(proposal: &Proposal): &Proposal {
    proposal::get_proposal_details(proposal)
}

public fun get_user_proposals(user_proposals: &UserProposals): &vector<ID> {
    proposal::get_user_proposals(user_proposals)
}

public fun get_proposals_by_status(proposals_by_status: &ProposalsByStatus, status: vector<u8>): &vector<ID> {
    proposal::get_proposals_by_status(proposals_by_status, status)
}

public fun get_platform_statistics(stats: &PlatformStatistics): (u64, u64, u64, u64, u64) {
    proposal::get_platform_statistics(stats)
}

// ===== SEARCH FUNCTIONS =====

public fun search_cards_by_niche(devhub: &DevHub, niche: String): vector<u64> {
    let mut results = vector::empty<u64>();
    let mut card_id = 1;
    
    while (card_id <= devhub.card_counter) {
        if (table::contains(&devhub.cards, card_id)) {
            let card = table::borrow(&devhub.cards, card_id);
            if (card::get_open_to_work(card) && card::get_niche(card) == niche) {
                vector::push_back(&mut results, card_id);
            };
        };
        card_id = card_id + 1;
    };
    results
}

public fun get_available_developers(devhub: &DevHub): vector<u64> {
    let mut results = vector::empty<u64>();
    let mut card_id = 1;
    
    while (card_id <= devhub.card_counter) {
        if (table::contains(&devhub.cards, card_id)) {
            let card = table::borrow(&devhub.cards, card_id);
            if (card::get_open_to_work(card)) {
                vector::push_back(&mut results, card_id);
            };
        };
        card_id = card_id + 1;
    };
    results
}

public fun get_open_projects(devhub: &DevHub): vector<u64> {
    let mut results = vector::empty<u64>();
    let mut project_id = 1;
    
    while (project_id <= devhub.project_counter) {
        if (table::contains(&devhub.projects, project_id)) {
            let proj = table::borrow(&devhub.projects, project_id);
            if (project::get_applications_status(proj) == string::utf8(b"Open")) {
                vector::push_back(&mut results, project_id);
            };
        };
        project_id = project_id + 1;
    };
    results
}

public fun get_platform_stats(devhub: &DevHub): (u64, u64, u64, u64) {
    let mut active_professionals = 0;
    let mut verified_professionals = 0;
    let mut open_projects = 0;
    
    let mut card_id = 1;
    while (card_id <= devhub.card_counter) {
        if (table::contains(&devhub.cards, card_id)) {
            let card = table::borrow(&devhub.cards, card_id);
            if (card::get_open_to_work(card)) {
                active_professionals = active_professionals + 1;
            };
            if (card::get_verified(card)) {
                verified_professionals = verified_professionals + 1;
            };
        };
        card_id = card_id + 1;
    };
    
    let mut project_id = 1;
    while (project_id <= devhub.project_counter) {
        if (table::contains(&devhub.projects, project_id)) {
            let proj = table::borrow(&devhub.projects, project_id);
            if (project::get_applications_status(proj) == string::utf8(b"Open")) {
                open_projects = open_projects + 1;
            };
        };
        project_id = project_id + 1;
    };
    
    (devhub.card_counter, active_professionals, verified_professionals, open_projects)
}

public fun get_available_niches(): vector<String> {
    let mut niches = vector::empty<String>();
    vector::push_back(&mut niches, string::utf8(b"Developer"));
    vector::push_back(&mut niches, string::utf8(b"UI/UX Designer"));
    vector::push_back(&mut niches, string::utf8(b"Content Creator"));
    vector::push_back(&mut niches, string::utf8(b"DevOps"));
    vector::push_back(&mut niches, string::utf8(b"Project Manager"));
    vector::push_back(&mut niches, string::utf8(b"Community Manager"));
    vector::push_back(&mut niches, string::utf8(b"Development Director"));
    vector::push_back(&mut niches, string::utf8(b"Product Manager"));
    vector::push_back(&mut niches, string::utf8(b"Marketing Specialist"));
    vector::push_back(&mut niches, string::utf8(b"Business Analyst"));
    vector::push_back(&mut niches, string::utf8(b"Custom"));
    niches
}
