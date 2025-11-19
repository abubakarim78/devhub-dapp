module devhub::devhub;


use std::string::{Self, String};
use sui::balance::{Self, Balance};
use sui::coin::{Self, Coin};
use sui::event;
use sui::sui::SUI;
use sui::table::{Self, Table};
use sui::url::{Self, Url};
use sui::clock::{Self, Clock};

// Error codes
const NOT_THE_OWNER: u64 = 0;
const INSUFFICIENT_FUNDS: u64 = 1;
const NOT_ADMIN: u64 = 2;
const E_NOT_OWNER: u64 = 3;
const INVALID_SKILL_LEVEL: u64 = 3;
const CANNOT_DELETE_ACTIVE_CARD: u64 = 7;
const E_NOT_CONNECTED: u64 = 12;
const E_INVALID_STATUS: u64 = 13;
const INVALID_RATING: u64 = 14;
const SELF_REVIEW_NOT_ALLOWED: u64 = 15;
const ALREADY_REVIEWED: u64 = 16;
const E_APPLICATIONS_NOT_OPEN: u64 = 17;
const E_APPLICATIONS_ALREADY_OPEN: u64 = 18;
const E_APPLICATIONS_ALREADY_CLOSED: u64 = 19;
const E_INVALID_PROPOSAL_STATUS: u64 = 20;
const NOT_SUPER_ADMIN: u64 = 21;
const INVALID_CUSTOM_NICHE: u64 = 22;
const USER_ALREADY_HAS_CARD: u64 = 23;



// Connection Status
const PENDING: vector<u8> = b"Pending";
const CONNECTED: vector<u8> = b"Connected";
const DECLINED: vector<u8> = b"Declined";
const UNFOLLOWED: vector<u8> = b"Unfollowed";
const MUTED: vector<u8> = b"Muted";

// Application Status
const OPEN: vector<u8> = b"Open";
const CLOSED: vector<u8> = b"Closed";

// Milestone Status
const MILESTONE_PENDING: vector<u8> = b"Pending";

// Proposal Status
const DRAFT: vector<u8> = b"Draft";
const IN_REVIEW: vector<u8> = b"InReview";
const ACCEPTED: vector<u8> = b"Accepted";
const REJECTED: vector<u8> = b"Rejected";


// Fee constants
const PLATFORM_FEE: u64 = 100_000_000; // 0.1 SUI for card creation
const PROJECT_POSTING_FEE: u64 = 200_000_000; // 0.2 SUI for project posting

// Professional Niches
const DEVELOPER: vector<u8> = b"Developer";
const UI_UX_DESIGNER: vector<u8> = b"UI/UX Designer";
const CONTENT_CREATOR: vector<u8> = b"Content Creator";
const DEVOPS: vector<u8> = b"DevOps";
const PROJECT_MANAGER: vector<u8> = b"Project Manager";
const COMMUNITY_MANAGER: vector<u8> = b"Community Manager";
const DEVELOPMENT_DIRECTOR: vector<u8> = b"Development Director";
const PRODUCT_MANAGER: vector<u8> = b"Product Manager";
const MARKETING_SPECIALIST: vector<u8> = b"Marketing Specialist";
const BUSINESS_ANALYST: vector<u8> = b"Business Analyst";
const CUSTOM_NICHE: vector<u8> = b"Custom";

// Enhanced data structures
public struct SkillLevel has store, copy, drop {
    skill: String,
    proficiency: u8, // 1-10 scale
    years_experience: u8,
}

public struct SocialLinks has store, copy, drop {
    github: Option<String>,
    linkedin: Option<String>,
    twitter: Option<String>,
    personal_website: Option<String>,
}

public struct WorkPreferences has store, copy, drop {
    work_types: vector<String>, // ["Full-time", "Contract", "Freelance"]
    hourly_rate: Option<u64>,
    location_preference: String, // "Remote", "On-site", "Hybrid"
    availability: String, // "Immediately", "2 weeks", "1 month"
}

public struct ProfileAnalytics has store, drop {
    total_views: u64,
    profile_views: u64,
    contact_clicks: u64,
    project_applications: u64,
    total_reviews: u64,
    average_rating: u64, // Stored as value * 100 (e.g., 4.5 stars is 450)
    last_view_reset: u64, // For monthly reset
}

public struct Review has store, copy, drop {
    reviewer: address,
    rating: u8, // 1-5
    review_text: Option<String>,
    timestamp: u64,
}

// Enhanced DevCard with Walrus blob support
public struct DevCard has key, store {
    id: UID,
    owner: address,

    // Basic Info
    name: String,
    niche: String, // Professional niche/category
    about: Option<String>,
    image_url: Url,

    // Walrus blob support for media
    avatar_walrus_blob_id: Option<vector<u8>>,

    // Skills & Experience
    skills: vector<SkillLevel>,
    years_of_experience: u8,
    technologies: String,

    // Work Preferences
    work_preferences: WorkPreferences,

    // Contact & Social
    contact: String,
    social_links: SocialLinks,
    portfolio: String,

    // Projects & Achievements
    featured_projects: vector<String>,
    languages: vector<String>,

    // Platform Features
    open_to_work: bool,
    verified: bool,
    reviews: vector<Review>,
    created_at: u64,
    last_updated: u64,

    // Analytics
    analytics: ProfileAnalytics,
}

public struct Project has key, store {
    id: UID,
    title: String,
    short_summary: String,
    description: String,
    category: String,
    experience_level: String,
    budget_min: u64,
    budget_max: u64,
    timeline_weeks: u64,
    required_skills: vector<String>,
    attachments_count: u64,
    owner: address,
    visibility: String,
    applications_status: String,
    devhub_messages_enabled: bool,
    creation_timestamp: u64,
    attachments_walrus_blob_ids: vector<String>,
}

public struct ProjectApplication has key, store {
    id: UID,
    project_id: ID,
    applicant_address: address,
    your_role: String,
    availability_hrs_per_week: u64,
    start_date: String,
    expected_duration_weeks: u64,
    proposal_summary: String,
    requested_compensation: u64,
    milestones_count: u64,
    github_repo_link: String,
    on_chain_address: address,
    team_members: vector<String>,
    application_status: String,
    submission_timestamp: u64,
    cover_letter_walrus_blob_id: Option<String>,
    portfolio_walrus_blob_ids: vector<String>,
    proposal_id: Option<ID>,
}

public struct Milestone has store, copy, drop {
    description: String,
    due_date: u64, // timestamp
    budget: u64,
}

public struct Deliverable has store, copy, drop {
    description: String,
    due_date: u64, // timestamp
    budget_allocation: u64,
}

public struct TeamMember has store, copy, drop {
    name: String,
    sui_address: address,
}

public struct Link has store, copy, drop {
    url: String,
}

public struct Comment has store {
    author_address: address,
    timestamp: u64,
    text: String,
}

public struct File has store, copy, drop {
    name: String,
    file_type: String,
    size_kb: u64,
    // metadata for off-chain storage
    url: String,
    walrus_blob_id: Option<String>,
}

public struct Proposal has key, store {
    id: UID,
    opportunity_title: String,
    proposal_title: String,
    team_name: String,
    contact_email: String,
    summary: String,
    budget: u64,
    timeline_weeks: u64,
    status: String,
    created_at: u64,
    last_updated: u64,
    owner_address: address,
    key_deliverables: vector<Deliverable>,
    methodology: String,
    milestones: vector<Milestone>,
    team_members: vector<TeamMember>,
    links: vector<Link>,
    comments: vector<Comment>,
    files: vector<File>,
}

public struct PlatformStatistics has key {
    id: UID,
    total_submitted: u64,
    active_in_review: u64,
    accepted_count: u64,
    rejected_count: u64,
    declined_count: u64,
}

public struct UserProposals has key {
    id: UID,
    owner: address,
    proposals: vector<ID>,
}

public struct ProposalsByStatus has key {
    id: UID,
    draft: vector<ID>,
    in_review: vector<ID>,
    accepted: vector<ID>,
    rejected: vector<ID>,
    declined: vector<ID>,
}


// Messaging moved to `devhub::messaging`

// Channel types moved to `devhub::channels`

// Connection types moved to `devhub::connections`


// Enhanced DevHub with new features
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
    platform_fee: u64, // Mutable platform fee for card creation
    project_posting_fee: u64, // Mutable project posting fee
}

// Events
public struct CardCreated has copy, drop {
    card_id: u64,
    owner: address,
    name: String,
    niche: String,
    contact: String,
    platform_fee_paid: u64,
    timestamp: u64,
}

public struct CardUpdated has copy, drop {
    card_id: u64,
    owner: address,
    field_updated: String,
    timestamp: u64,
}

public struct ProfileViewed has copy, drop {
    card_id: u64,
    viewer: Option<address>,
    timestamp: u64,
}

public struct ReviewAdded has copy, drop {
    card_id: u64,
    reviewer: address,
    rating: u8,
    review_text: Option<String>,
    timestamp: u64,
}

public struct ProjectCreated has copy, drop {
    project_id: ID,
    owner: address,
    title: String,
}

public struct ApplicationSubmitted has copy, drop {
    application_id: ID,
    project_id: ID,
    applicant: address,
}

public struct ProposalCreated has copy, drop {
    proposal_id: ID,
    owner_address: address,
}

public struct ProposalStatusUpdate has copy, drop {
    proposal_id: ID,
    new_status: String,
}

public struct CardDeleted has copy, drop {
    card_id: u64,
    owner: address,
    name: String,
    niche: String,
}

public struct PlatformFeesWithdrawn has copy, drop {
    admin: address,
    amount: u64,
    recipient: address,
}

public struct AdminRoleGranted has copy, drop {
    admin: address,
}

public struct AdminRoleRevoked has copy, drop {
    admin: address,
}

public struct AvatarUpdated has copy, drop {
    card_id: u64,
    owner: address,
    blob_id: Option<vector<u8>>,
    timestamp: u64,
}

// Messaging events moved to `devhub::messaging`

// Channel events moved to `devhub::channels`

// Connection events moved to `devhub::connections`


// Initialization
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
        platform_fee: PLATFORM_FEE, // Initialize with default fee
        project_posting_fee: PROJECT_POSTING_FEE, // Initialize with default fee
    });
}

// Enhanced card creation with Walrus blob support
public entry fun create_card(
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
    
    // Check if user already has a card
    assert!(!table::contains(&devhub.user_cards, sender), USER_ALREADY_HAS_CARD);
    
    let value = coin::value(&payment);
    assert!(value >= devhub.platform_fee, INSUFFICIENT_FUNDS);

    // Validate and process niche
    let final_niche = if (string::utf8(niche) == string::utf8(CUSTOM_NICHE)) {
        // If custom niche is selected, validate the custom input
        assert!(option::is_some(&custom_niche), INVALID_CUSTOM_NICHE);
        let custom_niche_input = *option::borrow(&custom_niche);
        assert!(validate_custom_niche(&custom_niche_input), INVALID_CUSTOM_NICHE);
        string::utf8(custom_niche_input)
    } else {
        // Use predefined niche
        string::utf8(niche)
    };

    // Collect platform fee
    let platform_fee_coin = coin::split(&mut payment, devhub.platform_fee, ctx);
    let platform_fee_balance = coin::into_balance(platform_fee_coin);
    balance::join(&mut devhub.platform_fees, platform_fee_balance);

    // Return excess payment
    if (coin::value(&payment) > 0) {
        transfer::public_transfer(payment, tx_context::sender(ctx));
    } else {
        coin::destroy_zero(payment);
    };

    devhub.card_counter = devhub.card_counter + 1;
    let current_time = clock::timestamp_ms(clock);

    let social_links = SocialLinks {
        github: if (vector::length(&github) > 0) option::some(string::utf8(github)) else option::none(),
        linkedin: if (vector::length(&linkedin) > 0) option::some(string::utf8(linkedin)) else option::none(),
        twitter: if (vector::length(&twitter) > 0) option::some(string::utf8(twitter)) else option::none(),
        personal_website: if (vector::length(&personal_website) > 0) option::some(string::utf8(personal_website)) else option::none(),
    };

    let work_preferences = WorkPreferences {
        work_types,
        hourly_rate,
        location_preference: string::utf8(location_preference),
        availability: string::utf8(availability),
    };

    let analytics = ProfileAnalytics {
        total_views: 0,
        profile_views: 0,
        contact_clicks: 0,
        project_applications: 0,
        total_reviews: 0,
        average_rating: 0,
        last_view_reset: current_time,
    };

    event::emit(CardCreated {
        card_id: devhub.card_counter,
        name: string::utf8(name),
        owner: tx_context::sender(ctx),
        niche: final_niche,
        contact: string::utf8(contact),
        platform_fee_paid: devhub.platform_fee,
        timestamp: current_time,
    });

    let devcard = DevCard {
        id: object::new(ctx),
        name: string::utf8(name),
        owner: tx_context::sender(ctx),
        niche: final_niche,
        image_url: url::new_unsafe_from_bytes(image_url),
        about: option::some(string::utf8(about)),
        avatar_walrus_blob_id,
        skills: vector::empty(),
        years_of_experience,
        technologies: string::utf8(technologies),
        work_preferences,
        contact: string::utf8(contact),
        social_links,
        portfolio: string::utf8(portfolio),
        featured_projects,
        languages,
        open_to_work: true,
        verified: false,
        reviews: vector::empty(),
        created_at: current_time,
        last_updated: current_time,
        analytics,
    };

    table::add(&mut devhub.cards, devhub.card_counter, devcard);
    
    // Map user address to their card ID
    table::add(&mut devhub.user_cards, sender, devhub.card_counter);
}

public entry fun update_card(
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
    ctx: &mut TxContext
) {
    let card = table::borrow_mut(&mut devhub.cards, card_id);
    assert!(card.owner == tx_context::sender(ctx), NOT_THE_OWNER);

    // Validate and process niche
    let final_niche = if (string::utf8(niche) == string::utf8(CUSTOM_NICHE)) {
        // If custom niche is selected, validate the custom input
        assert!(option::is_some(&custom_niche), INVALID_CUSTOM_NICHE);
        let custom_niche_input = *option::borrow(&custom_niche);
        assert!(validate_custom_niche(&custom_niche_input), INVALID_CUSTOM_NICHE);
        string::utf8(custom_niche_input)
    } else {
        // Use predefined niche
        string::utf8(niche)
    };

    card.name = string::utf8(name);
    card.niche = final_niche;
    option::swap_or_fill(&mut card.about, string::utf8(about));
    card.image_url = url::new_unsafe_from_bytes(image_url);
    card.technologies = string::utf8(technologies);
    card.contact = string::utf8(contact);
    card.portfolio = string::utf8(portfolio);
    card.featured_projects = featured_projects;
    card.languages = languages;
    card.open_to_work = open_to_work;
    card.years_of_experience = years_of_experience;

    card.work_preferences = WorkPreferences {
        work_types,
        hourly_rate,
        location_preference: string::utf8(location_preference),
        availability: string::utf8(availability),
    };

    card.social_links = SocialLinks {
        github: if (vector::length(&github) > 0) option::some(string::utf8(github)) else option::none(),
        linkedin: if (vector::length(&linkedin) > 0) option::some(string::utf8(linkedin)) else option::none(),
        twitter: if (vector::length(&twitter) > 0) option::some(string::utf8(twitter)) else option::none(),
        personal_website: if (vector::length(&personal_website) > 0) option::some(string::utf8(personal_website)) else option::none(),
    };

    card.last_updated = clock::timestamp_ms(clock);

    event::emit(CardUpdated {
        card_id,
        owner: card.owner,
        field_updated: string::utf8(b"card_updated"),
        timestamp: clock::timestamp_ms(clock),
    });
}

// Update avatar Walrus blob
public entry fun update_avatar_walrus_blob(
    devhub: &mut DevHub,
    card_id: u64,
    new_blob_id: Option<vector<u8>>,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    let card = table::borrow_mut(&mut devhub.cards, card_id);
    assert!(card.owner == tx_context::sender(ctx), NOT_THE_OWNER);

    card.avatar_walrus_blob_id = new_blob_id;
    card.last_updated = clock::timestamp_ms(clock);

    event::emit(AvatarUpdated {
        card_id,
        owner: card.owner,
        blob_id: new_blob_id,
        timestamp: clock::timestamp_ms(clock),
    });
}

// Add skills to profile
public entry fun add_skill(
    devhub: &mut DevHub,
    card_id: u64,
    skill_name: vector<u8>,
    proficiency: u8,
    years_exp: u8,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    assert!(proficiency >= 1 && proficiency <= 10, INVALID_SKILL_LEVEL);
    
    let card = table::borrow_mut(&mut devhub.cards, card_id);
    assert!(card.owner == tx_context::sender(ctx), NOT_THE_OWNER);

    let skill = SkillLevel {
        skill: string::utf8(skill_name),
        proficiency,
        years_experience: years_exp,
    };

    vector::push_back(&mut card.skills, skill);
    card.last_updated = clock::timestamp_ms(clock);

    event::emit(CardUpdated {
        card_id,
        owner: card.owner,
        field_updated: string::utf8(b"skills"),
        timestamp: clock::timestamp_ms(clock),
    });
}

// Add a review to a card
public entry fun add_review(
    devhub: &mut DevHub,
    card_id: u64,
    rating: u8,
    review_text: Option<String>,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    assert!(rating >= 1 && rating <= 5, INVALID_RATING);
    let card = table::borrow_mut(&mut devhub.cards, card_id);
    let reviewer = tx_context::sender(ctx);

    assert!(card.owner != reviewer, SELF_REVIEW_NOT_ALLOWED);

    let mut i = 0;
    while (i < vector::length(&card.reviews)) {
        let review = vector::borrow(&card.reviews, i);
        assert!(review.reviewer != reviewer, ALREADY_REVIEWED);
        i = i + 1;
    };

    let current_time = clock::timestamp_ms(clock);
    let review = Review {
        reviewer,
        rating,
        review_text,
        timestamp: current_time,
    };

    vector::push_back(&mut card.reviews, review);

    let total_reviews = (card.analytics.total_reviews + 1);
    let new_total_rating = card.analytics.average_rating * card.analytics.total_reviews + (rating as u64) * 100;
    card.analytics.average_rating = new_total_rating / total_reviews;
    card.analytics.total_reviews = total_reviews;

    event::emit(ReviewAdded {
        card_id,
        reviewer,
        rating,
        review_text,
        timestamp: current_time,
    });
}


// Track profile view - public function (can be called without entry requirement)
// Note: This function modifies state, so it still needs to be called via a transaction
// However, we can use devInspectTransactionBlock to simulate it, or create an entry wrapper
public fun track_profile_view(
    devhub: &mut DevHub,
    card_id: u64,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    let card = table::borrow_mut(&mut devhub.cards, card_id);
    let viewer = tx_context::sender(ctx);
    let current_time = clock::timestamp_ms(clock);

    // Reset profile views if needed (roughly 30 days)
    if (current_time - card.analytics.last_view_reset > 30 * 24 * 60 * 60 * 1000) {
        card.analytics.profile_views = 0;
        card.analytics.last_view_reset = current_time;
    };

    card.analytics.total_views = card.analytics.total_views + 1;
    card.analytics.profile_views = card.analytics.profile_views + 1;

    event::emit(ProfileViewed {
        card_id,
        viewer: option::some(viewer),
        timestamp: current_time,
    });
}

// Entry function wrapper to call track_profile_view from outside the module
public entry fun track_profile_view_entry(
    devhub: &mut DevHub,
    card_id: u64,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    track_profile_view(devhub, card_id, clock, ctx);
}

public entry fun create_project(
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
    mut payment: Coin<SUI>,
    clock: &Clock,
    ctx: &mut TxContext
) {
    let value = coin::value(&payment);
    assert!(value >= devhub.project_posting_fee, INSUFFICIENT_FUNDS);

    // Collect project posting fee
    let project_fee_coin = coin::split(&mut payment, devhub.project_posting_fee, ctx);
    let project_fee_balance = coin::into_balance(project_fee_coin);
    balance::join(&mut devhub.platform_fees, project_fee_balance);

    // Return excess payment
    if (coin::value(&payment) > 0) {
        transfer::public_transfer(payment, tx_context::sender(ctx));
    } else {
        coin::destroy_zero(payment);
    };

    let owner = tx_context::sender(ctx);
    let mut skills_str = vector::empty<String>();
    let num_skills = vector::length(&required_skills);
    let mut i = 0;
    while (i < num_skills) {
        vector::push_back(&mut skills_str, string::utf8(*vector::borrow(&required_skills, i)));
        i = i + 1;
    };

    let mut blob_ids_str = vector::empty<String>();
    let num_blobs = vector::length(&attachments_walrus_blob_ids);
    let mut j = 0;
    while (j < num_blobs) {
        vector::push_back(&mut blob_ids_str, string::utf8(*vector::borrow(&attachments_walrus_blob_ids, j)));
        j = j + 1;
    };

    devhub.project_counter = devhub.project_counter + 1;
    let project_id = devhub.project_counter;

    let project = Project {
        id: object::new(ctx),
        title: string::utf8(title),
        short_summary: string::utf8(short_summary),
        description: string::utf8(description),
        category: string::utf8(category),
        experience_level: string::utf8(experience_level),
        budget_min,
        budget_max,
        timeline_weeks,
        required_skills: skills_str,
        attachments_count,
        owner,
        visibility: string::utf8(visibility),
        applications_status: string::utf8(applications_status),
        devhub_messages_enabled,
        creation_timestamp: clock::timestamp_ms(clock),
        attachments_walrus_blob_ids: blob_ids_str,
    };

    event::emit(ProjectCreated {
        project_id: object::id(&project),
        owner,
        title: project.title,
    });

    table::add(&mut devhub.projects, project_id, project);
    table::add(&mut devhub.project_applications, project_id, vector::empty<ProjectApplication>());
}

public entry fun apply_to_project(
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
    let project = table::borrow(&devhub.projects, project_id);
    assert!(project.applications_status == string::utf8(OPEN), E_APPLICATIONS_NOT_OPEN);
    let applicant = tx_context::sender(ctx);

    let mut team_members_str = vector::empty<String>();
    let num_members = vector::length(&team_members);
    let mut i = 0;
    while (i < num_members) {
        vector::push_back(&mut team_members_str, string::utf8(*vector::borrow(&team_members, i)));
        i = i + 1;
    };

    let cover_letter_blob_id = if (option::is_some(&cover_letter_walrus_blob_id)) {
        option::some(string::utf8(*option::borrow(&cover_letter_walrus_blob_id)))
    } else {
        option::none()
    };

    let mut portfolio_blob_ids_str = vector::empty<String>();
    let num_portfolio_blobs = vector::length(&portfolio_walrus_blob_ids);
    let mut j = 0;
    while (j < num_portfolio_blobs) {
        vector::push_back(&mut portfolio_blob_ids_str, string::utf8(*vector::borrow(&portfolio_walrus_blob_ids, j)));
        j = j + 1;
    };

    let proposal = Proposal {
        id: object::new(ctx),
        opportunity_title: string::utf8(opportunity_title),
        proposal_title: string::utf8(proposal_title),
        team_name: string::utf8(team_name),
        contact_email: string::utf8(contact_email),
        summary: string::utf8(summary),
        budget,
        timeline_weeks,
        status: string::utf8(DRAFT),
        created_at: clock::timestamp_ms(clock),
        last_updated: clock::timestamp_ms(clock),
        owner_address: applicant,
        key_deliverables: vector::empty(),
        methodology: string::utf8(methodology),
        milestones: vector::empty(),
        team_members: vector::empty(),
        links: vector::empty(),
        comments: vector::empty(),
        files: vector::empty(),
    };

    let proposal_id = object::id(&proposal);
    vector::push_back(&mut user_proposals.proposals, proposal_id);
    vector::push_back(&mut proposals_by_status.draft, proposal_id);

    event::emit(ProposalCreated {
        proposal_id,
        owner_address: applicant,
    });

    let application = ProjectApplication {
        id: object::new(ctx),
        project_id: object::id(project),
        applicant_address: applicant,
        your_role: string::utf8(your_role),
        availability_hrs_per_week,
        start_date: string::utf8(start_date),
        expected_duration_weeks,
        proposal_summary: string::utf8(proposal_summary),
        requested_compensation,
        milestones_count,
        github_repo_link: string::utf8(github_repo_link),
        on_chain_address,
        team_members: team_members_str,
        application_status: string::utf8(PENDING),
        submission_timestamp: clock::timestamp_ms(clock),
        cover_letter_walrus_blob_id: cover_letter_blob_id,
        portfolio_walrus_blob_ids: portfolio_blob_ids_str,
        proposal_id: option::some(proposal_id),
    };

    let application_id = object::id(&application);
    let applications = table::borrow_mut(&mut devhub.project_applications, project_id);
    vector::push_back(applications, application);

    event::emit(ApplicationSubmitted {
        application_id,
        project_id: object::id(project),
        applicant,
    });

    transfer::transfer(proposal, applicant);
}

public entry fun open_applications(devhub: &mut DevHub, project_id: u64, ctx: &mut TxContext) {
    let project = table::borrow_mut(&mut devhub.projects, project_id);
    assert!(tx_context::sender(ctx) == project.owner, NOT_THE_OWNER);
    assert!(project.applications_status != string::utf8(OPEN), E_APPLICATIONS_ALREADY_OPEN);
    project.applications_status = string::utf8(OPEN);
}

public entry fun close_applications(devhub: &mut DevHub, project_id: u64, ctx: &mut TxContext) {
    let project = table::borrow_mut(&mut devhub.projects, project_id);
    assert!(tx_context::sender(ctx) == project.owner, NOT_THE_OWNER);
    assert!(project.applications_status != string::utf8(CLOSED), E_APPLICATIONS_ALREADY_CLOSED);
    project.applications_status = string::utf8(CLOSED);
}

public entry fun add_milestone_to_proposal(
    proposal: &mut Proposal,
    description: vector<u8>,
    due_date: u64,
    budget: u64,
    clock: &Clock,
    ctx: &mut TxContext
) {
    assert!(tx_context::sender(ctx) == proposal.owner_address, NOT_THE_OWNER);
    assert!(proposal.status == string::utf8(DRAFT), E_INVALID_PROPOSAL_STATUS);

    let milestone = Milestone {
        description: string::utf8(description),
        due_date,
        budget,
    };
    vector::push_back(&mut proposal.milestones, milestone);
    proposal.last_updated = clock::timestamp_ms(clock);
}

public entry fun add_attachment(
    project: &mut Project,
    blob_id: vector<u8>,
    ctx: &mut TxContext
) {
    assert!(tx_context::sender(ctx) == project.owner, NOT_THE_OWNER);
    vector::push_back(&mut project.attachments_walrus_blob_ids, string::utf8(blob_id));
    project.attachments_count = project.attachments_count + 1;
}

public entry fun remove_attachment(
    project: &mut Project,
    blob_id: vector<u8>,
    ctx: &mut TxContext
) {
    assert!(tx_context::sender(ctx) == project.owner, NOT_THE_OWNER);
    let blob_id_str = string::utf8(blob_id);
    let mut i = 0;
    while (i < vector::length(&project.attachments_walrus_blob_ids)) {
        if (*vector::borrow(&project.attachments_walrus_blob_ids, i) == blob_id_str) {
            vector::remove(&mut project.attachments_walrus_blob_ids, i);
            project.attachments_count = project.attachments_count - 1;
            return
        };
        i = i + 1;
    };
}



// Update work preferences
public entry fun update_work_preferences(
    devhub: &mut DevHub,
    card_id: u64,
    work_types: vector<String>,
    hourly_rate: Option<u64>,
    location_preference: vector<u8>,
    availability: vector<u8>,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    let card = table::borrow_mut(&mut devhub.cards, card_id);
    assert!(card.owner == tx_context::sender(ctx), NOT_THE_OWNER);

    card.work_preferences = WorkPreferences {
        work_types,
        hourly_rate,
        location_preference: string::utf8(location_preference),
        availability: string::utf8(availability),
    };
    card.last_updated = clock::timestamp_ms(clock);

    event::emit(CardUpdated {
        card_id,
        owner: card.owner,
        field_updated: string::utf8(b"work_preferences"),
        timestamp: clock::timestamp_ms(clock),
    });
}

// Activate/Deactivate card functions
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

// Delete card
public entry fun delete_card(devhub: &mut DevHub, id: u64, ctx: &mut TxContext) {
    let card = table::borrow(&devhub.cards, id);
    let owner = card.owner;
    assert!(owner == tx_context::sender(ctx), NOT_THE_OWNER);
    assert!(!card.open_to_work, CANNOT_DELETE_ACTIVE_CARD);

    let removed_card = table::remove(&mut devhub.cards, id);
    let DevCard {
        id: card_uid,
        name,
        niche,
        ..
    } = removed_card;

    // Remove user-to-card mapping
    if (table::contains(&devhub.user_cards, owner)) {
        table::remove(&mut devhub.user_cards, owner);
    };

    event::emit(CardDeleted {
        card_id: id,
        owner,
        name,
        niche,
    });

    object::delete(card_uid);
}

// === Admin Functions ===

fun is_super_admin(devhub: &DevHub, user: address): bool {
    devhub.super_admin == user
}

fun is_admin(devhub: &DevHub, user: address): bool {
    vector::contains(&devhub.admins, &user)
}

public entry fun grant_admin_role(devhub: &mut DevHub, new_admin: address, ctx: &mut TxContext) {
    assert!(is_super_admin(devhub, tx_context::sender(ctx)), NOT_SUPER_ADMIN);
    vector::push_back(&mut devhub.admins, new_admin);
    event::emit(AdminRoleGranted { admin: new_admin });
}

public entry fun revoke_admin_role(devhub: &mut DevHub, admin_to_revoke: address, ctx: &mut TxContext) {
    assert!(is_super_admin(devhub, tx_context::sender(ctx)), NOT_SUPER_ADMIN);
    let mut i = 0;
    while (i < vector::length(&devhub.admins)) {
        if (*vector::borrow(&devhub.admins, i) == admin_to_revoke) {
            vector::remove(&mut devhub.admins, i);
            event::emit(AdminRoleRevoked { admin: admin_to_revoke });
            return
        };
        i = i + 1;
    };
}

public entry fun withdraw_platform_fees(
    devhub: &mut DevHub,
    recipient: address,
    amount: u64,
    ctx: &mut TxContext,
) {
    assert!(is_super_admin(devhub, tx_context::sender(ctx)), NOT_SUPER_ADMIN);

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

public entry fun change_platform_fee(devhub: &mut DevHub, new_fee: u64, ctx: &mut TxContext) {
    assert!(is_super_admin(devhub, tx_context::sender(ctx)), NOT_SUPER_ADMIN);
    devhub.platform_fee = new_fee;
}

public entry fun change_project_posting_fee(devhub: &mut DevHub, new_fee: u64, ctx: &mut TxContext) {
    assert!(is_super_admin(devhub, tx_context::sender(ctx)), NOT_SUPER_ADMIN);
    devhub.project_posting_fee = new_fee;
}

// === View Functions ===

// Get user's card ID if they have one
public fun get_user_card_id(devhub: &DevHub, user_address: address): Option<u64> {
    if (table::contains(&devhub.user_cards, user_address)) {
        option::some(*table::borrow(&devhub.user_cards, user_address))
    } else {
        option::none()
    }
}

// Check if user has a card
public fun user_has_card(devhub: &DevHub, user_address: address): bool {
    table::contains(&devhub.user_cards, user_address)
}

public fun get_card_info(
    devhub: &DevHub,
    id: u64,
): (
    String, // name
    address, // owner
    String, // niche
    Url, // image_url
    Option<String>, // about
    u8, // years_of_experience
    String, // technologies
    String, // portfolio
    String, // contact
    bool, // open_to_work
    vector<String>, // featured_projects
    u64, // total_views
    Option<vector<u8>>, // avatar_walrus_blob_id
    u64, // created_at
    u64, // last_updated
) {
    let card = table::borrow(&devhub.cards, id);
    (
        card.name,
        card.owner,
        card.niche,
        card.image_url,
        card.about,
        card.years_of_experience,
        card.technologies,
        card.portfolio,
        card.contact,
        card.open_to_work,
        card.featured_projects,
        card.analytics.total_views,
        card.avatar_walrus_blob_id,
        card.created_at,
        card.last_updated,
    )
}

public fun get_card_skills(devhub: &DevHub, id: u64): vector<SkillLevel> {
    let card = table::borrow(&devhub.cards, id);
    card.skills
}

public fun get_card_reviews(devhub: &DevHub, id: u64): vector<Review> {
    let card = table::borrow(&devhub.cards, id);
    card.reviews
}

public fun get_project_info(devhub: &DevHub, project_id: u64): &Project {
    table::borrow(&devhub.projects, project_id)
}

public fun get_project_applications(devhub: &DevHub, project_id: u64): &vector<ProjectApplication> {
    table::borrow(&devhub.project_applications, project_id)
}

public fun get_application_details(application: &ProjectApplication): &ProjectApplication {
    application
}

public fun get_milestone_details(milestone: &Milestone): &Milestone {
    milestone
}

public fun get_application_portfolio_blobs(application: &ProjectApplication): &vector<String> {
    &application.portfolio_walrus_blob_ids
}

public fun get_application_cover_letter_blob(application: &ProjectApplication): &Option<String> {
    &application.cover_letter_walrus_blob_id
}

public fun get_card_count(devhub: &DevHub): u64 {
    devhub.card_counter
}

public fun get_project_count(devhub: &DevHub): u64 {
    devhub.project_counter
}

public fun get_super_admin(devhub: &DevHub): address {
    devhub.super_admin
}

public fun get_admins(devhub: &DevHub): vector<address> {
    devhub.admins
}

public fun get_platform_fee_balance(devhub: &DevHub): u64 {
    balance::value(&devhub.platform_fees)
}

// Search functions
public fun search_cards_by_skill(
    devhub: &DevHub,
    skill_name: String,
    min_proficiency: u8,
): vector<u64> {
    let mut results = vector::empty<u64>();
    let mut card_id = 1;
    
    while (card_id <= devhub.card_counter) {
        if (table::contains(&devhub.cards, card_id)) {
            let card = table::borrow(&devhub.cards, card_id);
            if (card.open_to_work) {
                let skills = &card.skills;
                let mut i = 0;
                let skills_len = vector::length(skills);
                
                while (i < skills_len) {
                    let skill = vector::borrow(skills, i);
                    if (skill.skill == skill_name && skill.proficiency >= min_proficiency) {
                        vector::push_back(&mut results, card_id);
                        break
                    };
                    i = i + 1;
                };
            };
        };
        card_id = card_id + 1;
    };
    
    results
}

public fun search_cards_by_location(
    devhub: &DevHub,
    location: String,
): vector<u64> {
    let mut results = vector::empty<u64>();
    let mut card_id = 1;
    
    while (card_id <= devhub.card_counter) {
        if (table::contains(&devhub.cards, card_id)) {
            let card = table::borrow(&devhub.cards, card_id);
            if (card.open_to_work && card.work_preferences.location_preference == location) {
                vector::push_back(&mut results, card_id);
            };
        };
        card_id = card_id + 1;
    };
    
    results
}

public fun search_cards_by_work_type(
    devhub: &DevHub,
    work_type: String,
): vector<u64> {
    let mut results = vector::empty<u64>();
    let mut card_id = 1;
    
    while (card_id <= devhub.card_counter) {
        if (table::contains(&devhub.cards, card_id)) {
            let card = table::borrow(&devhub.cards, card_id);
            if (card.open_to_work && vector::contains(&card.work_preferences.work_types, &work_type)) {
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
            if (card.open_to_work) {
                vector::push_back(&mut results, card_id);
            };
        };
        card_id = card_id + 1;
    };
    
    results
}

// Search functions for different niches
public fun search_cards_by_niche(
    devhub: &DevHub,
    niche: String,
): vector<u64> {
    let mut results = vector::empty<u64>();
    let mut card_id = 1;
    
    while (card_id <= devhub.card_counter) {
        if (table::contains(&devhub.cards, card_id)) {
            let card = table::borrow(&devhub.cards, card_id);
            if (card.open_to_work && card.niche == niche) {
                vector::push_back(&mut results, card_id);
            };
        };
        card_id = card_id + 1;
    };
    
    results
}

public fun get_ui_ux_designers(devhub: &DevHub): vector<u64> {
    search_cards_by_niche(devhub, string::utf8(UI_UX_DESIGNER))
}

public fun get_content_creators(devhub: &DevHub): vector<u64> {
    search_cards_by_niche(devhub, string::utf8(CONTENT_CREATOR))
}

public fun get_devops_professionals(devhub: &DevHub): vector<u64> {
    search_cards_by_niche(devhub, string::utf8(DEVOPS))
}

public fun get_project_managers(devhub: &DevHub): vector<u64> {
    search_cards_by_niche(devhub, string::utf8(PROJECT_MANAGER))
}

public fun get_community_managers(devhub: &DevHub): vector<u64> {
    search_cards_by_niche(devhub, string::utf8(COMMUNITY_MANAGER))
}

public fun get_development_directors(devhub: &DevHub): vector<u64> {
    search_cards_by_niche(devhub, string::utf8(DEVELOPMENT_DIRECTOR))
}

public fun get_product_managers(devhub: &DevHub): vector<u64> {
    search_cards_by_niche(devhub, string::utf8(PRODUCT_MANAGER))
}

public fun get_marketing_specialists(devhub: &DevHub): vector<u64> {
    search_cards_by_niche(devhub, string::utf8(MARKETING_SPECIALIST))
}

public fun get_business_analysts(devhub: &DevHub): vector<u64> {
    search_cards_by_niche(devhub, string::utf8(BUSINESS_ANALYST))
}

// Get all custom niches that have been used
public fun get_custom_niches(devhub: &DevHub): vector<String> {
    let mut custom_niches = vector::empty<String>();
    let mut card_id = 1;
    
    while (card_id <= devhub.card_counter) {
        if (table::contains(&devhub.cards, card_id)) {
            let card = table::borrow(&devhub.cards, card_id);
            let niche = &card.niche;
            // Check if this is a custom niche (not predefined)
            if (!is_predefined_niche(niche)) {
                // Check if we haven't already added this custom niche
                let mut already_exists = false;
                let mut i = 0;
                while (i < vector::length(&custom_niches)) {
                    if (*vector::borrow(&custom_niches, i) == *niche) {
                        already_exists = true;
                        break
                    };
                    i = i + 1;
                };
                if (!already_exists) {
                    vector::push_back(&mut custom_niches, *niche);
                };
            };
        };
        card_id = card_id + 1;
    };
    
    custom_niches
}

// Get all niches currently in use (predefined + custom)
public fun get_all_niches_in_use(devhub: &DevHub): vector<String> {
    let mut all_niches = vector::empty<String>();
    let mut card_id = 1;
    
    while (card_id <= devhub.card_counter) {
        if (table::contains(&devhub.cards, card_id)) {
            let card = table::borrow(&devhub.cards, card_id);
            let niche = &card.niche;
            // Check if we haven't already added this niche
            let mut already_exists = false;
            let mut i = 0;
            while (i < vector::length(&all_niches)) {
                if (*vector::borrow(&all_niches, i) == *niche) {
                    already_exists = true;
                    break
                };
                i = i + 1;
            };
            if (!already_exists) {
                vector::push_back(&mut all_niches, *niche);
            };
        };
        card_id = card_id + 1;
    };
    
    all_niches
}

// Get all available niches
public fun get_available_niches(): vector<String> {
    let mut niches = vector::empty<String>();
    vector::push_back(&mut niches, string::utf8(DEVELOPER));
    vector::push_back(&mut niches, string::utf8(UI_UX_DESIGNER));
    vector::push_back(&mut niches, string::utf8(CONTENT_CREATOR));
    vector::push_back(&mut niches, string::utf8(DEVOPS));
    vector::push_back(&mut niches, string::utf8(PROJECT_MANAGER));
    vector::push_back(&mut niches, string::utf8(COMMUNITY_MANAGER));
    vector::push_back(&mut niches, string::utf8(DEVELOPMENT_DIRECTOR));
    vector::push_back(&mut niches, string::utf8(PRODUCT_MANAGER));
    vector::push_back(&mut niches, string::utf8(MARKETING_SPECIALIST));
    vector::push_back(&mut niches, string::utf8(BUSINESS_ANALYST));
    vector::push_back(&mut niches, string::utf8(CUSTOM_NICHE));
    niches
}

// Helper function to validate custom niche input
fun validate_custom_niche(niche_input: &vector<u8>): bool {
    let length = vector::length(niche_input);
    // Custom niche must be between 2 and 50 characters
    length >= 2 && length <= 50
}

// Helper function to check if a niche is a predefined one
fun is_predefined_niche(niche: &String): bool {
    let niche_str = *niche;
    niche_str == string::utf8(DEVELOPER) ||
    niche_str == string::utf8(UI_UX_DESIGNER) ||
    niche_str == string::utf8(CONTENT_CREATOR) ||
    niche_str == string::utf8(DEVOPS) ||
    niche_str == string::utf8(PROJECT_MANAGER) ||
    niche_str == string::utf8(COMMUNITY_MANAGER) ||
    niche_str == string::utf8(DEVELOPMENT_DIRECTOR) ||
    niche_str == string::utf8(PRODUCT_MANAGER) ||
    niche_str == string::utf8(MARKETING_SPECIALIST) ||
    niche_str == string::utf8(BUSINESS_ANALYST) ||
    niche_str == string::utf8(CUSTOM_NICHE)
}

// Helper function to check if a niche is custom (not predefined)
public fun is_custom_niche(niche: &String): bool {
    !is_predefined_niche(niche)
}

public fun search_projects_by_skill(
    devhub: &DevHub,
    skill: String,
): vector<u64> {
    let mut results = vector::empty<u64>();
    let mut project_id = 1;
    
    while (project_id <= devhub.project_counter) {
        if (table::contains(&devhub.projects, project_id)) {
            let project = table::borrow(&devhub.projects, project_id);
            if (project.applications_status == string::utf8(OPEN) && 
                vector::contains(&project.required_skills, &skill)) {
                vector::push_back(&mut results, project_id);
            };
        };
        project_id = project_id + 1;
    };
    
    results
}

public fun get_open_projects(devhub: &DevHub): vector<u64> {
    let mut results = vector::empty<u64>();
    let mut project_id = 1;
    
    while (project_id <= devhub.project_counter) {
        if (table::contains(&devhub.projects, project_id)) {
            let project = table::borrow(&devhub.projects, project_id);
            if (project.applications_status == string::utf8(OPEN)) {
                vector::push_back(&mut results, project_id);
            };
        };
        project_id = project_id + 1;
    };
    
    results
}

// === Additional Management Functions ===

// Update project status (poster only)
public entry fun update_project_status(
    devhub: &mut DevHub,
    project_id: u64,
    new_status: vector<u8>,
    ctx: &mut TxContext,
) {
    let project = table::borrow_mut(&mut devhub.projects, project_id);
    assert!(project.owner == tx_context::sender(ctx), NOT_THE_OWNER);
    
    project.applications_status = string::utf8(new_status);
}

// Update project details
public entry fun update_project(
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
    clock: &Clock,
    ctx: &mut TxContext,
) {
    let project = table::borrow_mut(&mut devhub.projects, project_id);
    assert!(project.owner == tx_context::sender(ctx), NOT_THE_OWNER);
    
    // Convert skills from vector<u8> to vector<String>
    let mut skills_str = vector::empty<String>();
    let num_skills = vector::length(&required_skills);
    let mut i = 0;
    while (i < num_skills) {
        vector::push_back(&mut skills_str, string::utf8(*vector::borrow(&required_skills, i)));
        i = i + 1;
    };
    
    // Update project fields
    project.title = string::utf8(title);
    project.short_summary = string::utf8(short_summary);
    project.description = string::utf8(description);
    project.category = string::utf8(category);
    project.experience_level = string::utf8(experience_level);
    project.budget_min = budget_min;
    project.budget_max = budget_max;
    project.timeline_weeks = timeline_weeks;
    project.required_skills = skills_str;
    project.applications_status = string::utf8(applications_status);
    
    // Note: creation_timestamp and owner remain unchanged
    // attachments_walrus_blob_ids and attachments_count remain unchanged
}

// Update social links
public entry fun update_social_links(
    devhub: &mut DevHub,
    card_id: u64,
    github: vector<u8>,
    linkedin: vector<u8>,
    twitter: vector<u8>,
    personal_website: vector<u8>,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    let card = table::borrow_mut(&mut devhub.cards, card_id);
    assert!(card.owner == tx_context::sender(ctx), NOT_THE_OWNER);

    card.social_links = SocialLinks {
        github: if (vector::length(&github) > 0) option::some(string::utf8(github)) else option::none(),
        linkedin: if (vector::length(&linkedin) > 0) option::some(string::utf8(linkedin)) else option::none(),
        twitter: if (vector::length(&twitter) > 0) option::some(string::utf8(twitter)) else option::none(),
        personal_website: if (vector::length(&personal_website) > 0) option::some(string::utf8(personal_website)) else option::none(),
    };
    card.last_updated = clock::timestamp_ms(clock);

    event::emit(CardUpdated {
        card_id,
        owner: card.owner,
        field_updated: string::utf8(b"social_links"),
        timestamp: clock::timestamp_ms(clock),
    });
}


// Update languages
public entry fun update_languages(
    devhub: &mut DevHub,
    card_id: u64,
    languages: vector<String>,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    let card = table::borrow_mut(&mut devhub.cards, card_id);
    assert!(card.owner == tx_context::sender(ctx), NOT_THE_OWNER);

    card.languages = languages;
    card.last_updated = clock::timestamp_ms(clock);

    event::emit(CardUpdated {
        card_id,
        owner: card.owner,
        field_updated: string::utf8(b"languages"),
        timestamp: clock::timestamp_ms(clock),
    });
}

// Update featured projects
public entry fun update_featured_projects(
    devhub: &mut DevHub,
    card_id: u64,
    featured_projects: vector<String>,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    let card = table::borrow_mut(&mut devhub.cards, card_id);
    assert!(card.owner == tx_context::sender(ctx), NOT_THE_OWNER);

    card.featured_projects = featured_projects;
    card.last_updated = clock::timestamp_ms(clock);

    event::emit(CardUpdated {
        card_id,
        owner: card.owner,
        field_updated: string::utf8(b"featured_projects"),
        timestamp: clock::timestamp_ms(clock),
    });
}

// Remove a skill
public entry fun remove_skill(
    devhub: &mut DevHub,
    card_id: u64,
    skill_index: u64,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    let card = table::borrow_mut(&mut devhub.cards, card_id);
    assert!(card.owner == tx_context::sender(ctx), NOT_THE_OWNER);
    
    let skills_len = vector::length(&card.skills);
    assert!(skill_index < skills_len, INVALID_SKILL_LEVEL);
    
    vector::remove(&mut card.skills, skill_index);
    card.last_updated = clock::timestamp_ms(clock);

    event::emit(CardUpdated {
        card_id,
        owner: card.owner,
        field_updated: string::utf8(b"skills_removed"),
        timestamp: clock::timestamp_ms(clock),
    });
}

// Get detailed analytics
public fun get_detailed_analytics(
    devhub: &DevHub,
    card_id: u64,
): (u64, u64, u64, u64, u64, u64) {
    let card = table::borrow(&devhub.cards, card_id);
    (
        card.analytics.total_views,
        card.analytics.profile_views,
        card.analytics.contact_clicks,
        card.analytics.project_applications,
        card.analytics.total_reviews,
        card.analytics.average_rating
    )
}

// Track contact click (for analytics)
public entry fun track_contact_click(
    devhub: &mut DevHub,
    card_id: u64,
    ctx: &mut TxContext,
) {
    let card = table::borrow_mut(&mut devhub.cards, card_id);
    // Don't track owner's own clicks
    if (card.owner != tx_context::sender(ctx)) {
        card.analytics.contact_clicks = card.analytics.contact_clicks + 1;
    };
}

// Get work preferences
public fun get_work_preferences(devhub: &DevHub, card_id: u64): WorkPreferences {
    let card = table::borrow(&devhub.cards, card_id);
    card.work_preferences
}

// Get social links
public fun get_social_links(devhub: &DevHub, card_id: u64): SocialLinks {
    let card = table::borrow(&devhub.cards, card_id);
    card.social_links
}

// Get languages
public fun get_languages(devhub: &DevHub, card_id: u64): vector<String> {
    let card = table::borrow(&devhub.cards, card_id);
    card.languages
}

// Verification functions (admin only)
public entry fun verify_professional(
    devhub: &mut DevHub,
    card_id: u64,
    ctx: &mut TxContext,
) {
    assert!(is_admin(devhub, tx_context::sender(ctx)) || is_super_admin(devhub, tx_context::sender(ctx)), NOT_ADMIN);
    let card = table::borrow_mut(&mut devhub.cards, card_id);
    card.verified = true;
}

public entry fun unverify_professional(
    devhub: &mut DevHub,
    card_id: u64,
    ctx: &mut TxContext,
) {
    assert!(is_admin(devhub, tx_context::sender(ctx)) || is_super_admin(devhub, tx_context::sender(ctx)), NOT_ADMIN);
    let card = table::borrow_mut(&mut devhub.cards, card_id);
    card.verified = false;
}


// Get platform statistics
public fun get_platform_stats(devhub: &DevHub): (u64, u64, u64, u64) {
    let mut active_professionals = 0;
    let mut verified_professionals = 0;
    let mut open_projects = 0;
    
    // Count professionals (all niches)
    let mut card_id = 1;
    while (card_id <= devhub.card_counter) {
        if (table::contains(&devhub.cards, card_id)) {
            let card = table::borrow(&devhub.cards, card_id);
            if (card.open_to_work) {
                active_professionals = active_professionals + 1;
            };
            if (card.verified) {
                verified_professionals = verified_professionals + 1;
            };
        };
        card_id = card_id + 1;
    };
    
    // Count open projects
    let mut project_id = 1;
    while (project_id <= devhub.project_counter) {
        if (table::contains(&devhub.projects, project_id)) {
            let project = table::borrow(&devhub.projects, project_id);
            if (project.applications_status == string::utf8(OPEN)) {
                open_projects = open_projects + 1;
            };
        };
        project_id = project_id + 1;
    };
    
    (
        devhub.card_counter, // total professionals
        active_professionals,
        verified_professionals,
        open_projects,
    )
}

// Fee constants getters
public fun get_platform_fee(devhub: &DevHub): u64 { devhub.platform_fee }
public fun get_project_posting_fee(devhub: &DevHub): u64 { devhub.project_posting_fee }

// Messaging functions moved to `devhub::messaging`

// Channel functions moved to `devhub::channels`

// Connection functions moved to `devhub::connections`

// --- Functions from proposal.move ---

public fun create_platform_statistics(ctx: &mut TxContext) {
    transfer::share_object(PlatformStatistics {
        id: object::new(ctx),
        total_submitted: 0,
        active_in_review: 0,
        accepted_count: 0,
        rejected_count: 0,
        declined_count: 0,
    });
}

public fun create_proposals_by_status(ctx: &mut TxContext) {
    transfer::share_object(ProposalsByStatus {
        id: object::new(ctx),
        draft: vector::empty(),
        in_review: vector::empty(),
        accepted: vector::empty(),
        rejected: vector::empty(),
        declined: vector::empty(),
    });
}

public entry fun create_user_proposals_object(ctx: &mut TxContext) {
    let sender = tx_context::sender(ctx);
    let user_proposals = UserProposals {
        id: object::new(ctx),
        owner: sender,
        proposals: vector::empty(),
    };
    transfer::transfer(user_proposals, sender);
}

public entry fun create_proposal(
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
    let proposal = Proposal {
        id: object::new(ctx),
        owner_address: sender,
        status: string::utf8(DRAFT),
        opportunity_title: string::utf8(opportunity_title),
        proposal_title: string::utf8(proposal_title),
        team_name: string::utf8(team_name),
        contact_email: string::utf8(contact_email),
        summary: string::utf8(summary),
        budget,
        timeline_weeks,
        methodology: string::utf8(methodology),
        last_updated: clock::timestamp_ms(clock),
        comments: vector::empty(),
        created_at: clock::timestamp_ms(clock),
        files: vector::empty(),
        key_deliverables: vector::empty(),
        links: vector::empty(),
        milestones: vector::empty(),
        team_members: vector::empty(),
    };
    transfer::transfer(proposal, sender);
}

public entry fun edit_proposal(
    proposal: &mut Proposal,
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
    assert!(tx_context::sender(ctx) == proposal.owner_address, NOT_THE_OWNER);
    assert!(proposal.status == string::utf8(DRAFT), E_INVALID_PROPOSAL_STATUS);

    proposal.opportunity_title = string::utf8(opportunity_title);
    proposal.proposal_title = string::utf8(proposal_title);
    proposal.team_name = string::utf8(team_name);
    proposal.contact_email = string::utf8(contact_email);
    proposal.summary = string::utf8(summary);
    proposal.budget = budget;
    proposal.timeline_weeks = timeline_weeks;
    proposal.methodology = string::utf8(methodology);
    proposal.last_updated = clock::timestamp_ms(clock);
}

public entry fun add_deliverable(
    proposal: &mut Proposal,
    description: vector<u8>,
    due_date: u64,
    budget_allocation: u64,
    clock: &Clock,
    ctx: &mut TxContext
) {
    assert!(tx_context::sender(ctx) == proposal.owner_address, NOT_THE_OWNER);
    assert!(proposal.status == string::utf8(DRAFT), E_INVALID_PROPOSAL_STATUS);

    let deliverable = Deliverable {
        description: string::utf8(description),
        due_date,
        budget_allocation,
    };
    vector::push_back(&mut proposal.key_deliverables, deliverable);
    proposal.last_updated = clock::timestamp_ms(clock);
}

public entry fun add_team_member(
    proposal: &mut Proposal,
    name: vector<u8>,
    sui_address: address,
    clock: &Clock,
    ctx: &mut TxContext
) {
    assert!(tx_context::sender(ctx) == proposal.owner_address, NOT_THE_OWNER);
    assert!(proposal.status == string::utf8(DRAFT), E_INVALID_PROPOSAL_STATUS);

    let team_member = TeamMember {
        name: string::utf8(name),
        sui_address,
    };
    vector::push_back(&mut proposal.team_members, team_member);
    proposal.last_updated = clock::timestamp_ms(clock);
}

public entry fun add_link(
    proposal: &mut Proposal,
    url: vector<u8>,
    clock: &Clock,
    ctx: &mut TxContext
) {
    assert!(tx_context::sender(ctx) == proposal.owner_address, NOT_THE_OWNER);
    assert!(proposal.status == string::utf8(DRAFT), E_INVALID_PROPOSAL_STATUS);

    let link = Link {
        url: string::utf8(url),
    };
    vector::push_back(&mut proposal.links, link);
    proposal.last_updated = clock::timestamp_ms(clock);
}

public entry fun submit_proposal(
    proposal: &mut Proposal,
    stats: &mut PlatformStatistics,
    proposals_by_status: &mut ProposalsByStatus,
    clock: &Clock,
    ctx: &mut TxContext
) {
    assert!(tx_context::sender(ctx) == proposal.owner_address, NOT_THE_OWNER);
    assert!(proposal.status == string::utf8(DRAFT), E_INVALID_PROPOSAL_STATUS);

    let proposal_id = object::id(proposal);
    
    // Remove from draft list
    let mut i = 0;
    let len = vector::length(&proposals_by_status.draft);
    let mut found = false;
    while (i < len && !found) {
        if (vector::borrow(&proposals_by_status.draft, i) == &proposal_id) {
            found = true;
        } else {
            i = i + 1;
        }
    };
    if (found) {
        vector::remove(&mut proposals_by_status.draft, i);
    };
    
    vector::push_back(&mut proposals_by_status.in_review, proposal_id);

    proposal.status = string::utf8(IN_REVIEW);
    proposal.last_updated = clock::timestamp_ms(clock);

    stats.total_submitted = stats.total_submitted + 1;
    stats.active_in_review = stats.active_in_review + 1;

    event::emit(ProposalStatusUpdate {
        proposal_id: object::id(proposal),
        new_status: string::utf8(IN_REVIEW),
    });
}

public entry fun update_proposal_status(
    devhub: &DevHub,
    proposal: &mut Proposal,
    stats: &mut PlatformStatistics,
    proposals_by_status: &mut ProposalsByStatus,
    new_status: vector<u8>,
    clock: &Clock,
    ctx: &mut TxContext
) {
    assert!(is_admin(devhub, tx_context::sender(ctx)) || is_super_admin(devhub, tx_context::sender(ctx)), NOT_ADMIN);
    let new_status_str = string::utf8(new_status);
    assert!(
        new_status_str == string::utf8(ACCEPTED) ||
        new_status_str == string::utf8(REJECTED) ||
        new_status_str == string::utf8(DECLINED),
        E_INVALID_PROPOSAL_STATUS
    );

    let old_status = &proposal.status;
    let proposal_id = object::id(proposal);

    if (old_status == &string::utf8(IN_REVIEW)) {
        stats.active_in_review = stats.active_in_review - 1;
        let mut i = 0;
        let len = vector::length(&proposals_by_status.in_review);
        let mut found = false;
        while (i < len && !found) {
            if (vector::borrow(&proposals_by_status.in_review, i) == &proposal_id) {
                found = true;
            } else {
                i = i + 1;
            }
        };
        if (found) {
            vector::remove(&mut proposals_by_status.in_review, i);
        };
    };

    if (new_status_str == string::utf8(ACCEPTED)) {
        stats.accepted_count = stats.accepted_count + 1;
        vector::push_back(&mut proposals_by_status.accepted, proposal_id);
    } else if (new_status_str == string::utf8(REJECTED)) {
        stats.rejected_count = stats.rejected_count + 1;
        vector::push_back(&mut proposals_by_status.rejected, proposal_id);
    } else if (new_status_str == string::utf8(DECLINED)) {
        stats.declined_count = stats.declined_count + 1;
        vector::push_back(&mut proposals_by_status.declined, proposal_id);
    };

    proposal.status = new_status_str;
    proposal.last_updated = clock::timestamp_ms(clock);

    event::emit(ProposalStatusUpdate {
        proposal_id: object::id(proposal),
        new_status: new_status_str,
    });
}

public entry fun add_discussion_comment(
    proposal: &mut Proposal,
    text: vector<u8>,
    clock: &Clock,
    ctx: &mut TxContext
) {
    assert!(tx_context::sender(ctx) == proposal.owner_address, NOT_THE_OWNER);

    let comment = Comment {
        author_address: tx_context::sender(ctx),
        timestamp: clock::timestamp_ms(clock),
        text: string::utf8(text),
    };
    vector::push_back(&mut proposal.comments, comment);
    proposal.last_updated = clock::timestamp_ms(clock);
}

public entry fun add_attachment_to_proposal(
    proposal: &mut Proposal,
    name: vector<u8>,
    file_type: vector<u8>,
    size_kb: u64,
    url: vector<u8>,
    walrus_blob_id: Option<vector<u8>>,
    clock: &Clock,
    ctx: &mut TxContext
) {
    assert!(tx_context::sender(ctx) == proposal.owner_address, NOT_THE_OWNER);

    let blob_id = if (option::is_some(&walrus_blob_id)) {
        option::some(string::utf8(*option::borrow(&walrus_blob_id)))
    } else {
        option::none()
    };

    let file = File {
        name: string::utf8(name),
        file_type: string::utf8(file_type),
        size_kb,
        url: string::utf8(url),
        walrus_blob_id: blob_id,
    };
    vector::push_back(&mut proposal.files, file);
    proposal.last_updated = clock::timestamp_ms(clock);
}

public fun get_proposal_details(proposal: &Proposal): &Proposal {
    proposal
}

public fun get_user_proposals(user_proposals: &UserProposals): &vector<ID> {
    &user_proposals.proposals
}

public fun get_proposals_by_status(proposals_by_status: &ProposalsByStatus, status: vector<u8>): &vector<ID> {
    let status_str = string::utf8(status);
    if (status_str == string::utf8(DRAFT)) {
        &proposals_by_status.draft
    } else if (status_str == string::utf8(IN_REVIEW)) {
        &proposals_by_status.in_review
    } else if (status_str == string::utf8(ACCEPTED)) {
        &proposals_by_status.accepted
    } else if (status_str == string::utf8(REJECTED)) {
        &proposals_by_status.rejected
    } else if (status_str == string::utf8(DECLINED)) {
        &proposals_by_status.declined
    } else {
        abort(E_INVALID_PROPOSAL_STATUS)
    }
}

public fun get_platform_statistics(stats: &PlatformStatistics): (u64, u64, u64, u64, u64) {
    (
        stats.total_submitted,
        stats.active_in_review,
        stats.accepted_count,
        stats.rejected_count,
        stats.declined_count,
    )
}

// ===== SEAL ACCESS CONTROL FUNCTIONS =====
/// Seal access control function for general devhub data
/// Only registered users with active devcards can access encrypted data
entry fun seal_approve_devhub_data(
    id: vector<u8>,
    devcard: &DevCard,
    ctx: &TxContext,
) {
    let sender = tx_context::sender(ctx);
    
    // Check if the sender owns the devcard
    assert!(
        sender == devcard.owner,
        E_NOT_OWNER
    );
    
    // For now, we'll approve access if the user owns the devcard
    // In a more sophisticated implementation, you could verify the devcard is active
}

}
