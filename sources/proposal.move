module devhub::proposal {
    use std::string::{Self, String};
    use sui::event;

    // Proposal status
    const DRAFT: vector<u8> = b"Draft";
    const ACTIVE: vector<u8> = b"Active";

    public struct Proposal has key, store {
        id: UID,
        client: address,
        developer: address,
        dev_card_id: ID,
        title: String,
        timeline: String,
        milestones: vector<String>,
        status: String,
    }

    // Events
    public struct ProposalCreated has copy, drop {
        proposal_id: ID,
        client: address,
        developer: address,
    }

    public struct ProposalAccepted has copy, drop {
        proposal_id: ID,
    }

    public struct ProposalRejected has copy, drop {
        proposal_id: ID,
    }

    public fun create_proposal(
        client: address,
        developer: address,
        dev_card_id: ID,
        title: vector<u8>,
        timeline: vector<u8>,
        milestones: vector<vector<u8>>,
        ctx: &mut TxContext
    ): Proposal {
        let mut milestones_str = vector::empty<String>();
        let num_milestones = vector::length(&milestones);
        let mut i = 0;
        while (i < num_milestones) {
            vector::push_back(&mut milestones_str, string::utf8(*vector::borrow(&milestones, i)));
            i = i + 1;
        };

        let proposal = Proposal {
            id: object::new(ctx),
            client,
            developer,
            dev_card_id,
            title: string::utf8(title),
            timeline: string::utf8(timeline),
            milestones: milestones_str,
            status: string::utf8(DRAFT),
        };

        event::emit(ProposalCreated {
            proposal_id: object::id(&proposal),
            client,
            developer,
        });

        proposal
    }

    public entry fun send_proposal(proposal: Proposal, recipient: address) {
        transfer::transfer(proposal, recipient);
    }

    public entry fun accept_proposal(proposal: &mut Proposal) {
        proposal.status = string::utf8(ACTIVE);
        event::emit(ProposalAccepted { proposal_id: object::id(proposal) });
    }

    public entry fun reject_proposal(proposal: Proposal) {
        let proposal_id = object::id(&proposal);
        let Proposal { id, client: _, developer: _, dev_card_id: _, title: _, timeline: _, milestones: _, status: _ } = proposal;
        object::delete(id);
        event::emit(ProposalRejected { proposal_id });
        // The proposal object is consumed, effectively deleting it.
    }
}
