module devhub::devcard {
    use std::string::{Self, String};
    use sui::url::{Self, Url};
    use sui::object::{UID, ID};
    use sui::event;
    use sui::tx_context::{Self, TxContext};
    use sui::table::{Self, Table};
    use sui::clock::{Self, Clock};
    use std::option::{Self, Option};

    // Errors
    const E_PROFILE_ALREADY_EXISTS: u64 = 1;
    const E_TERMS_NOT_ACCEPTED: u64 = 2;
    const E_NOT_OWNER: u64 = 3;
    const E_PROJECT_NOT_FOUND: u64 = 4;
    const E_EXPERIENCE_NOT_FOUND: u64 = 5;
    const E_INVALID_RATING: u64 = 6;

    public struct Profile has key, store {
        id: UID,
        display_name: String,
        handle: String,
        role: String,
        location: String,
        bio: String,
        profile_image_url: Url,
        quick_highlights: vector<String>,
        website_url: Url,
        github_username: String,
        twitter_handle: String,
        email: String,
        sui_address: address,
        ens_handle: String,
        hourly_rate: u64,
        availability_status: bool,
        join_date: u64,
        profile_completeness: u8, // Calculated off-chain
        public_profile: bool,
        terms_accepted: bool,
        skills: vector<String>,
        average_rating: u64,
        total_reviews: u64,
        avatar_walrus_blob_id: Option<String>,
        cv_walrus_blob_id: Option<String>,
    }

    public struct Project has key, store {
        id: UID,
        profile_id: ID,
        project_url: Url,
        tagline: String,
        short_description: String,
        cover_image_url: Url,
        cover_image_walrus_blob_id: Option<String>,
    }

    public struct Experience has key, store {
        id: UID,
        profile_id: ID,
        company: String,
        role: String,
        duration: String,
        description: String,
    }

    public struct Review has key, store {
        id: UID,
        profile_id: ID,
        reviewer_sui_address: address,
        rating: u8, // 1-5
        comment: String,
        timestamp: u64,
    }

    public struct ProfileRegistry has key, store {
        id: UID,
        user_profiles: Table<address, ID>,
    }

    public fun init_registry(ctx: &mut TxContext): ProfileRegistry {
        ProfileRegistry {
            id: object::new(ctx),
            user_profiles: table::new(ctx),
        }
    }

    public fun create_profile(
        registry: &mut ProfileRegistry,
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
    ): Profile {
        let owner = tx_context::sender(ctx);
        assert!(!table::contains(&registry.user_profiles, owner), E_PROFILE_ALREADY_EXISTS);
        assert!(terms_accepted, E_TERMS_NOT_ACCEPTED);

        let avatar_blob_id = if (option::is_some(&avatar_walrus_blob_id)) {
            option::some(string::utf8(*option::borrow(&avatar_walrus_blob_id)))
        } else {
            option::none()
        };

        let cv_blob_id = if (option::is_some(&cv_walrus_blob_id)) {
            option::some(string::utf8(*option::borrow(&cv_walrus_blob_id)))
        } else {
            option::none()
        };

        let profile = Profile {
            id: object::new(ctx),
            display_name: string::utf8(display_name),
            handle: string::utf8(handle),
            role: string::utf8(role),
            location: string::utf8(location),
            bio: string::utf8(bio),
            profile_image_url: url::new_unsafe_from_bytes(profile_image_url),
            quick_highlights: vector::empty(),
            website_url: url::new_unsafe_from_bytes(website_url),
            github_username: string::utf8(github_username),
            twitter_handle: string::utf8(twitter_handle),
            email: string::utf8(email),
            sui_address: owner,
            ens_handle: string::utf8(ens_handle),
            hourly_rate,
            availability_status,
            join_date: clock::timestamp_ms(clock),
            profile_completeness: 0,
            public_profile,
            terms_accepted,
            skills: vector::empty(),
            average_rating: 0,
            total_reviews: 0,
            avatar_walrus_blob_id: avatar_blob_id,
            cv_walrus_blob_id: cv_blob_id,
        };

        table::add(&mut registry.user_profiles, owner, object::id(&profile));
        profile
    }

    public entry fun update_profile(
        profile: &mut Profile,
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
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == profile.sui_address, E_NOT_OWNER);
        profile.display_name = string::utf8(display_name);
        profile.handle = string::utf8(handle);
        profile.role = string::utf8(role);
        profile.location = string::utf8(location);
        profile.bio = string::utf8(bio);
        profile.profile_image_url = url::new_unsafe_from_bytes(profile_image_url);
        profile.website_url = url::new_unsafe_from_bytes(website_url);
        profile.github_username = string::utf8(github_username);
        profile.twitter_handle = string::utf8(twitter_handle);
        profile.email = string::utf8(email);
        profile.ens_handle = string::utf8(ens_handle);
        profile.hourly_rate = hourly_rate;
        profile.availability_status = availability_status;
    }

    public entry fun set_profile_visibility(profile: &mut Profile, public_profile: bool, ctx: &mut TxContext) {
        assert!(tx_context::sender(ctx) == profile.sui_address, E_NOT_OWNER);
        profile.public_profile = public_profile;
    }

    public entry fun add_skill(profile: &mut Profile, skill: vector<u8>, ctx: &mut TxContext) {
        assert!(tx_context::sender(ctx) == profile.sui_address, E_NOT_OWNER);
        vector::push_back(&mut profile.skills, string::utf8(skill));
    }

    public entry fun remove_skill(profile: &mut Profile, skill: vector<u8>, ctx: &mut TxContext) {
        assert!(tx_context::sender(ctx) == profile.sui_address, E_NOT_OWNER);
        let skill_str = string::utf8(skill);
        let mut i = 0;
        while (i < vector::length(&profile.skills)) {
            if (*vector::borrow(&profile.skills, i) == skill_str) {
                vector::remove(&mut profile.skills, i);
                return
            };
            i = i + 1;
        };
    }

    public entry fun add_project(
        profile: &Profile,
        project_url: vector<u8>,
        tagline: vector<u8>,
        short_description: vector<u8>,
        cover_image_url: vector<u8>,
        cover_image_walrus_blob_id: Option<vector<u8>>,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == profile.sui_address, E_NOT_OWNER);
        let blob_id = if (option::is_some(&cover_image_walrus_blob_id)) {
            option::some(string::utf8(*option::borrow(&cover_image_walrus_blob_id)))
        } else {
            option::none()
        };
        let project = Project {
            id: object::new(ctx),
            profile_id: object::id(profile),
            project_url: url::new_unsafe_from_bytes(project_url),
            tagline: string::utf8(tagline),
            short_description: string::utf8(short_description),
            cover_image_url: url::new_unsafe_from_bytes(cover_image_url),
            cover_image_walrus_blob_id: blob_id,
        };
        transfer::transfer(project, tx_context::sender(ctx));
    }

    public entry fun update_project(
        project: &mut Project,
        profile: &Profile,
        project_url: vector<u8>,
        tagline: vector<u8>,
        short_description: vector<u8>,
        cover_image_url: vector<u8>,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == profile.sui_address, E_NOT_OWNER);
        assert!(project.profile_id == object::id(profile), E_NOT_OWNER);
        project.project_url = url::new_unsafe_from_bytes(project_url);
        project.tagline = string::utf8(tagline);
        project.short_description = string::utf8(short_description);
        project.cover_image_url = url::new_unsafe_from_bytes(cover_image_url);
    }

    public entry fun remove_project(project: Project, profile: &Profile, ctx: &mut TxContext) {
        assert!(tx_context::sender(ctx) == profile.sui_address, E_NOT_OWNER);
        assert!(project.profile_id == object::id(profile), E_NOT_OWNER);
        let Project { id, .. } = project;
        object::delete(id);
    }

    public entry fun add_experience(
        profile: &Profile,
        company: vector<u8>,
        role: vector<u8>,
        duration: vector<u8>,
        description: vector<u8>,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == profile.sui_address, E_NOT_OWNER);
        let experience = Experience {
            id: object::new(ctx),
            profile_id: object::id(profile),
            company: string::utf8(company),
            role: string::utf8(role),
            duration: string::utf8(duration),
            description: string::utf8(description),
        };
        transfer::transfer(experience, tx_context::sender(ctx));
    }

    public entry fun update_experience(
        experience: &mut Experience,
        profile: &Profile,
        company: vector<u8>,
        role: vector<u8>,
        duration: vector<u8>,
        description: vector<u8>,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == profile.sui_address, E_NOT_OWNER);
        assert!(experience.profile_id == object::id(profile), E_NOT_OWNER);
        experience.company = string::utf8(company);
        experience.role = string::utf8(role);
        experience.duration = string::utf8(duration);
        experience.description = string::utf8(description);
    }

    public entry fun remove_experience(experience: Experience, profile: &Profile, ctx: &mut TxContext) {
        assert!(tx_context::sender(ctx) == profile.sui_address, E_NOT_OWNER);
        assert!(experience.profile_id == object::id(profile), E_NOT_OWNER);
        let Experience { id, .. } = experience;
        object::delete(id);
    }

    public entry fun leave_review(
        profile: &mut Profile,
        rating: u8,
        comment: vector<u8>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let reviewer = tx_context::sender(ctx);
        assert!(reviewer != profile.sui_address, E_NOT_OWNER);
        assert!(rating >= 1 && rating <= 5, E_INVALID_RATING);

        let review = Review {
            id: object::new(ctx),
            profile_id: object::id(profile),
            reviewer_sui_address: reviewer,
            rating,
            comment: string::utf8(comment),
            timestamp: clock::timestamp_ms(clock),
        };

        profile.total_reviews = profile.total_reviews + 1;
        profile.average_rating = (profile.average_rating * (profile.total_reviews - 1) + (rating as u64)) / profile.total_reviews;

        transfer::transfer(review, profile.sui_address);
    }

    public entry fun update_avatar_walrus_blob(
        profile: &mut Profile,
        new_blob_id: Option<vector<u8>>,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == profile.sui_address, E_NOT_OWNER);

        let new_blob_id_option = if (option::is_some(&new_blob_id)) {
            option::some(string::utf8(*option::borrow(&new_blob_id)))
        } else {
            option::none()
        };

        profile.avatar_walrus_blob_id = new_blob_id_option;
    }

    public entry fun update_cv_walrus_blob(
        profile: &mut Profile,
        new_blob_id: Option<vector<u8>>,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == profile.sui_address, E_NOT_OWNER);

        let new_blob_id_option = if (option::is_some(&new_blob_id)) {
            option::some(string::utf8(*option::borrow(&new_blob_id)))
        } else {
            option::none()
        };

        profile.cv_walrus_blob_id = new_blob_id_option;
    }

    public entry fun update_project_cover_image_walrus_blob(
        project: &mut Project,
        profile: &Profile,
        new_blob_id: Option<vector<u8>>,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == profile.sui_address, E_NOT_OWNER);
        assert!(project.profile_id == object::id(profile), E_NOT_OWNER);

        let new_blob_id_option = if (option::is_some(&new_blob_id)) {
            option::some(string::utf8(*option::borrow(&new_blob_id)))
        } else {
            option::none()
        };

        project.cover_image_walrus_blob_id = new_blob_id_option;
    }

    public fun user_has_profile(registry: &ProfileRegistry, user: address): bool {
        table::contains(&registry.user_profiles, user)
    }

    public fun get_user_profile_id(registry: &ProfileRegistry, user: address): Option<ID> {
        if (table::contains(&registry.user_profiles, user)) {
            std::option::some(*table::borrow(&registry.user_profiles, user))
        } else {
            std::option::none()
        }
    }
}