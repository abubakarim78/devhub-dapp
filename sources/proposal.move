module devhub::proposal {
    use std::string::{Self, String};
    use sui::object::{Self, ID, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::clock::{Self, Clock};
    use sui::event;
    use std::vector;
    use devhub::admin;
    use std::option::{Self, Option};

    // --- Constants ---

    // Proposal Status
    const DRAFT: vector<u8> = b"Draft";
    const IN_REVIEW: vector<u8> = b"InReview";
    const ACCEPTED: vector<u8> = b"Accepted";
    const REJECTED: vector<u8> = b"Rejected";
    const DECLINED: vector<u8> = b"Declined";

    // --- Errors ---
    const E_NOT_OWNER: u64 = 1;
    const E_INVALID_STATUS: u64 = 2;

    // --- Structs ---

    public struct Deliverable has store, copy, drop {
        description: String,
        due_date: u64, // timestamp
        budget_allocation: u64,
    }

    public struct Milestone has store, copy, drop {
        description: String,
        due_date: u64, // timestamp
        budget: u64,
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

    // Events
    public struct ProposalCreated has copy, drop {
        proposal_id: ID,
        owner_address: address,
    }

    public struct ProposalStatusUpdate has copy, drop {
        proposal_id: ID,
        new_status: String,
    }

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
        let sender = tx_context::sender(ctx);
        assert!(user_proposals.owner == sender, E_NOT_OWNER);

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
            owner_address: sender,
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
            owner_address: sender,
        });

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
        assert!(tx_context::sender(ctx) == proposal.owner_address, E_NOT_OWNER);
        assert!(proposal.status == string::utf8(DRAFT), E_INVALID_STATUS);

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
        assert!(tx_context::sender(ctx) == proposal.owner_address, E_NOT_OWNER);
        assert!(proposal.status == string::utf8(DRAFT), E_INVALID_STATUS);

        let deliverable = Deliverable {
            description: string::utf8(description),
            due_date,
            budget_allocation,
        };
        vector::push_back(&mut proposal.key_deliverables, deliverable);
        proposal.last_updated = clock::timestamp_ms(clock);
    }

    public entry fun add_milestone(
        proposal: &mut Proposal,
        description: vector<u8>,
        due_date: u64,
        budget: u64,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == proposal.owner_address, E_NOT_OWNER);
        assert!(proposal.status == string::utf8(DRAFT), E_INVALID_STATUS);

        let milestone = Milestone {
            description: string::utf8(description),
            due_date,
            budget,
        };
        vector::push_back(&mut proposal.milestones, milestone);
        proposal.last_updated = clock::timestamp_ms(clock);
    }

    public entry fun add_team_member(
        proposal: &mut Proposal,
        name: vector<u8>,
        sui_address: address,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == proposal.owner_address, E_NOT_OWNER);
        assert!(proposal.status == string::utf8(DRAFT), E_INVALID_STATUS);

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
        assert!(tx_context::sender(ctx) == proposal.owner_address, E_NOT_OWNER);
        assert!(proposal.status == string::utf8(DRAFT), E_INVALID_STATUS);

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
        assert!(tx_context::sender(ctx) == proposal.owner_address, E_NOT_OWNER);
        assert!(proposal.status == string::utf8(DRAFT), E_INVALID_STATUS);

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
        _cap: &admin::SuperAdminCapability,
        proposal: &mut Proposal,
        stats: &mut PlatformStatistics,
        proposals_by_status: &mut ProposalsByStatus,
        new_status: vector<u8>,
        clock: &Clock,
        _ctx: &mut TxContext
    ) {
        let new_status_str = string::utf8(new_status);
        assert!(
            new_status_str == string::utf8(ACCEPTED) ||
            new_status_str == string::utf8(REJECTED) ||
            new_status_str == string::utf8(DECLINED),
            E_INVALID_STATUS
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
        assert!(tx_context::sender(ctx) == proposal.owner_address, E_NOT_OWNER);

        let comment = Comment {
            author_address: tx_context::sender(ctx),
            timestamp: clock::timestamp_ms(clock),
            text: string::utf8(text),
        };
        vector::push_back(&mut proposal.comments, comment);
        proposal.last_updated = clock::timestamp_ms(clock);
    }

    public entry fun add_attachment(
        proposal: &mut Proposal,
        name: vector<u8>,
        file_type: vector<u8>,
        size_kb: u64,
        url: vector<u8>,
        walrus_blob_id: Option<vector<u8>>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == proposal.owner_address, E_NOT_OWNER);

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
            abort(E_INVALID_STATUS)
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
}