module devhub::review {
    use std::string::{Self, String};
    use sui::object::{ID, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::event;
    use sui::clock::{Self, Clock};
    use devhub::devcard::{Self, Profile};

    public struct Review has key, store {
        id: UID,
        project_id: ID,
        reviewer: address,
        profile_id: ID,
        rating: u8, // 1-5
        comment: String,
        timestamp: u64,
    }

    // Events
    public struct ReviewAdded has copy, drop {
        review_id: ID,
        profile_id: ID,
        rating: u8,
    }

    const E_INVALID_RATING: u64 = 1;
    const E_CANNOT_REVIEW_SELF: u64 = 2;

    public entry fun leave_review_for_project(
        project_id: ID,
        profile: &mut Profile,
        rating: u8,
        comment: vector<u8>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let reviewer = tx_context::sender(ctx);
        
        // Use the existing leave_review function from devcard module
        devcard::leave_review(profile, rating, comment, clock, ctx);

        // Create a project-specific review record
        let review = Review {
            id: object::new(ctx),
            project_id,
            reviewer,
            profile_id: object::id(profile),
            rating,
            comment: string::utf8(comment),
            timestamp: clock::timestamp_ms(clock),
        };

        event::emit(ReviewAdded {
            review_id: object::id(&review),
            profile_id: object::id(profile),
            rating,
        });

        transfer::transfer(review, reviewer);
    }
}