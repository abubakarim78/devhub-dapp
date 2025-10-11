module devhub::review {
    use std::string::{Self, String};
    use sui::object::{ID, UID};
    use sui::transfer;
    use sui::tx_context::TxContext;
    use sui::event;
    use devhub::devcard::{Self, DevCard};

    public struct Review has key, store {
        id: UID,
        project_id: ID,
        reviewer: address,
        dev_card_id: ID,
        rating: u8, // 1-5
        comment: String,
    }

    // Events
    public struct ReviewAdded has copy, drop {
        review_id: ID,
        dev_card_id: ID,
        rating: u8,
    }

    public fun leave_review(
        project_id: ID,
        dev_card: &mut DevCard,
        rating: u8,
        comment: vector<u8>,
        ctx: &mut TxContext
    ) {
        let reviewer = tx_context::sender(ctx);
        assert!(rating >= 1 && rating <= 5, 1); // E_INVALID_RATING

        let review = Review {
            id: object::new(ctx),
            project_id,
            reviewer,
            dev_card_id: object::id(dev_card),
            rating,
            comment: string::utf8(comment),
        };

        // This is a simplified rating update. A real implementation would be more robust.
        let current_rating = devcard::get_rating(dev_card);
        let new_rating = (current_rating + rating) / 2;
        devcard::set_rating(dev_card, new_rating);

        event::emit(ReviewAdded {
            review_id: object::id(&review),
            dev_card_id: object::id(dev_card),
            rating,
        });

        transfer::transfer(review, reviewer);
    }

}
