module devhub::card;

use std::string::{Self, String};
use sui::url::Url;
use sui::event;

use devhub::constants;



public struct SkillLevel has store, copy, drop {
    skill: String,
    proficiency: u8, 
    years_experience: u8,
}

public struct SocialLinks has store, copy, drop {
    github: Option<String>,
    linkedin: Option<String>,
    twitter: Option<String>,
    personal_website: Option<String>,
}

public struct WorkPreferences has store, copy, drop {
    work_types: vector<String>,
    hourly_rate: Option<u64>,
    location_preference: String,
    availability: String, 
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



public fun new_social_links(
    github: Option<String>,
    linkedin: Option<String>,
    twitter: Option<String>,
    personal_website: Option<String>,
): SocialLinks {
    SocialLinks {
        github,
        linkedin,
        twitter,
        personal_website,
    }
}

public fun new_work_preferences(
    work_types: vector<String>,
    hourly_rate: Option<u64>,
    location_preference: String,
    availability: String,
): WorkPreferences {
    WorkPreferences {
        work_types,
        hourly_rate,
        location_preference,
        availability,
    }
}



public struct DevCard has key, store {
    id: UID,
    owner: address,
   
    name: String,
    niche: String,
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

// ===== EVENTS =====

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

public struct CardDeleted has copy, drop {
    card_id: u64,
    owner: address,
    name: String,
    niche: String,
}

public struct AvatarUpdated has copy, drop {
    card_id: u64,
    owner: address,
    blob_id: Option<vector<u8>>,
    timestamp: u64,
}



public fun validate_custom_niche(niche_input: &vector<u8>): bool {
    let length = vector::length(niche_input);
    length >= 2 && length <= 50
}

public fun is_predefined_niche(niche: &String): bool {
    let niche_str = *niche;
    niche_str == string::utf8(b"Developer") ||
    niche_str == string::utf8(b"UI/UX Designer") ||
    niche_str == string::utf8(b"Content Creator") ||
    niche_str == string::utf8(b"DevOps") ||
    niche_str == string::utf8(b"Project Manager") ||
    niche_str == string::utf8(b"Community Manager") ||
    niche_str == string::utf8(b"Development Director") ||
    niche_str == string::utf8(b"Product Manager") ||
    niche_str == string::utf8(b"Marketing Specialist") ||
    niche_str == string::utf8(b"Business Analyst") ||
    niche_str == string::utf8(b"Custom")
}

public fun is_custom_niche(niche: &String): bool {
    !is_predefined_niche(niche)
}



public fun create_card(
    owner: address,
    name: String,
    niche: String,
    image_url: Url,
    about: Option<String>,
    years_of_experience: u8,
    technologies: String,
    portfolio: String,
    featured_projects: vector<String>,
    contact: String,
    social_links: SocialLinks,
    work_preferences: WorkPreferences,
    languages: vector<String>,
    avatar_walrus_blob_id: Option<vector<u8>>,
    current_time: u64,
    ctx: &mut TxContext,
): DevCard {
    DevCard {
        id: object::new(ctx),
        owner,
        name,
        niche,
        image_url,
        about,
        avatar_walrus_blob_id,
        skills: vector::empty(),
        years_of_experience,
        technologies,
        work_preferences,
        contact,
        social_links,
        portfolio,
        featured_projects,
        languages,
        open_to_work: true,
        verified: false,
        reviews: vector::empty(),
        created_at: current_time,
        last_updated: current_time,
        analytics: ProfileAnalytics {
            total_views: 0,
            profile_views: 0,
            contact_clicks: 0,
            project_applications: 0,
            total_reviews: 0,
            average_rating: 0,
            last_view_reset: current_time,
        },
    }
}



public fun update_basic_info(
    card: &mut DevCard,
    name: String,
    niche: String,
    about: String,
    image_url: Url,
    technologies: String,
    contact: String,
    portfolio: String,
    years_of_experience: u8,
    current_time: u64,
) {
    card.name = name;
    card.niche = niche;
    option::swap_or_fill(&mut card.about, about);
    card.image_url = image_url;
    card.technologies = technologies;
    card.contact = contact;
    card.portfolio = portfolio;
    card.years_of_experience = years_of_experience;
    card.last_updated = current_time;
}

public fun update_avatar_blob(card: &mut DevCard, new_blob_id: Option<vector<u8>>, current_time: u64) {
    card.avatar_walrus_blob_id = new_blob_id;
    card.last_updated = current_time;
}

public fun update_work_preferences(card: &mut DevCard, preferences: WorkPreferences, current_time: u64) {
    card.work_preferences = preferences;
    card.last_updated = current_time;
}

public fun update_social_links(card: &mut DevCard, links: SocialLinks, current_time: u64) {
    card.social_links = links;
    card.last_updated = current_time;
}

public fun update_languages(card: &mut DevCard, languages: vector<String>, current_time: u64) {
    card.languages = languages;
    card.last_updated = current_time;
}

public fun update_featured_projects(card: &mut DevCard, projects: vector<String>, current_time: u64) {
    card.featured_projects = projects;
    card.last_updated = current_time;
}

public fun update_lists(
    card: &mut DevCard,
    featured_projects: vector<String>,
    languages: vector<String>,
    current_time: u64,
) {
    card.featured_projects = featured_projects;
    card.languages = languages;
    card.last_updated = current_time;
}

public fun set_open_to_work(card: &mut DevCard, status: bool) {
    card.open_to_work = status;
}

public fun set_verified(card: &mut DevCard, verified: bool) {
    card.verified = verified;
}

// ===== SKILLS MANAGEMENT =====

public fun create_skill_level(skill: String, proficiency: u8, years_experience: u8): SkillLevel {
    SkillLevel {
        skill,
        proficiency,
        years_experience,
    }
}

public fun add_skill(card: &mut DevCard, skill: SkillLevel, current_time: u64) {
    vector::push_back(&mut card.skills, skill);
    card.last_updated = current_time;
}

public fun remove_skill(card: &mut DevCard, skill_index: u64, current_time: u64) {
    vector::remove(&mut card.skills, skill_index);
    card.last_updated = current_time;
}

// ===== REVIEWS =====

public fun add_review(
    card: &mut DevCard,
    reviewer: address,
    rating: u8,
    review_text: Option<String>,
    timestamp: u64,
) {
    assert!(card.owner != reviewer, constants::SELF_REVIEW_NOT_ALLOWED());
    assert!(rating >= 1 && rating <= 5, constants::INVALID_RATING());
    
    // Check if reviewer already reviewed
    let mut i = 0;
    while (i < vector::length(&card.reviews)) {
        let review = vector::borrow(&card.reviews, i);
        assert!(review.reviewer != reviewer, constants::ALREADY_REVIEWED());
        i = i + 1;
    };
    
    let review = Review {
        reviewer,
        rating,
        review_text,
        timestamp,
    };
    
    vector::push_back(&mut card.reviews, review);
    
    // Update analytics
    let total_reviews = card.analytics.total_reviews + 1;
    let new_total_rating = card.analytics.average_rating * card.analytics.total_reviews + (rating as u64) * 100;
    card.analytics.average_rating = new_total_rating / total_reviews;
    card.analytics.total_reviews = total_reviews;
}

// ===== ANALYTICS =====

public fun track_profile_view(card: &mut DevCard, current_time: u64) {
    // Reset profile views if needed (roughly 30 days)
    if (current_time - card.analytics.last_view_reset > 30 * 24 * 60 * 60 * 1000) {
        card.analytics.profile_views = 0;
        card.analytics.last_view_reset = current_time;
    };
    
    card.analytics.total_views = card.analytics.total_views + 1;
    card.analytics.profile_views = card.analytics.profile_views + 1;
}

public fun track_contact_click(card: &mut DevCard, viewer: address) {
    if (card.owner != viewer) {
        card.analytics.contact_clicks = card.analytics.contact_clicks + 1;
    };
}

// ===== VIEW FUNCTIONS =====

public fun get_owner(card: &DevCard): address { card.owner }
public fun get_name(card: &DevCard): String { card.name }
public fun get_niche(card: &DevCard): String { card.niche }
public fun get_open_to_work(card: &DevCard): bool { card.open_to_work }
public fun get_verified(card: &DevCard): bool { card.verified }
public fun get_skills(card: &DevCard): &vector<SkillLevel> { &card.skills }
public fun get_reviews(card: &DevCard): &vector<Review> { &card.reviews }
public fun get_work_preferences(card: &DevCard): WorkPreferences { card.work_preferences }
public fun get_social_links(card: &DevCard): SocialLinks { card.social_links }
public fun get_languages(card: &DevCard): &vector<String> { &card.languages }
public fun get_technologies(card: &DevCard): String { card.technologies }

public fun get_analytics(card: &DevCard): (u64, u64, u64, u64, u64, u64) {
    (
        card.analytics.total_views,
        card.analytics.profile_views,
        card.analytics.contact_clicks,
        card.analytics.project_applications,
        card.analytics.total_reviews,
        card.analytics.average_rating
    )
}

public fun get_info(
    card: &DevCard,
): (String, address, String, Url, Option<String>, u8, String, String, String, bool, vector<String>, u64, Option<vector<u8>>, u64, u64) {
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

// ===== EVENTS =====

public fun emit_card_created(
    card_id: u64,
    owner: address,
    name: String,
    niche: String,
    contact: String,
    platform_fee_paid: u64,
    timestamp: u64,
) {
    event::emit(CardCreated {
        card_id,
        owner,
        name,
        niche,
        contact,
        platform_fee_paid,
        timestamp,
    });
}

public fun emit_card_updated(card_id: u64, owner: address, field_updated: String, timestamp: u64) {
    event::emit(CardUpdated { card_id, owner, field_updated, timestamp });
}

public fun emit_profile_viewed(card_id: u64, viewer: Option<address>, timestamp: u64) {
    event::emit(ProfileViewed { card_id, viewer, timestamp });
}

public fun emit_review_added(
    card_id: u64,
    reviewer: address,
    rating: u8,
    review_text: Option<String>,
    timestamp: u64,
) {
    event::emit(ReviewAdded { card_id, reviewer, rating, review_text, timestamp });
}

public fun emit_card_deleted(card_id: u64, owner: address, name: String, niche: String) {
    event::emit(CardDeleted { card_id, owner, name, niche });
}

public fun emit_avatar_updated(card_id: u64, owner: address, blob_id: Option<vector<u8>>, timestamp: u64) {
    event::emit(AvatarUpdated { card_id, owner, blob_id, timestamp });
}

// ===== SEAL ACCESS CONTROL =====

entry fun seal_approve_devhub_data(
    _id: vector<u8>,
    devcard: &DevCard,
    ctx: &TxContext,
) {
    let sender = tx_context::sender(ctx);
    assert!(sender == devcard.owner, constants::E_NOT_OWNER());
}

// ===== DESTRUCTOR =====

public fun destroy_card(card: DevCard): (UID, String, String) {
    let DevCard {
        id,
        name,
        niche,
        owner: _,
        about: _,
        image_url: _,
        avatar_walrus_blob_id: _,
        skills: _,
        years_of_experience: _,
        technologies: _,
        work_preferences: _,
        contact: _,
        social_links: _,
        portfolio: _,
        featured_projects: _,
        languages: _,
        open_to_work: _,
        verified: _,
        reviews: _,
        created_at: _,
        last_updated: _,
        analytics: _,
    } = card;
    (id, name, niche)
}

